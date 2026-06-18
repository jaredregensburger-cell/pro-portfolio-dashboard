'use client'

import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
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
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2"
          />

          <input
            type="password"
            placeholder="Passwort"
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2"
          />

          <button
            className="w-full rounded-lg bg-signal py-2 text-white font-medium"
          >
            Anmelden
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/onboarding"
            className="text-signal hover:underline"
          >
            Noch keinen Account?
          </Link>
        </div>
      </div>
    </main>
  )
}
