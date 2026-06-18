'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { useOnboardingStore, useSimulationStore } from '@/store'
import { OnboardingOptionCard } from './OnboardingOptionCard'
import { OnboardingProgress } from './OnboardingProgress'
import type { InvestorType, InvestorProfile } from '@/types/simulation'
import { ArrowLeft, ArrowRight, Zap, Sparkles } from 'lucide-react'

const STEPS = ['investorType', 'primaryGoal', 'experienceLevel'] as const
type Step = (typeof STEPS)[number]

const INVESTOR_TYPES: Array<{ value: InvestorType; icon: string; title: string; description: string }> = [
  {
    value: 'conservative',
    icon: '🛡️',
    title: 'Konservativ',
    description: 'Kapitalerhalt steht an erster Stelle. Niedrige Volatilität, stabile Erträge.',
  },
  {
    value: 'balanced',
    icon: '⚖️',
    title: 'Ausgewogen',
    description: 'Mix aus Wachstum und Sicherheit. Moderates Risiko für moderate Renditen.',
  },
  {
    value: 'growth',
    icon: '🌱',
    title: 'Wachstum',
    description: 'Langfristiger Vermögensaufbau. Höheres Risiko für höheres Renditepotenzial.',
  },
  {
    value: 'aggressive',
    icon: '🚀',
    title: 'Aggressiv',
    description: 'Maximales Wachstum. Hohe Volatilität und Risikobereitschaft akzeptiert.',
  },
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
  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding)
  const loadDemoData = useSimulationStore((s) => s.loadDemoData)

  const [stepIndex, setStepIndex] = useState(0)
  const [investorType, setInvestorType] = useState<InvestorType | null>(null)
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<InvestorProfile['experienceLevel'] | null>(null)

  const currentStep: Step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const canProceed =
    (currentStep === 'investorType' && investorType !== null) ||
    (currentStep === 'primaryGoal' && primaryGoal !== null) ||
    (currentStep === 'experienceLevel' && experienceLevel !== null)

  function handleNext() {
    if (!canProceed) return

    if (isLastStep) {
      completeOnboarding({
        investorType: investorType!,
        primaryGoal: primaryGoal!,
        experienceLevel: experienceLevel!,
      })
      router.replace('/dashboard')
      return
    }

    setStepIndex((i) => i + 1)
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function handleSkip() {
    skipOnboarding()
    router.replace('/dashboard')
  }

  function handleSkipWithDemo() {
    skipOnboarding()
    loadDemoData()
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4 py-12 bg-grid">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-gradient">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-ink">Folio</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-data-sm text-ink-faint hover:text-ink-muted transition-colors duration-150"
          >
            Überspringen
          </button>
        </div>

        <OnboardingProgress step={stepIndex} totalSteps={STEPS.length} />

        {/* Step content */}
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
                Letzter Schritt — danach geht's direkt ins Dashboard.
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
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft size={14} strokeWidth={2} />
                Zurück
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkipWithDemo}>
                <Sparkles size={14} strokeWidth={2} />
                Mit Demo-Daten starten
              </Button>
            )}
          </div>
          <Button variant="primary" onClick={handleNext} disabled={!canProceed}>
            {isLastStep ? 'Fertig' : 'Weiter'}
            <ArrowRight size={14} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
