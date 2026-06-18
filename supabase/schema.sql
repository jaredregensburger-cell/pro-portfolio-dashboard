-- ============================================================
-- FOLIO — INVESTOR DASHBOARD
-- Full PostgreSQL Schema for Supabase
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE asset_class AS ENUM (
  'equity',
  'crypto',
  'etf',
  'bond',
  'commodity',
  'cash'
);

CREATE TYPE transaction_type AS ENUM (
  'buy',
  'sell',
  'dividend',
  'transfer_in',
  'transfer_out',
  'fee',
  'split',
  'interest'
);

CREATE TYPE transaction_status AS ENUM (
  'completed',
  'pending',
  'failed',
  'cancelled'
);

CREATE TYPE snapshot_interval AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

-- ─── TABLE: users (extends auth.users) ───────────────────────────────────────
-- Supabase Auth handles password/email. This table stores profile data.

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  currency      TEXT NOT NULL DEFAULT 'USD',
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS
  'User profile data extending Supabase Auth. One row per authenticated user.';

-- ─── TABLE: portfolios ───────────────────────────────────────────────────────

CREATE TABLE public.portfolios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  currency      TEXT NOT NULL DEFAULT 'USD',
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT portfolios_name_not_empty CHECK (char_length(name) >= 1),
  CONSTRAINT portfolios_currency_length CHECK (char_length(currency) = 3)
);

COMMENT ON TABLE public.portfolios IS
  'A portfolio belongs to one user and groups assets together.';
COMMENT ON COLUMN public.portfolios.currency IS
  'ISO 4217 currency code, e.g. USD, EUR, GBP.';

-- Ensure only one default portfolio per user
CREATE UNIQUE INDEX portfolios_one_default_per_user
  ON public.portfolios (user_id)
  WHERE is_default = TRUE;

-- ─── TABLE: assets ───────────────────────────────────────────────────────────
-- An asset is a position (e.g. AAPL, BTC) within a portfolio.
-- quantity and avg_cost_basis are DERIVED from transactions — stored here
-- for read performance and are kept in sync via triggers.

CREATE TABLE public.assets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,
  name            TEXT NOT NULL,
  asset_class     asset_class NOT NULL,
  -- Derived fields (computed from transactions, kept in sync via trigger)
  quantity        NUMERIC(20, 8) NOT NULL DEFAULT 0,
  avg_cost_basis  NUMERIC(20, 8) NOT NULL DEFAULT 0,
  -- Market data (updated from external price feed)
  current_price   NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  logo_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT assets_ticker_not_empty     CHECK (char_length(ticker) >= 1),
  CONSTRAINT assets_quantity_non_neg     CHECK (quantity >= 0),
  CONSTRAINT assets_avg_cost_non_neg     CHECK (avg_cost_basis >= 0),
  CONSTRAINT assets_current_price_non_neg CHECK (current_price >= 0),
  -- One ticker per portfolio (you can't have two AAPL rows in the same portfolio)
  CONSTRAINT assets_unique_ticker_per_portfolio UNIQUE (portfolio_id, ticker)
);

COMMENT ON TABLE public.assets IS
  'Individual positions within a portfolio. quantity and avg_cost_basis are '
  'derived from transactions and kept in sync via trigger.';
COMMENT ON COLUMN public.assets.quantity IS
  'Total quantity held. Derived: SUM(buy qty) - SUM(sell qty). Never set manually.';
COMMENT ON COLUMN public.assets.avg_cost_basis IS
  'Weighted average cost per unit. Derived from buy transactions. Never set manually.';
COMMENT ON COLUMN public.assets.current_price IS
  'Last known market price. Updated by external price feed or manually.';

-- ─── TABLE: transactions ─────────────────────────────────────────────────────
-- The single source of truth. Portfolio value is ALWAYS calculated from here.
-- NEVER store derived totals anywhere else.

CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_id        UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  -- Transaction identity
  type            transaction_type NOT NULL,
  status          transaction_status NOT NULL DEFAULT 'completed',
  -- Financial data
  quantity        NUMERIC(20, 8),           -- NULL for non-position transactions (fees, dividends in cash)
  price           NUMERIC(20, 8),           -- Price per unit at time of transaction
  total_amount    NUMERIC(20, 8) NOT NULL,  -- quantity * price (or the total cash amount)
  fee             NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  -- Metadata
  note            TEXT,
  external_id     TEXT,                     -- For broker import deduplication
  executed_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT transactions_fee_non_neg         CHECK (fee >= 0),
  CONSTRAINT transactions_total_amount_check  CHECK (total_amount > 0),
  CONSTRAINT transactions_quantity_check      CHECK (quantity IS NULL OR quantity > 0),
  CONSTRAINT transactions_price_check         CHECK (price IS NULL OR price > 0),
  -- buy/sell must have both quantity and price
  CONSTRAINT transactions_buy_sell_requires_qty_price CHECK (
    type NOT IN ('buy', 'sell') OR (quantity IS NOT NULL AND price IS NOT NULL)
  )
);

COMMENT ON TABLE public.transactions IS
  'The ledger. Single source of truth for all portfolio values. '
  'Portfolio totals are ALWAYS computed from this table, never stored.';
COMMENT ON COLUMN public.transactions.total_amount IS
  'Cash amount of this transaction. For buy/sell: quantity * price. '
  'For dividends/fees: the cash value. ALWAYS positive.';
COMMENT ON COLUMN public.transactions.external_id IS
  'Optional broker/exchange identifier for deduplication on import.';

-- Index for common query patterns
CREATE INDEX transactions_portfolio_id_idx     ON public.transactions (portfolio_id);
CREATE INDEX transactions_asset_id_idx         ON public.transactions (asset_id);
CREATE INDEX transactions_executed_at_idx      ON public.transactions (executed_at DESC);
CREATE INDEX transactions_type_idx             ON public.transactions (type);
CREATE INDEX transactions_external_id_idx      ON public.transactions (external_id) WHERE external_id IS NOT NULL;

-- ─── TABLE: portfolio_snapshots ──────────────────────────────────────────────
-- Point-in-time snapshots for charting. These ARE stored for performance —
-- calculating from all transactions every chart render is too expensive.
-- BUT they are read-only from the app layer; written only by backend jobs.

CREATE TABLE public.portfolio_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id    UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  -- The snapshot value = SUM of (asset.quantity * asset.price_at_date) at this moment
  total_value     NUMERIC(20, 8) NOT NULL,
  total_cost      NUMERIC(20, 8) NOT NULL,  -- Sum of all buy costs up to this point
  currency        TEXT NOT NULL DEFAULT 'USD',
  interval        snapshot_interval NOT NULL DEFAULT 'daily',
  snapshot_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT snapshots_total_value_non_neg CHECK (total_value >= 0),
  CONSTRAINT snapshots_total_cost_non_neg  CHECK (total_cost >= 0),
  -- One snapshot per portfolio per day
  CONSTRAINT snapshots_unique_date UNIQUE (portfolio_id, snapshot_date, interval)
);

COMMENT ON TABLE public.portfolio_snapshots IS
  'Pre-computed daily portfolio values for chart rendering. Written by cron jobs only. '
  'Values are derived from transactions at each point in time, never from stored totals.';

CREATE INDEX snapshots_portfolio_date_idx
  ON public.portfolio_snapshots (portfolio_id, snapshot_date DESC);

-- ============================================================
-- TRIGGERS
-- Keep assets.quantity and assets.avg_cost_basis in sync
-- with the transactions table automatically
-- ============================================================

