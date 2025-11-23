"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconHeart, IconArrowLeft, IconBriefcase, IconLoader } from "@tabler/icons-react"

export default function SavedCareersPage() {
  const { user } = useUser()
  const router = useRouter()
  const savedCareers = useQuery(api.savedCareers.getSavedCareers)

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please sign in to view your saved careers.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleViewCareer = (careerId: string) => {
    router.push(`/career/${encodeURIComponent(careerId)}`)
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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <IconHeart className="w-8 h-8 text-red-500" />
          Saved Careers
        </h1>
      </div>

      {savedCareers && savedCareers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedCareers.map((career) => (
            <Card key={career._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{career.careerName}</CardTitle>
                    <CardDescription>{career.industry}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(career.matchScore)}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {career.matchExplanation}
                </p>

                {/* Generating Status */}
                {career.isGenerating && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-3 bg-blue-50 p-2 rounded">
                    <IconLoader className="w-4 h-4 animate-spin" />
                    <span>Generating action plan...</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <IconBriefcase className="w-4 h-4" />
                  <span>Saved {new Date(career._creationTime).toLocaleDateString()}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleViewCareer(career.careerId)}
                  disabled={career.isGenerating}
                >
                  {career.isGenerating ? "Generating..." : "View Details"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <IconHeart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No saved careers yet</h3>
            <p className="text-muted-foreground mb-6">
              Start exploring career recommendations and save the ones that interest you!
            </p>
            <Button onClick={() => router.push("/recommendations")}>
              Browse Recommendations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}