import OnboardingForm from "@/components/features/onboarding-form"
import VoiceOnboarding from "@/components/features/voice-onboarding"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 grid gap-6 md:grid-cols-2">
        <VoiceOnboarding />
        <OnboardingForm />
      </div>
    </div>
  )
}
