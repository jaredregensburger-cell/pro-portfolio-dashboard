# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, region, and database password
3. Wait ~2 minutes for provisioning

## 2. Get Your API Keys

Dashboard → **Settings** → **API**

Copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

Paste into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Run the Schema

Dashboard → **SQL Editor** → **New Query**

Paste the contents of `schema.sql` → **Run**

You should see:
- 5 tables created: `users`, `portfolios`, `assets`, `transactions`, `portfolio_snapshots`
- 2 views: `v_portfolio_summary`, `v_asset_performance`
- 2 RPC functions: `get_portfolio_summary`, `get_portfolio_chart_data`
- Triggers for auto-syncing asset position data
- RLS policies enabled on all tables

## 4. Run the Seed Data

**Option A: Use the demo seed (fixed UUIDs, no auth required)**

In SQL Editor, paste `seed.sql` → Run.

This inserts:
- 1 demo user profile
- 1 portfolio ("Main Portfolio")
- 5 assets (AAPL, BTC, VTI, MSFT, ETH)
- ~20 transactions (buys, sells, dividends, fees)
- 90 days of chart snapshots

After running, verify with:
```sql
SELECT ticker, quantity, avg_cost_basis, current_price
FROM assets
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010';
```

**Option B: Sign up and seed your own user**

1. Dashboard → Authentication → Users → Invite User (use your email)
2. Replace the UUID in `seed.sql` with your actual user ID
3. Run seed.sql

## 5. Enable Auth (Email/Password)

Dashboard → **Authentication** → **Providers** → Email → Enable

## 6. Verify the Setup

Run these queries in SQL Editor to confirm everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check assets have computed positions (from trigger)
SELECT ticker, quantity, avg_cost_basis
FROM assets
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010';

-- Check portfolio summary view
SELECT * FROM v_portfolio_summary
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010';

-- Check chart data
SELECT snapshot_date, total_value FROM portfolio_snapshots
WHERE portfolio_id = '00000000-0000-0000-0000-000000000010'
ORDER BY snapshot_date DESC LIMIT 5;
```

## 6. Wire the Frontend

The DB helpers in `/lib/db/` are ready to use. Example:

```typescript
// In a Server Component
import { getPortfolioSummary, getAssets } from '@/lib/db'

const summary = await getPortfolioSummary(portfolioId)
const assets  = await getAssets(portfolioId)
```

```typescript
// In a Client Component or action
import { recordBuy, getTransactions } from '@/lib/db'

// Record a buy → automatically updates asset quantity + avg cost via trigger
await recordBuy({
  portfolioId: 'xxx',
  assetId:     'yyy',
  quantity:    10,
  price:       189.84,
  fee:         1.99,
})
```

## Architecture Note: Why Transactions Are the Source of Truth

Portfolio values are **never stored** as computed totals. Instead:

- `assets.quantity` = computed by trigger from `SUM(buy qty) - SUM(sell qty)`
- `assets.avg_cost_basis` = computed by trigger from weighted average of buys
- Total portfolio value = `SUM(asset.quantity * asset.current_price)` via view
- Historical chart data = `portfolio_snapshots` (written by background jobs)

This means:
- ✅ No stale data — values always match the ledger
- ✅ You can add/remove/fix transactions and everything auto-recalculates
- ✅ Full audit trail — nothing is ever deleted
- ✅ Easy to reconstruct any historical state
