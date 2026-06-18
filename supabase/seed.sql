-- ============================================================
-- FOLIO — SEED DATA
-- Run AFTER schema.sql
-- Creates 1 demo user + portfolio + assets + transactions
-- NOTE: Replace the user UUID with your actual Supabase Auth user ID
-- ============================================================

-- ─── Step 1: Create the demo user in auth.users ──────────────────────────────
-- In production this happens via Supabase Auth signup.
-- For seeding, you can create a user in the Supabase Dashboard under
-- Authentication → Users → "Invite User", then grab the UUID.
-- Replace the UUID below with your actual user ID.

-- We'll use a fixed UUID for repeatability:
DO $$
DECLARE
  v_user_id        UUID := '00000000-0000-0000-0000-000000000001';
  v_portfolio_id   UUID := '00000000-0000-0000-0000-000000000010';
  v_aapl_id        UUID := '00000000-0000-0000-0000-000000000100';
  v_btc_id         UUID := '00000000-0000-0000-0000-000000000101';
  v_vti_id         UUID := '00000000-0000-0000-0000-000000000102';
  v_msft_id        UUID := '00000000-0000-0000-0000-000000000103';
  v_eth_id         UUID := '00000000-0000-0000-0000-000000000104';
BEGIN

-- ─── User Profile ──────────────────────────────────────────────────────────
-- (Normally created by the Auth trigger. Insert manually for seed.)
INSERT INTO public.users (id, email, display_name, currency, timezone)
VALUES (
  v_user_id,
  'demo@folio.app',
  'Alex Investor',
  'USD',
  'America/New_York'
)
ON CONFLICT (id) DO UPDATE SET
  email        = EXCLUDED.email,
  display_name = EXCLUDED.display_name;

