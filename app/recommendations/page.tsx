"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { IconBulb, IconArrowLeft, IconAlertCircle, IconTrash, IconX, IconDollarSign, IconTrendingUp, IconClock, IconSparkles, IconCheck } from "@tabler/icons-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import AnalysisLoading from "@/components/features/analysis-loading"
import { careerAPI } from "@/src/lib/api"

export default function RecommendationsPage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userProfile = useQuery(api.userProfiles.getUserProfile)
  const recommendations = useQuery(api.careerRecommendations.getCareerRecommendations)

  // Analyzing state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Career selection state (Career Compass)
  const [selectedCareers, setSelectedCareers] = useState<Set<string>>(new Set())
  const [isGeneratingPlans, setIsGeneratingPlans] = useState(false)

  // Get default project and folder for saving careers
  const defaultProject = useQuery(
    user ? api.careerProjects.getDefaultProject : "skip"
  )

  const defaultFolder = useQuery(
    defaultProject ? api.careerFolders.getDefaultFolder : "skip",
    defaultProject ? { projectId: defaultProject._id } : "skip"
  )

  // Mutations
  const selectRecommendation = useMutation(api.careerRecommendations.selectRecommendation)
  const createSavedCareer = useMutation(api.savedCareers.createSavedCareer)
  const getOrCreateCareerProfile = useMutation(api.careerProfiles.getOrCreateCareerProfile)
  const updateCareerProfile = useMutation(api.careerProfiles.updateCareerProfile)
  const createCareerRecommendations = useMutation(api.careerRecommendations.createCareerRecommendations)
  const abandonRecommendations = useMutation(api.careerRecommendations.abandonRecommendations)
  const removeRecommendation = useMutation(api.careerRecommendations.removeRecommendation)
  const removeRecommendationFromProfile = useMutation(api.careerProfiles.removeRecommendationFromProfile)
  const selectCareersMutation = useMutation(api.selectedCareers.selectCareers)
  const upsertCareerCompassPlan = useMutation(api.actionPlans.upsertCareerCompassPlan)
  const initializeProgress = useMutation(api.careerProgress.initializeProgress)

  const [selectingCareer, setSelectingCareer] = useState<string | null>(null)
  const [isAbandoning, setIsAbandoning] = useState(false)
  const [removingCareer, setRemovingCareer] = useState<string | null>(null)

  // Handlers
  const handleSelectCareer = async (career: { career?: string; role?: string; industry: string; matchScore?: number; matchExplanation?: string }, recommendationId: string) => {
    const careerKey = `${career.career || career.role}-${career.industry}`
    setSelectingCareer(careerKey)

    try {
      await selectRecommendation({
        recommendationId: recommendationId as Id<"careerRecommendations">,
        industry: career.industry,
        role: career.career || career.role || "",
      })

      toast.success(`Selected ${career.career || career.role} as your career path!`)
      // Navigate to dashboard after selection
      router.push('/dashboard')
    } catch (error) {
      console.error("Failed to select career:", error)
      toast.error("Failed to select career. Please try again.")
    } finally {
      setSelectingCareer(null)
    }
  }

  const handleToggleCareerSelection = (careerId: string) => {
    setSelectedCareers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(careerId)) {
        newSet.delete(careerId)
      } else {
        if (newSet.size >= 3) {
          toast.error("You can only select up to 3 careers")
          return prev
        }
        newSet.add(careerId)
      }
      return newSet
    })
  }

  const handleGenerateActionPlans = async () => {
    if (selectedCareers.size === 0) {
      toast.error("Please select at least one career")
      return
    }

    setIsGeneratingPlans(true)
    try {
      // Get selected career details from recommendations
      const allRecommendations = [
        ...(recommendations?.recommendations || []).map(r => ({
          careerId: r.careerId || `${r.role}-${r.industry}`,
          careerName: r.role,
          industry: r.industry,
          fitScore: r.matchScore,
        })),
        ...(userProfile?.aiAnalysisResults?.recommendations || []).map((r: any) => ({
          careerId: `${r.career}-${r.industry}`,
          careerName: r.career,
          industry: r.industry,
          fitScore: Math.round((r.match_score || 0) * 100),
        })),
      ]

      const selectedCareerData = Array.from(selectedCareers)
        .map(careerId => allRecommendations.find(r => r.careerId === careerId))
        .filter(Boolean)

      if (selectedCareerData.length === 0) {
        throw new Error("Selected careers not found")
      }

      // Call Python backend to generate action plans
      const response = await fetch('http://localhost:8001/api/selected-careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          careerIds: Array.from(selectedCareers),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate action plans')
      }

      const result = await response.json()

      // Save to Convex
      for (const selectedCareer of result.selectedCareers) {
        // Save selected career
        await selectCareersMutation({
          careerIds: [selectedCareer.careerId],
          careers: [{
            careerId: selectedCareer.careerId,
            careerName: selectedCareerData.find(c => c.careerId === selectedCareer.careerId)?.careerName || '',
            industry: selectedCareerData.find(c => c.careerId === selectedCareer.careerId)?.industry || '',
            fitScore: selectedCareerData.find(c => c.careerId === selectedCareer.careerId)?.fitScore || 0,
          }],
        })

        // Save action plan
        await upsertCareerCompassPlan({
          careerId: selectedCareer.careerId,
          phases: selectedCareer.phases,
          tasks: selectedCareer.tasks,
          videos: selectedCareer.videos || [],
          detailedPlan: selectedCareer.detailedPlan,
        })

        // Initialize progress
        await initializeProgress({
          careerId: selectedCareer.careerId,
        })
      }

      toast.success(`Generated action plans for ${result.selectedCareers.length} career${result.selectedCareers.length > 1 ? 's' : ''}!`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to generate action plans:', error)
      toast.error('Failed to generate action plans. Please try again.')
    } finally {
      setIsGeneratingPlans(false)
    }
  }

  const handleViewDetails = (career: { career?: string; role?: string; industry: string }) => {
    // Navigate to career detail page - we'll need to create this
    const careerName = career.career || career.role
    const industry = career.industry
    router.push(`/career/${encodeURIComponent(careerName)}?industry=${encodeURIComponent(industry)}`)
  }

  const handleSaveCareer = async (career: { career?: string; role?: string; industry: string; matchScore?: number; matchExplanation?: string }) => {
    try {
      if (!defaultFolder) {
        toast.error("Default folder not ready. Try again in a moment.")
        return
      }
      await createSavedCareer({
        folderId: defaultFolder._id as any,
        careerName: career.career || career.role || "",
        industry: career.industry,
        matchScore: Math.round((career.matchScore ?? career.match_score ?? 0) || 0),
        matchExplanation: career.matchExplanation || career.reasoning || "Saved from recommendations",
      })
      toast.success("Saved career!")
    } catch (error) {
      console.error("Failed to save career:", error)
      toast.error("Failed to save career")
    }
  }

  const handleAbandonRecommendations = async () => {
    if (!confirm("Are you sure you want to abandon these recommendations? This will clear all your career analysis and you'll need to start over.")) {
      return
    }

    setIsAbandoning(true)
    try {
      await abandonRecommendations()
      toast.success("Recommendations cleared. Starting fresh!")
      router.push('/voice-realtime')
    } catch (error) {
      console.error("Failed to abandon recommendations:", error)
      toast.error("Failed to clear recommendations")
    } finally {
      setIsAbandoning(false)
    }
  }

  const handleRemoveCareer = async (career: { career?: string; role?: string; industry: string }, source: 'ai-analysis' | 'convex') => {
    const careerName = career.career || career.role || ''
    const careerKey = `${careerName}-${career.industry}`
    setRemovingCareer(careerKey)

    try {
      if (source === 'convex' && recommendations?._id) {
        await removeRecommendation({
          recommendationId: recommendations._id,
          industry: career.industry,
          role: careerName,
        })
      } else if (source === 'ai-analysis') {
        await removeRecommendationFromProfile({
          career: careerName,
        })
      }

      // Remove from selection if selected
      setSelectedCareers(prev => {
        const newSet = new Set(prev)
        newSet.delete(careerKey)
        return newSet
      })

      toast.success(`Removed ${careerName} from recommendations`)
    } catch (error) {
      console.error("Failed to remove career:", error)
      toast.error("Failed to remove career")
    } finally {
      setRemovingCareer(null)
    }
  }

  const runAnalysis = async () => {
    if (!user) {
      toast.error("Please sign in to analyze your profile")
      router.push("/sign-in")
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      // Get transcript from sessionStorage
      const transcript = sessionStorage.getItem("voiceOnboardingTranscript")
      if (!transcript) {
        throw new Error("No transcript found. Please complete the voice session first.")
      }

      // Call Python backend for analysis
      const result = await careerAPI.onboardingStart(transcript)

      if (!result.success) {
        throw new Error("Analysis failed")
      }

      // Save to Convex
      await getOrCreateCareerProfile({ userId: user.id })
      await updateCareerProfile({
        rawOnboardingTranscript: transcript,
        aiAnalysisResults: undefined,
      })

      // Normalize and save recommendations with Career Compass fields
      const normalized = (result.recommendedRoles || []).map((r: any) => ({
        careerId: r.careerId || `${r.role || r.career}-${r.industry}`,
        industry: r.industry || "Technology",
        role: r.career || r.role,
        matchScore: Math.round((r.match_score ?? r.matchScore ?? 0) * 100),
        matchExplanation: r.reasoning || r.matchExplanation || r.whyGoodFit || "",
        // Career Compass fields
        medianSalary: r.medianSalary,
        growthOutlook: r.growthOutlook,
        estimatedTime: r.estimatedTime,
        summary: r.summary,
      }))

      await createCareerRecommendations({
        agentRunId: result.orchestratorSessionId || "session",
        recommendations: normalized,
      })

      // Clear transcript from sessionStorage
      sessionStorage.removeItem("voiceOnboardingTranscript")

      // Remove analyzing query param and show results
      router.replace("/recommendations")
      toast.success("Analysis complete! Here are your career recommendations.")
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze your profile")
      toast.error("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Check for analyzing query param on mount
  useEffect(() => {
    const analyzing = searchParams?.get("analyzing")
    if (analyzing === "true" && !isAnalyzing && !analysisError) {
      runAnalysis()
    }
  }, [searchParams])

  // Show analysis loading state
  if (isAnalyzing) {
    return <AnalysisLoading onComplete={() => setIsAnalyzing(false)} />
  }

  // Show analysis error with retry option
  if (analysisError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <IconAlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Analysis Failed</CardTitle>
            <CardDescription>{analysisError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              Retry Analysis
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please sign in to view career recommendations.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!recommendations && !userProfile?.aiAnalysisResults) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBulb className="h-5 w-5" />
              Career Recommendations
            </CardTitle>
            <CardDescription>
              Complete the onboarding process to get personalized career recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <IconBulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No recommendations available yet. Complete your profile to get started!
              </p>
              <Button onClick={() => router.push('/voice-realtime')}>
                Complete Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Career Recommendations</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleAbandonRecommendations}
          disabled={isAbandoning}
          className="gap-2"
        >
          <IconTrash className="w-4 h-4" />
          {isAbandoning ? "Abandoning..." : "Abandon & Start Over"}
        </Button>
      </div>

      {/* Career Selection Controls */}
      {(recommendations?.recommendations?.length > 0 || userProfile?.aiAnalysisResults?.recommendations?.length > 0) && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Select Your Career Paths</h3>
                <p className="text-sm text-muted-foreground">
                  Choose up to 3 careers to create personalized action plans with gamified progress tracking
                </p>
                <p className="text-sm font-medium mt-2">
                  {selectedCareers.size}/3 careers selected
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleGenerateActionPlans}
                disabled={selectedCareers.size === 0 || isGeneratingPlans}
                className="gap-2"
              >
                <IconSparkles className="w-5 h-5" />
                {isGeneratingPlans ? "Generating Plans..." : `Generate Action Plans (${selectedCareers.size})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display AI Analysis Summary */}
      {userProfile?.aiAnalysisResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
            <CardDescription>
              Based on your background, skills, and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <h4 className="font-semibold mb-2">Key Strengths</h4>
                <p className="text-sm text-muted-foreground">
                  {userProfile.aiAnalysisResults.skills_analysis?.key_strengths?.slice(0, 3).join(', ')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Career Interests</h4>
                <p className="text-sm text-muted-foreground">
                  {userProfile.aiAnalysisResults.passions_analysis?.top_interests?.slice(0, 3).join(', ')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Work Values</h4>
                <p className="text-sm text-muted-foreground">
                  {userProfile.aiAnalysisResults.values_analysis?.core_values?.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Display recommendations from Convex (Career Compass enhanced) */}
        {recommendations?.recommendations?.map((rec, index) => {
          const careerId = rec.careerId || `${rec.role}-${rec.industry}`
          const careerKey = `${rec.role}-${rec.industry}`
          const isSelected = selectedCareers.has(careerId)

          return (
            <Card
              key={`convex-${index}`}
              className={`hover:shadow-lg transition-all relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleCareerSelection(careerId)}
                  className="h-5 w-5"
                />
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveCareer(rec, 'convex')}
                disabled={removingCareer === careerKey}
              >
                <IconX className="h-4 w-4" />
              </Button>

              <CardHeader className="pt-12">
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <CardTitle className="text-lg">{rec.role}</CardTitle>
                    <CardDescription>{rec.industry}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <IconCheck className="h-3 w-3" />
                    {rec.matchScore}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                {rec.summary && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {rec.summary}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-4">
                  {rec.matchExplanation}
                </p>

                {/* Career Compass Enhanced Fields */}
                <div className="space-y-2 mb-4">
                  {rec.medianSalary && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconDollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Salary:</span>
                      <span className="text-muted-foreground">{rec.medianSalary}</span>
                    </div>
                  )}
                  {rec.growthOutlook && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconTrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Growth:</span>
                      <span className="text-muted-foreground">{rec.growthOutlook}</span>
                    </div>
                  )}
                  {rec.estimatedTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <IconClock className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Timeline:</span>
                      <span className="text-muted-foreground">{rec.estimatedTime}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(rec)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSaveCareer(rec)}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Display recommendations from AI analysis */}
        {userProfile?.aiAnalysisResults?.recommendations?.map((rec: any, index: number) => {
          const careerId = `${rec.career}-${rec.industry || rec.salary_range}`
          const careerKey = careerId
          const isSelected = selectedCareers.has(careerId)

          return (
            <Card
              key={`ai-${index}`}
              className={`hover:shadow-lg transition-all relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleCareerSelection(careerId)}
                  className="h-5 w-5"
                />
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveCareer(rec, 'ai-analysis')}
                disabled={removingCareer === careerKey}
              >
                <IconX className="h-4 w-4" />
              </Button>

              <CardHeader className="pt-12">
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <CardTitle className="text-lg">{rec.career}</CardTitle>
                    <CardDescription>{rec.salary_range}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <IconCheck className="h-3 w-3" />
                    {Math.round(rec.match_score * 100)}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {rec.reasoning}
                </p>
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.required_skills?.slice(0, 5).map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(rec)}>
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSaveCareer(rec)}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
