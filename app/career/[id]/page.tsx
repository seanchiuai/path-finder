"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SalaryBellCurve } from "@/components/features/salary-bell-curve"
import { useSearchParams } from "next/navigation"
import { IconBriefcase, IconMapPin, IconCurrencyDollar, IconBook, IconUsers, IconTarget, IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface CareerDetailPageProps {
  params: {
    id: string
  }
}

export default function CareerDetailPage({ params }: CareerDetailPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const industry = searchParams.get('industry')
  
  const careerName = decodeURIComponent(params.id)
  const userProfile = useQuery(api.userProfiles.getUserProfile, user?.id ? { userId: user.id } : "skip")
  
  // Mock data for demonstration - in production, this would come from the Python backend
  const careerData = {
    name: careerName,
    industry: industry || "Technology",
    matchScore: 85,
    matchExplanation: "Based on your technical background, problem-solving skills, and interest in building scalable solutions, this career aligns well with your profile.",
    salaryData: [
      { percentile: 10, salary: 65000, experience: 1 },
      { percentile: 25, salary: 85000, experience: 2 },
      { percentile: 50, salary: 120000, experience: 4 },
      { percentile: 75, salary: 160000, experience: 7 },
      { percentile: 90, salary: 220000, experience: 10 }
    ],
    requiredSkills: ["JavaScript", "React", "Node.js", "Database Design", "API Development"],
    learningResources: [
      { type: "video", title: "Full Stack Development Course", description: "Complete web development bootcamp" },
      { type: "article", title: "System Design Interview Prep", description: "Master system design concepts" },
      { type: "simulator", title: "Code Review Simulator", description: "Practice code review scenarios" }
    ],
    networkingOpportunities: [
      { type: "local_expert", name: "Tech Meetup Group", location: "Downtown Tech Hub" },
      { type: "online_expert", name: "Senior Developer Mentorship", location: "Remote" }
    ]
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please sign in to view career details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="gap-2"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{careerData.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconBriefcase className="h-4 w-4" />
                {careerData.industry}
              </span>
              <span className="flex items-center gap-1">
                <IconMapPin className="h-4 w-4" />
                Remote/Hybrid
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {careerData.matchScore}% Match
          </Badge>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Why This Career Fits You</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{careerData.matchExplanation}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiment">Experiment</TabsTrigger>
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Salary Bell Curve */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar className="h-5 w-5" />
                Salary Expectations
              </CardTitle>
              <CardDescription>
                Salary distribution based on experience level in {careerData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalaryBellCurve data={careerData.salaryData} />
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Required Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {careerData.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Your Profile Match */}
          {userProfile?.aiAnalysisResults && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Your Strengths</h4>
                    <div className="space-y-1">
                      {userProfile.aiAnalysisResults.skills?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="mr-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Growth Areas</h4>
                    <div className="space-y-1">
                      {careerData.requiredSkills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="mr-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Experiment Tab */}
        <TabsContent value="experiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Try It Yourself
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {careerData.learningResources.filter(r => r.type === 'simulator' || r.type === 'try_on_own').map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    <Button size="sm">Start Simulation</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learn Tab */}
        <TabsContent value="learn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBook className="h-5 w-5" />
                Learning Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {careerData.learningResources.filter(r => r.type === 'article' || r.type === 'video' || r.type === 'blog').map((resource, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                    <Button size="sm" variant="outline">View Resource</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Networking Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {careerData.networkingOpportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{opportunity.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="h-3 w-3" />
                        {opportunity.location}
                      </span>
                    </p>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}