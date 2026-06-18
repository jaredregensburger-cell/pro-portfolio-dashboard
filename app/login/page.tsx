'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <main className="min-h-screen bg-void flex items-center justify-center px-4 bg-grid">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
      >
        <h1 className="text-2xl font-semibold text-ink mb-2">
          Willkommen zurück
        </h1>

        <p className="text-ink-muted mb-6">
          Melde dich an, um dein Portfolio zu verwalten.
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-ink"
          />

          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-ink"
          />

          {error && (
            <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-data-sm text-loss">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-signal py-2 text-white font-medium"
          >
            Anmelden
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/onboarding" className="text-signal hover:underline">
            Noch keinen Account?
          </Link>
        </div>
      </form>
    </main>
  )
}
