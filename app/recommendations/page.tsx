"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconBulb, IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

export default function RecommendationsPage() {
  const { user } = useUser()
  const router = useRouter()
  const userProfile = useQuery(api.userProfiles.getUserProfile)
  const recommendations = useQuery(api.careerRecommendations.getCareerRecommendations)
  
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
  const [selectingCareer, setSelectingCareer] = useState<string | null>(null)

  // Handlers
  const handleSelectCareer = async (career: { career?: string; role?: string; industry: string; matchScore?: number; matchExplanation?: string }, recommendationId: string) => {
    const careerKey = `${career.career || career.role}-${career.industry}`
    setSelectingCareer(careerKey)
    
    try {
      await selectRecommendation({
        recommendationId: recommendationId as Id<"careerRecommendations">,
        industry: career.industry,
        role: career.career || career.role,
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
      <div className="flex items-center gap-4 mb-6">
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
        {/* Display recommendations from AI analysis */}
        {userProfile?.aiAnalysisResults?.recommendations?.map((rec: { career?: string; role?: string; industry: string; matchScore?: number; matchExplanation?: string }, index: number) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{rec.career}</CardTitle>
                  <CardDescription>{rec.salary_range}</CardDescription>
                </div>
                <Badge variant="secondary">{Math.round(rec.match_score * 100)}% Match</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {rec.reasoning}
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2">Required Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {rec.required_skills.slice(0, 5).map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleSelectCareer(rec, recommendations?._id || 'ai-analysis')}
                  disabled={selectingCareer === `${rec.career}-${rec.salary_range}`}
                >
                  {selectingCareer === `${rec.career}-${rec.salary_range}` ? "Choosing..." : "Choose This Career"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleViewDetails(rec)}>
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSaveCareer(rec)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Display recommendations from Convex */}
        {recommendations?.recommendations?.map((rec, index) => (
          <Card key={`convex-${index}`} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{rec.role}</CardTitle>
                  <CardDescription>{rec.industry}</CardDescription>
                </div>
                <Badge variant="secondary">{rec.matchScore}% Match</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {rec.matchExplanation}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleSelectCareer(rec, recommendations!._id)}
                  disabled={selectingCareer === `${rec.role}-${rec.industry}`}
                >
                  {selectingCareer === `${rec.role}-${rec.industry}` ? "Choosing..." : "Choose This Career"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleViewDetails(rec)}>
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSaveCareer(rec)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