-- ─── Portfolio ─────────────────────────────────────────────────────────────
INSERT INTO public.portfolios (id, user_id, name, description, currency, is_default)
VALUES (
  v_portfolio_id,
  v_user_id,
  'Main Portfolio',
  'Long-term growth portfolio with diversified asset allocation',
  'USD',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ─── Assets (shell rows — quantity/avg_cost_basis filled by trigger) ────────
INSERT INTO public.assets (id, portfolio_id, ticker, name, asset_class, current_price, currency)
VALUES
  (v_aapl_id, v_portfolio_id, 'AAPL', 'Apple Inc.',                      'equity',    189.84, 'USD'),
  (v_btc_id,  v_portfolio_id, 'BTC',  'Bitcoin',                          'crypto',  42350.00, 'USD'),
  (v_vti_id,  v_portfolio_id, 'VTI',  'Vanguard Total Stock Market ETF',  'etf',       230.12, 'USD'),
  (v_msft_id, v_portfolio_id, 'MSFT', 'Microsoft Corporation',            'equity',    374.51, 'USD'),
  (v_eth_id,  v_portfolio_id, 'ETH',  'Ethereum',                         'crypto',   2280.00, 'USD')
ON CONFLICT (portfolio_id, ticker) DO NOTHING;

-- ─── Transactions ──────────────────────────────────────────────────────────
-- The trigger will automatically update assets.quantity and avg_cost_basis
-- after each INSERT.

-- AAPL: initial buy Jan 2023, added more over time
INSERT INTO public.transactions
  (portfolio_id, asset_id, type, status, quantity, price, total_amount, fee, currency, note, executed_at)
VALUES
  -- AAPL initial position
  (v_portfolio_id, v_aapl_id, 'buy', 'completed', 20, 130.00, 2600.00, 1.99, 'USD', 'Initial AAPL position', '2023-01-15 10:00:00+00'),
  -- AAPL adds on dip
  (v_portfolio_id, v_aapl_id, 'buy', 'completed', 15, 152.50, 2287.50, 1.99, 'USD', 'Added on dip', '2023-04-10 14:30:00+00'),
  -- AAPL adds again
  (v_portfolio_id, v_aapl_id, 'buy', 'completed', 15, 178.20, 2673.00, 1.99, 'USD', 'Pre-earnings buy', '2023-08-01 09:45:00+00'),
  -- AAPL dividend Q2 2023
  (v_portfolio_id, v_aapl_id, 'dividend', 'completed', NULL, NULL, 24.00, 0, 'USD', 'Q2 2023 dividend', '2023-05-18 00:00:00+00'),
  -- AAPL dividend Q4 2023
  (v_portfolio_id, v_aapl_id, 'dividend', 'completed', NULL, NULL, 24.00, 0, 'USD', 'Q4 2023 dividend', '2023-11-16 00:00:00+00'),

  -- BTC initial buy
  (v_portfolio_id, v_btc_id, 'buy', 'completed', 0.50, 25000.00, 12500.00, 9.99, 'USD', 'Bitcoin DCA entry', '2023-03-10 11:00:00+00'),
  -- BTC second buy
  (v_portfolio_id, v_btc_id, 'buy', 'completed', 0.25, 30000.00, 7500.00, 9.99, 'USD', 'BTC DCA', '2023-06-15 16:00:00+00'),
  -- BTC third buy
  (v_portfolio_id, v_btc_id, 'buy', 'completed', 0.10, 35000.00, 3500.00, 9.99, 'USD', 'BTC DCA', '2023-10-20 09:00:00+00'),

  -- VTI large initial position
  (v_portfolio_id, v_vti_id, 'buy', 'completed', 60, 195.00, 11700.00, 0, 'USD', 'VTI core position', '2022-11-05 10:00:00+00'),
  -- VTI adds
  (v_portfolio_id, v_vti_id, 'buy', 'completed', 40, 203.50, 8140.00, 0, 'USD', 'VTI monthly DCA', '2023-02-01 10:00:00+00'),
  -- VTI dividend
  (v_portfolio_id, v_vti_id, 'dividend', 'completed', NULL, NULL, 87.50, 0, 'USD', 'VTI Q3 2023 distribution', '2023-09-25 00:00:00+00'),

  -- MSFT initial
  (v_portfolio_id, v_msft_id, 'buy', 'completed', 20, 305.00, 6100.00, 1.99, 'USD', 'MSFT initial', '2023-02-20 10:00:00+00'),
  -- MSFT adds
  (v_portfolio_id, v_msft_id, 'buy', 'completed', 15, 320.00, 4800.00, 1.99, 'USD', 'MSFT add', '2023-05-10 14:00:00+00'),
  -- MSFT partial sell (profit taking)
  (v_portfolio_id, v_msft_id, 'sell', 'completed', 5, 358.00, 1790.00, 1.99, 'USD', 'Partial profit taking', '2023-09-15 11:00:00+00'),
  -- MSFT dividend
  (v_portfolio_id, v_msft_id, 'dividend', 'completed', NULL, NULL, 33.75, 0, 'USD', 'MSFT Q4 2023 dividend', '2023-11-15 00:00:00+00'),

  -- ETH buys
  (v_portfolio_id, v_eth_id, 'buy', 'completed', 3.00, 1750.00, 5250.00, 9.99, 'USD', 'ETH position open', '2023-05-01 12:00:00+00'),
  (v_portfolio_id, v_eth_id, 'buy', 'completed', 2.20, 1850.00, 4070.00, 9.99, 'USD', 'ETH DCA', '2023-07-15 10:00:00+00'),

  -- Platform fee
  (v_portfolio_id, NULL, 'fee', 'completed', NULL, NULL, 9.99, 0, 'USD', 'Monthly platform fee', '2023-12-01 00:00:00+00');

-- ─── Portfolio Snapshots (90 days of history for chart) ───────────────────
-- Generate realistic looking chart data
INSERT INTO public.portfolio_snapshots (portfolio_id, total_value, total_cost, currency, interval, snapshot_date)
SELECT
  v_portfolio_id,
  -- Realistic value curve: starts ~65k, grows to ~101k with noise
  ROUND(
    (65000 + (day_num * 400) +
     (SIN(day_num * 0.15) * 3500) +
     (COS(day_num * 0.08) * 2000) +
     (SIN(day_num * 0.4) * 800))::NUMERIC,
    2
  )                                         AS total_value,
  ROUND((70000 + day_num * 50)::NUMERIC, 2) AS total_cost,
  'USD',
  'daily',
  (NOW()::DATE - (89 - day_num) * INTERVAL '1 day')::DATE
FROM generate_series(0, 89) AS day_num
ON CONFLICT (portfolio_id, snapshot_date, interval) DO NOTHING;

RAISE NOTICE 'Seed data inserted successfully.';
RAISE NOTICE 'User ID: %', v_user_id;
RAISE NOTICE 'Portfolio ID: %', v_portfolio_id;
RAISE NOTICE 'Run SELECT * FROM v_portfolio_summary to verify.';

END $$;

-- ─── Verify ───────────────────────────────────────────────────────────────────

-- Check asset positions (should show computed quantity and avg_cost_basis)
SELECT
  ticker,
  ROUND(quantity, 4)       AS quantity,
  ROUND(avg_cost_basis, 2) AS avg_cost,
  ROUND(current_price, 2)  AS price,
  ROUND(quantity * current_price, 2) AS market_value,
  is_active
FROM public.assets
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010'
ORDER BY quantity * current_price DESC;

-- Check portfolio summary view
SELECT
  portfolio_name,
  asset_count,
  ROUND(total_value, 2)   AS total_value,
  ROUND(total_cost, 2)    AS total_cost,
  ROUND(total_value - total_cost, 2) AS unrealized_gain,
  ROUND(total_dividend_income, 2) AS dividends,
  ROUND(total_fees_paid, 2) AS fees
FROM public.v_portfolio_summary
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010';
