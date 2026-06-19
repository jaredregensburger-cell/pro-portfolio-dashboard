'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useUIStore } from '@/store'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const setProfile = useUIStore((s) => s.setProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    const supabase = createSupabaseBrowserClient()

    const loginPromise = supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Login Timeout. Supabase antwortet nicht.')), 10000)
    })

    const { data, error } = await Promise.race([loginPromise, timeoutPromise])

    if (error) {
      setError(`Login fehlgeschlagen: ${error.message}`)
      return
    }

    if (!data.user) {
      setError('Login fehlgeschlagen: Kein User zurückgegeben.')
      return
    }

    setProfile({
      displayName:
        data.user.user_metadata?.display_name ||
        data.user.user_metadata?.name ||
        'Investor',
      email: data.user.email ?? '',
    })

    router.replace('/dashboard')
    router.refresh()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unbekannter Login-Fehler')
  } finally {
    setLoading(false)
  }
}

  return (
    <main className="min-h-screen bg-void bg-grid overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 lg:px-8">
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
              Melde dich an und verwalte dein Portfolio.
            </p>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-3 text-ink outline-none transition focus:border-signal"
                required
              />

              <input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-3 text-ink outline-none transition focus:border-signal"
                required
              />

              {error && (
                <p className="rounded-xl border border-loss/30 bg-loss/10 px-3 py-2 text-data-sm text-loss">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-signal py-3 text-white font-semibold shadow-glow transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? 'Anmelden…' : 'Anmelden'}
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
