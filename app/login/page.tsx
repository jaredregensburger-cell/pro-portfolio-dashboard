'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/features/auth/AuthStore'

export default function LoginPage() {
  const router = useRouter()
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      await signIn(email, password)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    }
  }

  return (
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface/90 p-6 shadow-glass-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-gradient">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-data-xl font-semibold text-ink">Login</h1>
            <p className="text-data-sm text-ink-muted">Melde dich bei Folio an.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink focus:outline-none focus:border-signal"
            />
          </div>

          <div>
            <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink focus:outline-none focus:border-signal"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-data-sm text-loss">
              {error}
            </p>
          )}

          <Button variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Bitte warten…' : 'Einloggen'}
          </Button>
        </div>

        <p className="mt-5 text-center text-data-sm text-ink-muted">
          Noch kein Account?{' '}
          <Link href="/onboarding" className="text-signal hover:text-signal-dim">
            Neu starten
          </Link>
        </p>
      </form>
    </div>
  )
}