-- Helper function: recalculate derived asset fields from transactions
CREATE OR REPLACE FUNCTION recalculate_asset_position(p_asset_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_quantity        NUMERIC(20, 8);
  v_avg_cost_basis  NUMERIC(20, 8);
  v_total_buy_qty   NUMERIC(20, 8);
  v_total_buy_cost  NUMERIC(20, 8);
BEGIN
  -- Calculate total quantity: buys add, sells subtract
  SELECT
    COALESCE(SUM(CASE WHEN type = 'buy'  THEN quantity ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'buy'  THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'buy'  THEN total_amount + fee ELSE 0 END), 0)
  INTO v_quantity, v_total_buy_qty, v_total_buy_cost
  FROM public.transactions
  WHERE asset_id = p_asset_id
    AND status = 'completed'
    AND type IN ('buy', 'sell');

  -- Weighted average cost = total cost paid / total shares bought
  IF v_total_buy_qty > 0 THEN
    v_avg_cost_basis := v_total_buy_cost / v_total_buy_qty;
  ELSE
    v_avg_cost_basis := 0;
  END IF;

  -- Clamp to zero (can't hold negative shares)
  v_quantity := GREATEST(v_quantity, 0);

  UPDATE public.assets
  SET
    quantity       = v_quantity,
    avg_cost_basis = v_avg_cost_basis,
    is_active      = (v_quantity > 0),
    updated_at     = NOW()
  WHERE id = p_asset_id;
END;
$$;

-- Trigger function: fires after INSERT/UPDATE/DELETE on transactions
CREATE OR REPLACE FUNCTION trigger_sync_asset_position()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.asset_id IS NOT NULL THEN
      PERFORM recalculate_asset_position(OLD.asset_id);
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.asset_id IS NOT NULL THEN
      PERFORM recalculate_asset_position(NEW.asset_id);
    END IF;
    -- Also recalculate old asset if asset_id changed
    IF TG_OP = 'UPDATE' AND OLD.asset_id IS DISTINCT FROM NEW.asset_id AND OLD.asset_id IS NOT NULL THEN
      PERFORM recalculate_asset_position(OLD.asset_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER sync_asset_position_after_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_asset_position();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at        BEFORE UPDATE ON public.users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER portfolios_updated_at   BEFORE UPDATE ON public.portfolios   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER assets_updated_at       BEFORE UPDATE ON public.assets       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create user profile when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- VIEWS
-- Computed portfolio metrics — always derived from transactions
-- ============================================================

-- Portfolio summary view: current state computed from live data
CREATE OR REPLACE VIEW public.v_portfolio_summary AS
SELECT
  p.id                                                          AS portfolio_id,
  p.user_id,
  p.name                                                        AS portfolio_name,
  p.currency,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_active)              AS asset_count,
  -- Current market value = sum of (quantity * current_price) for active assets
  COALESCE(SUM(a.quantity * a.current_price) FILTER (WHERE a.is_active), 0) AS total_value,
  -- Total cost = sum of all buy transaction amounts (including fees)
  COALESCE(SUM(t_buys.buy_cost), 0)                            AS total_cost,
  -- Realized gain from sells
  COALESCE(SUM(t_sells.sell_proceeds), 0)                      AS total_sell_proceeds,
  -- Dividend income
  COALESCE(SUM(t_div.dividend_income), 0)                      AS total_dividend_income,
  -- Total fees paid
  COALESCE(SUM(t_fees.total_fees), 0)                          AS total_fees_paid
FROM public.portfolios p
LEFT JOIN public.assets a
  ON a.portfolio_id = p.id
LEFT JOIN LATERAL (
  SELECT SUM(total_amount + fee) AS buy_cost
  FROM public.transactions
  WHERE portfolio_id = p.id AND type = 'buy' AND status = 'completed'
) t_buys ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM(total_amount - fee) AS sell_proceeds
  FROM public.transactions
  WHERE portfolio_id = p.id AND type = 'sell' AND status = 'completed'
) t_sells ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM(total_amount) AS dividend_income
  FROM public.transactions
  WHERE portfolio_id = p.id AND type = 'dividend' AND status = 'completed'
) t_div ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM(fee) AS total_fees
  FROM public.transactions
  WHERE portfolio_id = p.id AND status = 'completed'
) t_fees ON TRUE
GROUP BY p.id, p.user_id, p.name, p.currency;

COMMENT ON VIEW public.v_portfolio_summary IS
  'Computed portfolio metrics. total_value is live from current_price. '
  'total_cost is derived from transaction history. Never stores computed values.';

