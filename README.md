# Folio — Investor Dashboard

A production-ready Next.js SaaS foundation for portfolio tracking. Dark-mode-first, glassmorphism UI, fully typed, Supabase-ready.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS with custom design tokens |
| Database | Supabase (PostgreSQL) — ready, not yet wired |
| State | Zustand with devtools + persist |
| Charts | Recharts — installed, mount points ready |
| Icons | Lucide React |
| Utils | date-fns, clsx, tailwind-merge |

---

## Project Structure

```
investor-dashboard/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard view
│   ├── portfolio/          # Allocation & portfolio view
│   ├── assets/             # Positions table
│   ├── transactions/       # Ledger
│   └── settings/           # User preferences
│
├── components/
│   ├── ui/                 # Primitive components (GlassCard, Badge, Button, StatCard…)
│   └── layout/             # Sidebar, Topbar, AppShell
│
├── features/               # Business logic modules (feature-first)
│   ├── portfolio/          # DashboardShell, PortfolioShell, SettingsShell
│   ├── assets/             # AssetsShell, AssetRow
│   └── transactions/       # TransactionsShell
│
├── lib/                    # Shared utilities
│   ├── utils.ts            # cn(), formatCurrency(), formatPercent(), calcGain()…
│   ├── constants.ts        # NAV_ITEMS, ASSET_CLASS_META, CHART_COLORS…
│   ├── supabase.ts         # Browser + server Supabase clients
│   └── mock-data.ts        # Dev mock data (remove in production)
│
├── services/               # External data access (Supabase queries)
│   ├── portfolio.service.ts
│   ├── assets.service.ts
│   └── transactions.service.ts
│
├── store/                  # Zustand stores
│   ├── portfolio.store.ts  # Portfolio data + time range selection
│   └── ui.store.ts         # Theme, sidebar state, currency (persisted)
│
└── types/                  # TypeScript types
    ├── index.ts            # Domain types (Asset, Portfolio, Transaction…)
    └── database.ts         # Supabase schema types
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and fill in your Supabase credentials
cp .env.example .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

---

## Design System

### Color Tokens (Tailwind)

| Token | Hex | Usage |
|---|---|---|
| `void` | `#0A0B0F` | Page background |
| `surface` | `#111318` | Cards |
| `surface-raised` | `#161922` | Hover states |
| `surface-elevated` | `#1C2333` | Dropdowns, tooltips |
| `signal` | `#3B82F6` | Primary accent |
| `gain` | `#10B981` | Positive values |
| `loss` | `#EF4444` | Negative values |
| `violet` | `#8B5CF6` | Secondary accent |
| `ink` | `#E2E8F0` | Primary text |
| `ink-muted` | `#94A3B8` | Secondary text |
| `ink-faint` | `#475569` | Disabled/placeholder |

### Typography

- **Sans:** Inter (UI labels, body)
- **Mono:** JetBrains Mono (all numbers, tickers, amounts)

### Key Components

```tsx
// Glassmorphism card with accent border
<GlassCard accent="signal" glow>...</GlassCard>

// Metric display
<StatCard
  label="Total Value"
  value={85430}
  formatted
  currency="USD"
  changePct={1.42}
/>

// Time range tabs
<TimeRangeSelector selected="1M" onChange={setRange} />

// Badge
<Badge variant="gain">+4.2%</Badge>
```

---

## Backend Integration Checklist

### 1. Supabase Schema

Run these in the Supabase SQL editor:

```sql
-- Portfolios
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  currency text default 'USD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets
create table assets (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  ticker text not null,
  name text not null,
  asset_class text not null,
  quantity numeric not null,
  avg_cost_basis numeric not null,
  current_price numeric not null default 0,
  currency text default 'USD',
  logo_url text,
  status text default 'active',
  added_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  type text not null,
  status text default 'completed',
  quantity numeric,
  price numeric,
  amount numeric not null,
  fee numeric default 0,
  currency text default 'USD',
  note text,
  executed_at timestamptz not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table portfolios enable row level security;
create policy "Users manage own portfolios"
  on portfolios for all using (auth.uid() = user_id);
```

### 2. Wire Services to Store

In each `*Shell.tsx`, replace mock data calls with service functions:

```ts
// Before (mock)
const assets = MOCK_ASSETS

// After (real)
const { data: assets } = await fetchAssets({ portfolioId })
```

### 3. Add Recharts Charts

Chart mount points are already in place in `DashboardShell` and `PortfolioShell`. Add:

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={MOCK_SNAPSHOTS}>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="url(#grad)" />
  </AreaChart>
</ResponsiveContainer>
```

### 4. Add Authentication

Install `@supabase/auth-helpers-nextjs` and wrap routes with middleware:

```ts
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check (no emit)
npm run lint         # ESLint
```
