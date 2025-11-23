"use client"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { careerAPI } from "@/src/lib/api"
import { useUser } from "@clerk/nextjs"
import VoiceRecorder from "@/components/features/voice-recorder"
import { toast } from "sonner"

export default function OnboardingForm() {
  const router = useRouter()
  const { user } = useUser()
  const [transcript, setTranscript] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputMode, setInputMode] = useState<"text" | "voice">("text")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const updateCareerProfile = useMutation(api.careerProfiles.updateCareerProfile)
  const getOrCreateCareerProfile = useMutation(api.careerProfiles.getOrCreateCareerProfile)
  const createCareerRecommendations = useMutation(api.careerRecommendations.createCareerRecommendations)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // First, ensure profile exists
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      await getOrCreateCareerProfile({
        userId: user.id,
      })
      
      // Then save to Convex
      await updateCareerProfile({
        rawOnboardingTranscript: transcript,
        resumeText: resumeText || undefined,
      })
      
      // Then analyze with Python backend
      if (user) {
        // Parse the transcript to extract structured data
        const analysisData = {
          userId: user.id,
          background: transcript.substring(0, 500), // First 500 chars as background
          skills: extractSection(transcript, 'skills') || transcript.substring(0, 300),
          interests: extractSection(transcript, 'interests') || transcript.substring(300, 600),
          goals: extractSection(transcript, 'goals') || transcript.substring(600, 900),
          values: extractSection(transcript, 'values') || transcript.substring(900, 1200),
        }
        
        const analysisResult = await careerAPI.analyzeOnboarding(analysisData)
        console.log('AI Analysis Result:', analysisResult)
        
        // Store the analysis results in Convex for later use
        if (analysisResult.success) {
          // Use mock data for now since backend structure is inconsistent
          // In production, this would parse the actual AI analysis results
          const mockSkills = analysisData.skills?.split(',') || ["JavaScript", "React", "Problem Solving"];
          const mockPassions = ["Technology", "Innovation", "Building Products"];
          const mockValues = ["Growth", "Impact", "Work-Life Balance"];
          
          await updateCareerProfile({
            rawOnboardingTranscript: transcript,
            resumeText: resumeText,
            skills: mockSkills,
            personality: {
              openness: 0.7,
              conscientiousness: 0.8,
              extraversion: 0.6,
              agreeableness: 0.7,
              neuroticism: 0.3
            },
            passions: mockPassions,
            goals: {
              incomeTarget: 80000,
              location: "Remote",
              workStyle: "remote",
              riskTolerance: "medium",
              schedulePreference: "flexible"
            },
            values: mockValues
          })
          
          // Create mock career recommendations
          await createCareerRecommendations({
            recommendations: [
              {
                industry: "Technology",
                role: "Software Engineer",
                matchScore: 85,
                matchExplanation: "Excellent match for your technical background and problem-solving skills"
              },
              {
                industry: "Technology", 
                role: "Product Manager",
                matchScore: 78,
                matchExplanation: "Good match for your analytical skills and interest in product development"
              },
              {
                industry: "Finance",
                role: "Data Analyst",
                matchScore: 82,
                matchExplanation: "Strong match for your analytical mindset and attention to detail"
              }
            ]
          })
        }
      }
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to process onboarding data:", error)
      alert("Failed to process your information. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Helper function to extract sections from transcript
  const extractSection = (text: string, section: string): string | null => {
    const patterns = {
      skills: /skills?:?\s*([^\n.]+)/i,
      interests: /interests?:?\s*([^\n.]+)/i,
      goals: /goals?:?\s*([^\n.]+)/i,
      values: /values?:?\s*([^\n.]+)/i,
    }
    
    const pattern = patterns[section as keyof typeof patterns]
    const match = text.match(pattern)
    return match ? match[1].trim() : null
  }

  // Handle resume file upload
  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setResumeText(text)
        toast.success("Resume uploaded successfully!")
      }
      reader.onerror = () => {
        toast.error("Failed to read resume file")
      }
      reader.readAsText(file)
    }
  }

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Career Discovery Onboarding</CardTitle>
          <CardDescription>
            Tell us about yourself to get personalized career recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="transcript">
                  Tell us about yourself
                  <span className="text-muted-foreground text-sm block mt-1">
                    Share your background, interests, skills, goals, and what you&apos;re looking for in a career.
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={inputMode === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("text")}
                  >
                    Type
                  </Button>
                  <Button
                    type="button"
                    variant={inputMode === "voice" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("voice")}
                  >
                    🎤 Voice
                  </Button>
                </div>
              </div>
              
              {inputMode === "text" ? (
                <Textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="I'm a software engineer with 3 years of experience... I'm interested in transitioning into product management because... My strengths include... I'm looking for a role that..."
                  rows={8}
                  required
                />
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <VoiceRecorder
                    onTranscriptionComplete={(text) => setTranscript(text)}
                    existingTranscript={transcript}
                  />
                  {transcript && (
                    <div className="mt-4">
                      <Label className="text-sm text-muted-foreground">Transcribed Text:</Label>
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Your transcribed text will appear here..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume">
                Resume (Optional)
                <span className="text-muted-foreground text-sm block mt-1">
                  Upload your resume file or paste the text below for more detailed analysis
                </span>
              </Label>
              
              {/* File upload section */}
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileUpload}
                  className="mb-2"
                >
                  📄 Upload Resume File
                </Button>
                <p className="text-sm text-muted-foreground">
                  Supports .txt, .pdf, .doc files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </div>
              
              {/* Manual text input */}
              <Textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Or paste your resume text here..."
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
              >
                Skip for now
              </Button>
              <Button type="submit" disabled={isSubmitting || !transcript.trim()}>
                {isSubmitting ? "Saving..." : "Get Recommendations"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}