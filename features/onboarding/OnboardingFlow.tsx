'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { useOnboardingStore, useSimulationStore } from '@/store'
import { useUIStore } from '@/store'
import { useAuthStore } from '@/features/auth/AuthStore'
import { OnboardingOptionCard } from './OnboardingOptionCard'
import { OnboardingProgress } from './OnboardingProgress'
import type { InvestorType, InvestorProfile } from '@/types/simulation'
import { ArrowLeft, ArrowRight, Zap, Sparkles } from 'lucide-react'

const STEPS = ['investorType', 'primaryGoal', 'experienceLevel', 'account'] as const
type Step = (typeof STEPS)[number]

const INVESTOR_TYPES: Array<{ value: InvestorType; icon: string; title: string; description: string }> = [
  { value: 'conservative', icon: '🛡️', title: 'Konservativ', description: 'Kapitalerhalt steht an erster Stelle. Niedrige Volatilität, stabile Erträge.' },
  { value: 'balanced', icon: '⚖️', title: 'Ausgewogen', description: 'Mix aus Wachstum und Sicherheit. Moderates Risiko für moderate Renditen.' },
  { value: 'growth', icon: '🌱', title: 'Wachstum', description: 'Langfristiger Vermögensaufbau. Höheres Risiko für höheres Renditepotenzial.' },
  { value: 'aggressive', icon: '🚀', title: 'Aggressiv', description: 'Maximales Wachstum. Hohe Volatilität und Risikobereitschaft akzeptiert.' },
]

const PRIMARY_GOALS: Array<{ value: string; icon: string; title: string; description: string }> = [
  { value: 'retirement', icon: '🏖️', title: 'Altersvorsorge', description: 'Langfristig für den Ruhestand vorsorgen.' },
  { value: 'wealth', icon: '📈', title: 'Vermögensaufbau', description: 'Vermögen über Jahre hinweg vergrößern.' },
  { value: 'income', icon: '💰', title: 'Zusatzeinkommen', description: 'Regelmäßige Erträge aus Dividenden & Zinsen.' },
  { value: 'learning', icon: '🎓', title: 'Lernen & Experimentieren', description: 'Trading und Märkte verstehen, mit Spielgeld starten.' },
]

const EXPERIENCE_LEVELS: Array<{
  value: InvestorProfile['experienceLevel']
  icon: string
  title: string
  description: string
}> = [
  { value: 'beginner', icon: '🌱', title: 'Anfänger', description: 'Ich bin neu in Investments und lerne noch die Grundlagen.' },
  { value: 'intermediate', icon: '📊', title: 'Fortgeschritten', description: 'Ich habe bereits investiert und kenne die wichtigsten Konzepte.' },
  { value: 'experienced', icon: '🎯', title: 'Erfahren', description: 'Ich handle aktiv und kenne mich mit Risikomanagement aus.' },
]

