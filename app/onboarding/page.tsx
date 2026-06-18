import type { Metadata } from 'next'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'

export const metadata: Metadata = {
  title: 'Willkommen',
}

export default function OnboardingPage() {
  return <OnboardingFlow />
}
