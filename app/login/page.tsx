'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, BarChart3, TrendingUp, Wallet } from 'lucide-react'
import { useUIStore } from '@/store'
import { LiveTicker } from '@/components/landing/LiveTicker'

type DemoAccount = {
  name: string
  email: string
  password: string
  registeredAt: string
}

export default function LoginPage() {
  const router = useRouter()
  const setProfile = useUIStore((s) => s.setProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const rawAccount = localStorage.getItem('folio-demo-account')

    if (!rawAccount) {
      setError('Es wurde noch kein Account erstellt.')
      return
    }

    const account = JSON.parse(rawAccount) as DemoAccount

    if (
      account.email.toLowerCase() !== email.trim().toLowerCase() ||
      account.password !== password
    ) {
      setError('E-Mail oder Passwort ist falsch.')
      return
    }

    localStorage.setItem(
      'folio-demo-session',
      JSON.stringify({
        email: account.email,
        loggedInAt: new Date().toISOString(),
      })
    )

    setProfile({
      displayName: account.name,
      email: account.email,
    })

    router.push('/dashboard' as any)
  }

  return (
    <main className="min-h-screen bg-void bg-grid overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 lg:px-8">
        <div className="mb-8 w-full">
          <LiveTicker />
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-3xl border border-border bg-surface/85 p-6 shadow-glass-lg backdrop-blur-glass"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-gradient shadow-glow">
                <Zap size={24} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-data-sm text-ink-faint">Folio</p>
                <h1 className="text-2xl font-semibold text-ink">
                  Willkommen zurück
                </h1>
              </div>
            </div>

            <p className="mb-6 text-ink-muted">
              Melde dich an und verwalte Aktien, ETFs, Krypto und Metalle in einem Dashboard.
            </p>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-3 text-ink outline-none transition focus:border-signal"
              />

              <input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-3 text-ink outline-none transition focus:border-signal"
              />

              {error && (
                <p className="rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-data-sm text-loss">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-signal py-3 text-white font-semibold shadow-glow transition hover:brightness-110"
              >
                Anmelden
              </button>
            </div>

            <div className="mt-6 text-center text-data-sm text-ink-muted">
              Noch keinen Account?{' '}
              <Link href="/onboarding" className="text-signal hover:underline">
                Kostenlos starten
              </Link>
            </div>
          </form>

          <div className="hidden lg:block rounded-3xl border border-border bg-surface/80 p-4 shadow-glass-lg backdrop-blur-glass">
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
                  ['NVDA', 'Nvidia Corp.', '5.620,90 €', '+2.4%'],
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
