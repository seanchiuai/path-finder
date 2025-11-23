"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import VoiceRecorder from "@/components/features/voice-recorder"
import { careerAPI } from "@/src/lib/api"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function VoiceOnboarding() {
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [currentQuestion, setCurrentQuestion] = useState<string>("Tell me about your background and experience.")
  const [transcript, setTranscript] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [profilePreview, setProfilePreview] = useState<any>(null)
  const [finished, setFinished] = useState<boolean>(false)

  const router = useRouter()
  const { user } = useUser()
  const getOrCreateCareerProfile = useMutation(api.careerProfiles.getOrCreateCareerProfile)
  const updateCareerProfile = useMutation(api.careerProfiles.updateCareerProfile)
  const createCareerRecommendations = useMutation(api.careerRecommendations.createCareerRecommendations)

  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setHistory([{ role: "assistant", content: currentQuestion }])
    }
  }, [currentQuestion])

  const handleTranscript = async (text: string) => {
    setTranscript(text)
  }

  const submitAnswer = async () => {
    if (!transcript.trim()) return
    setIsProcessing(true)
    try {
      const newHistory = [...history, { role: "user", content: transcript }]
      setHistory(newHistory)
      setTranscript("")

      const next = await careerAPI.onboardingLLMResponse(newHistory)
      if (next.success && next.next) {
        setCurrentQuestion(next.next)
        setHistory(prev => [...prev, { role: "assistant", content: next.next }])
      }

      // Mark finished after 5 user answers
      const userTurns = newHistory.filter(h => h.role === "user").length
      if (userTurns >= 5) {
        setFinished(true)
      }
    } catch (e) {
      toast.error("Failed to get next question")
    } finally {
      setIsProcessing(false)
    }
  }

  const finalizeOnboarding = async () => {
    setIsProcessing(true)
    try {
      if (!user) {
        toast.error("Please sign in to save your analysis.")
        return
      }
      const combinedTranscript = history.filter(h => h.role === "user").map(h => h.content).join("\n")
      const result = await careerAPI.onboardingStart(combinedTranscript)
      if (result.success) {
        setProfilePreview(result.careerProfile)

        // Persist to Convex
        await getOrCreateCareerProfile({ userId: user.id })
        await updateCareerProfile({
          rawOnboardingTranscript: combinedTranscript,
          aiAnalysisResults: undefined,
        })

        const normalized = (result.recommendedRoles || []).map((r: any) => ({
          industry: r.industry || "Technology",
          role: r.career || r.role,
          matchScore: Math.round((r.match_score ?? r.matchScore ?? 0) * 100),
          matchExplanation: r.reasoning || r.matchExplanation || "",
        }))

        await createCareerRecommendations({
          agentRunId: result.orchestratorSessionId || "session",
          recommendations: normalized,
        })

        toast.success("Analysis saved. Opening recommendations…")
        router.push("/recommendations")
      }
    } catch (e) {
      toast.error("Failed to analyze onboarding")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Onboarding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Assistant</Label>
          <div className="bg-muted p-3 rounded-md text-sm">{currentQuestion}</div>
        </div>

        <div className="space-y-2">
          <Label>Your Answer</Label>
          <VoiceRecorder onTranscript={handleTranscript} />
          {transcript && (
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Edit your transcribed answer if needed..."
              rows={4}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={submitAnswer} disabled={isProcessing || !transcript.trim() || finished}>Submit Answer</Button>
            <Button variant="secondary" onClick={finalizeOnboarding} disabled={isProcessing || !finished}>Finish & Analyze</Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Conversation</Label>
          <div className="bg-muted p-3 rounded-md text-sm max-h-48 overflow-auto">
            {history.map((h, i) => (
              <div key={i} className="mb-2"><strong>{h.role === "assistant" ? "Assistant" : "You"}:</strong> {h.content}</div>
            ))}
          </div>
        </div>

        {profilePreview && (
          <div className="space-y-2">
            <Label>Profile Preview</Label>
            <div className="bg-muted p-3 rounded-md text-sm overflow-auto">
              <pre className="text-xs">{JSON.stringify(profilePreview, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
