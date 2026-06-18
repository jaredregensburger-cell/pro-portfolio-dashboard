'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      alert('Bitte E-Mail und Passwort eingeben.')
      return
    }

    localStorage.setItem(
      'folio-demo-user',
      JSON.stringify({
        email,
        loggedInAt: new Date().toISOString(),
      })
    )

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
