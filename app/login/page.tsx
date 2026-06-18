import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-2">
          Willkommen bei Folio
        </h1>

        <p className="text-ink-muted mb-6">
          Melde dich an oder erstelle einen neuen Account.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-lg bg-signal py-2 text-white font-medium"
          >
            Login
          </Link>

          <Link
            href="/onboarding"
            className="block w-full rounded-lg border border-border bg-surface-raised py-2 text-ink font-medium hover:border-signal"
          >
            Registrieren / Neuer Benutzer
          </Link>
        </div>
      </div>
    </main>
  )
}
