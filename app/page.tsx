import Link from 'next/link'
import {
  BarChart3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { LiveTicker } from '@/components/landing/LiveTicker'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-void bg-grid overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-gradient shadow-glow">
            <Zap size={28} className="text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Folio
          </h1>

          <p className="mt-3 max-w-2xl text-data-lg text-ink-muted">
            Portfolio Tracking für Aktien, ETFs, Krypto und Metalle.
          </p>
        </div>

        <div className="mb-8 w-full max-w-5xl">
          <LiveTicker />
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-border bg-surface/80 p-6 shadow-glass-lg backdrop-blur-glass">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-data-sm text-ink-muted">
              <Sparkles size={14} className="text-signal" />
              Live-Kurse & Performance Analyse
            </div>

            <h2 className="text-2xl font-semibold text-ink">
              Willkommen bei Folio
            </h2>

            <p className="mt-2 text-ink-muted">
              Melde dich an oder erstelle einen neuen Account.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/onboarding"
                className="block w-full rounded-xl bg-signal py-3 text-center text-white font-semibold shadow-glow transition hover:brightness-110"
              >
                Kostenlos starten
              </Link>

              <Link
                href="/login"
                className="block w-full rounded-xl border border-border bg-surface-raised py-3 text-center text-ink font-semibold transition hover:border-signal"
              >
                Login
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <TrendingUp size={16} className="mb-2 text-signal" />
                <p className="text-data-xs text-ink-muted">Live</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <Wallet size={16} className="mb-2 text-violet" />
                <p className="text-data-xs text-ink-muted">Multi</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <ShieldCheck size={16} className="mb-2 text-gain" />
                <p className="text-data-xs text-ink-muted">Lokal</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface/80 p-4 shadow-glass-lg backdrop-blur-glass">
            <div className="rounded-2xl border border-border bg-void p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-data-xs uppercase tracking-wide text-ink-faint">
                    Portfolio Value
                  </p>
                  <p className="mt-1 font-mono text-3xl font-semibold text-ink">
                    42.680,24 €
                  </p>
                </div>

                <div className="rounded-lg bg-gain/10 px-3 py-1.5 font-mono text-data-sm text-gain">
                  +8.42%
                </div>
              </div>

              <div className="mb-5 h-44 rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex h-full items-end gap-2">
                  {[35, 48, 42, 63, 58, 76, 70, 88, 82, 96, 91, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-signal/70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  ['BTC', 'Bitcoin', '12.430,20 €', '+3.8%'],
                  ['AAPL', 'Apple Inc.', '8.120,40 €', '+1.1%'],
                  ['GOOGL', 'Alphabet Inc.', '6.740,10 €', '+0.8%'],
                  ['XAU', 'Gold', '4.810,00 €', '+1.2%'],
                ].map((row) => (
                  <div
                    key={row[0]}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 font-mono text-data-xs font-bold text-signal">
                      {row[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-data-sm font-semibold text-ink">{row[0]}</p>
                      <p className="truncate text-data-xs text-ink-faint">{row[1]}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-data-sm text-ink">{row[2]}</p>
                      <p className="font-mono text-data-xs text-gain">{row[3]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <BarChart3 size={15} className="mb-2 text-signal" />
                <p className="font-mono text-data-sm text-ink">10k+</p>
                <p className="text-data-xs text-ink-faint">Assets</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <TrendingUp size={15} className="mb-2 text-gain" />
                <p className="font-mono text-data-sm text-ink">45s</p>
                <p className="text-data-xs text-ink-faint">Refresh</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-raised p-3">
                <Wallet size={15} className="mb-2 text-violet" />
                <p className="font-mono text-data-sm text-ink">∞</p>
                <p className="text-data-xs text-ink-faint">Portfolios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
