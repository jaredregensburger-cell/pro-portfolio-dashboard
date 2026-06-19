'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useUIStore } from '@/store'

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

        <div className="mx-auto w-full max-w-md">
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

        </div>
      </div>
    </main>
  )
}