-- Asset performance view: per-position P&L
CREATE OR REPLACE VIEW public.v_asset_performance AS
SELECT
  a.id                                                        AS asset_id,
  a.portfolio_id,
  a.ticker,
  a.name,
  a.asset_class,
  a.quantity,
  a.avg_cost_basis,
  a.current_price,
  a.currency,
  a.is_active,
  -- Current market value
  (a.quantity * a.current_price)                             AS current_value,
  -- Total cost basis for current holdings
  (a.quantity * a.avg_cost_basis)                            AS cost_basis,
  -- Unrealized gain/loss
  (a.quantity * a.current_price) - (a.quantity * a.avg_cost_basis) AS unrealized_gain,
  -- Unrealized gain % (guard against division by zero)
  CASE
    WHEN a.avg_cost_basis > 0
    THEN ((a.current_price - a.avg_cost_basis) / a.avg_cost_basis) * 100
    ELSE 0
  END                                                         AS unrealized_gain_pct,
  -- Realized gain from sells for this asset
  COALESCE((
    SELECT SUM(t.total_amount - (t.quantity * a.avg_cost_basis) - t.fee)
    FROM public.transactions t
    WHERE t.asset_id = a.id AND t.type = 'sell' AND t.status = 'completed'
  ), 0)                                                       AS realized_gain,
  -- Dividend income for this asset
  COALESCE((
    SELECT SUM(total_amount)
    FROM public.transactions
    WHERE asset_id = a.id AND type = 'dividend' AND status = 'completed'
  ), 0)                                                       AS dividend_income,
  -- Transaction counts
  (SELECT COUNT(*) FROM public.transactions WHERE asset_id = a.id) AS transaction_count
FROM public.assets a;

COMMENT ON VIEW public.v_asset_performance IS
  'Per-asset P&L breakdown. All values computed from transactions and current_price.';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- users: can only see/edit own profile
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- portfolios: full CRUD on own portfolios only
CREATE POLICY "portfolios_select_own"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "portfolios_insert_own"
  ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_own"
  ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_own"
  ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- assets: accessible if the parent portfolio belongs to the user
CREATE POLICY "assets_select_own"
  ON public.assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "assets_insert_own"
  ON public.assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "assets_update_own"
  ON public.assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "assets_delete_own"
  ON public.assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

-- transactions: accessible if parent portfolio belongs to the user
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

-- snapshots: read-only for users (written by service role only)
CREATE POLICY "snapshots_select_own"
  ON public.portfolio_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = portfolio_id AND user_id = auth.uid()
  ));

-- ============================================================
-- RPC FUNCTIONS
-- Called from the frontend via supabase.rpc(...)
-- ============================================================

-- Get full portfolio summary with computed P&L
CREATE OR REPLACE FUNCTION get_portfolio_summary(p_portfolio_id UUID)
RETURNS TABLE (
  portfolio_id        UUID,
  portfolio_name      TEXT,
  currency            TEXT,
  asset_count         BIGINT,
  total_value         NUMERIC,
  total_cost          NUMERIC,
  unrealized_gain     NUMERIC,
  unrealized_gain_pct NUMERIC,
  total_sell_proceeds NUMERIC,
  total_dividend_income NUMERIC,
  total_fees_paid     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.portfolio_id,
    s.portfolio_name,
    s.currency,
    s.asset_count,
    s.total_value,
    s.total_cost,
    (s.total_value - s.total_cost)                                         AS unrealized_gain,
    CASE WHEN s.total_cost > 0
      THEN ((s.total_value - s.total_cost) / s.total_cost) * 100
      ELSE 0
    END                                                                     AS unrealized_gain_pct,
    s.total_sell_proceeds,
    s.total_dividend_income,
    s.total_fees_paid
  FROM public.v_portfolio_summary s
  WHERE s.portfolio_id = p_portfolio_id
    AND s.user_id = auth.uid();
END;
$$;

-- Get chart data: daily portfolio value for a date range
CREATE OR REPLACE FUNCTION get_portfolio_chart_data(
  p_portfolio_id UUID,
  p_from         DATE DEFAULT NOW()::DATE - INTERVAL '90 days',
  p_to           DATE DEFAULT NOW()::DATE
)
RETURNS TABLE (
  snapshot_date DATE,
  total_value   NUMERIC,
  total_cost    NUMERIC,
  gain          NUMERIC,
  gain_pct      NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.portfolios
    WHERE id = p_portfolio_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    ps.snapshot_date,
    ps.total_value,
    ps.total_cost,
    (ps.total_value - ps.total_cost)                                         AS gain,
    CASE WHEN ps.total_cost > 0
      THEN ((ps.total_value - ps.total_cost) / ps.total_cost) * 100
      ELSE 0
    END                                                                       AS gain_pct
  FROM public.portfolio_snapshots ps
  WHERE ps.portfolio_id = p_portfolio_id
    AND ps.snapshot_date BETWEEN p_from AND p_to
    AND ps.interval = 'daily'
  ORDER BY ps.snapshot_date ASC;
END;
$$;