export function OnboardingFlow() {
  const router = useRouter()

  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)
  const setProfile = useUIStore((s) => s.setProfile)
  const signUp = useAuthStore((s) => s.signUp)
  const loading = useAuthStore((s) => s.loading)

  const [stepIndex, setStepIndex] = useState(0)
  const [investorType, setInvestorType] = useState<InvestorType | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<InvestorProfile['experienceLevel'] | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentStep: Step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const canProceed =
    (currentStep === 'investorType' && investorType !== null) ||
    (currentStep === 'primaryGoal' && primaryGoal !== null) ||
    (currentStep === 'experienceLevel' && experienceLevel !== null) ||
    (currentStep === 'account' && displayName.trim() && email.trim() && password.length >= 6)

  async function finishRegistration() {
    setError(null)

    try {
      await signUp({
        email,
        password,
        displayName,
        metadata: {
          investor_type: investorType,
          primary_goal: primaryGoal,
          experience_level: experienceLevel,
        },
      })

      setProfile({ displayName, email })

      completeOnboarding({
        investorType: investorType!,
        primaryGoal: primaryGoal!,
        experienceLevel: experienceLevel!,
      })

      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    }
  }

  function handleNext() {
    if (!canProceed) return

    if (isLastStep) {
      finishRegistration()
      return
    }

    setStepIndex((i) => i + 1)
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function handleDemo() {
    loadDemoData()
  }

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4 py-12 bg-grid">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-gradient">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-ink">Folio</span>
          </div>

          <Link
            href="/login"
            className="text-data-sm text-ink-faint hover:text-ink-muted transition-colors duration-150"
          >
            Ich habe schon einen Account
          </Link>
        </div>

        <OnboardingProgress step={stepIndex} totalSteps={STEPS.length} />

        <div className="mt-8 animate-fade-in" key={currentStep}>
          {currentStep === 'investorType' && (
            <>
              <h1 className="text-data-3xl font-semibold text-ink mb-2">
                Welcher Investoren-Typ bist du?
              </h1>
              <p className="text-data-base text-ink-muted mb-6">
                Das hilft uns, dein Dashboard sinnvoll vorzukonfigurieren.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INVESTOR_TYPES.map((t) => (
                  <OnboardingOptionCard
                    key={t.value}
                    icon={t.icon}
                    title={t.title}
                    description={t.description}
                    selected={investorType === t.value}
                    onClick={() => setInvestorType(t.value)}
                  />
                ))}
              </div>
            </>
          )}

          {currentStep === 'primaryGoal' && (
            <>
              <h1 className="text-data-3xl font-semibold text-ink mb-2">
                Was ist dein primäres Ziel?
              </h1>
              <p className="text-data-base text-ink-muted mb-6">
                Wähle, was am besten zu deiner Situation passt.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRIMARY_GOALS.map((g) => (
                  <OnboardingOptionCard
                    key={g.value}
                    icon={g.icon}
                    title={g.title}
                    description={g.description}
                    selected={primaryGoal === g.value}
                    onClick={() => setPrimaryGoal(g.value)}
                  />
                ))}
              </div>
            </>
          )}

          {currentStep === 'experienceLevel' && (
            <>
              <h1 className="text-data-3xl font-semibold text-ink mb-2">
                Wie viel Erfahrung hast du?
              </h1>
              <p className="text-data-base text-ink-muted mb-6">
                Danach erstellen wir deinen Account.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {EXPERIENCE_LEVELS.map((e) => (
                  <OnboardingOptionCard
                    key={e.value}
                    icon={e.icon}
                    title={e.title}
                    description={e.description}
                    selected={experienceLevel === e.value}
                    onClick={() => setExperienceLevel(e.value)}
                  />
                ))}
              </div>
            </>
          )}

          {currentStep === 'account' && (
            <>
              <h1 className="text-data-3xl font-semibold text-ink mb-2">
                Account erstellen
              </h1>
              <p className="text-data-base text-ink-muted mb-6">
                Danach kommst du direkt zu deinem Dashboard.
              </p>

              <div className="space-y-4 rounded-2xl border border-border bg-surface/90 p-5">
                <div>
                  <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                    Name
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink focus:outline-none focus:border-signal"
                  />
                </div>

                <div>
                  <label className="block text-data-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-data-sm text-ink focus:outline-none focus:border-signal"
                  />
                  <p className="mt-1 text-data-xs text-ink-faint">
                    Mindestens 6 Zeichen.
                  </p>
                </div>

                {error && (
                  <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-data-sm text-loss">
                    {error}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <div>
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft size={14} strokeWidth={2} />
                Zurück
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleDemo}>
                <Sparkles size={14} strokeWidth={2} />
                Demo-Daten vormerken
              </Button>
            )}
          </div>

          <Button variant="primary" onClick={handleNext} disabled={!canProceed || loading}>
            {isLastStep ? (loading ? 'Erstelle Account…' : 'Account erstellen') : 'Weiter'}
            <ArrowRight size={14} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
