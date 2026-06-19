import Link from 'next/link'
import { ShieldCheck, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react'
import { LiveTicker } from '@/components/landing/LiveTicker'
import { LandingDashboardPreview } from '@/components/landing/LandingDashboardPreview'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-void bg-grid overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-gradient shadow-glow">
            <Zap size={32} className="text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Folio
          </h1>

          <p className="mt-3 max-w-2xl text-data-lg text-ink-muted">
            Portfolio Tracking für Aktien, ETFs, Krypto und Metalle.
          </p>
        </div>

        <div className="mb-8 w-full max-w-5xl">
          <LiveTicker />
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-2">
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

          <LandingDashboardPreview />
        </div>

        <div className="mt-6 grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-4">
          {['Aktien', 'ETFs', 'Krypto', 'Metalle'].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-surface/60 p-4 text-center">
              <p className="font-semibold text-ink">{item}</p>
              <p className="mt-1 text-data-sm text-ink-faint">Live Tracking</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
