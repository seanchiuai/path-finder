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
import { useEffect, useState, use } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"
import { careerAPI } from "@/src/lib/api"

interface CareerDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CareerDetailPage({ params }: CareerDetailPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const industry = searchParams.get('industry')
  
  const unwrapped = use(params)
  const careerName = decodeURIComponent(unwrapped.id)
  const userProfile = useQuery(api.userProfiles.getUserProfile)
  
  // Simulator state
  const [simulatorActive, setSimulatorActive] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [userAnswer, setUserAnswer] = useState("")
  const [simulationResults, setSimulationResults] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  const [careerData, setCareerData] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const details = await careerAPI.getCareerDetails(careerName, industry || undefined)
        setCareerData({
          name: careerName,
          industry: details.industry,
          matchScore: 85,
          matchExplanation: userProfile?.aiAnalysisResults ? "Personalized based on your profile" : "",
          salaryData: details.salaryDataPoints.map((d: any) => ({
            percentile: d.percentile,
            salary: Math.round((d.salaryRange.min + d.salaryRange.max) / 2),
            experience: d.avgYearsExperience
          })),
          resources: details.resources
        })
      } catch (e) {
        // Fallback minimal
        setCareerData({ name: careerName, industry: industry || "Technology", salaryData: [], resources: [] })
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerName, industry])

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

  // Simulator functions
  const startSimulation = () => {
    if (!careerData) return
    setSimulatorActive(true)
    setCurrentQuestionIndex(0)
    setSimulationResults([])
    setUserAnswer("")
    
    // Set first question based on career
    const firstQuestion = getSimulationQuestion(0)
    setCurrentQuestion(firstQuestion)
  }

  const getSimulationQuestion = (index: number) => {
    const roleLabel = careerData?.name || careerName
    const questions = [
      `You're working as a ${roleLabel} and your team lead asks you to debug a critical production issue. The application is down and users can't access the service. What would be your first steps?`,
      `As a ${roleLabel}, you're asked to implement a new feature that will impact the entire system architecture. How would you approach this challenge?`,
      `You're presenting your work to stakeholders who aren't technical. How do you explain complex ${roleLabel} concepts to them?`,
      `Your team is behind schedule on a critical project. As the ${roleLabel}, how do you handle the pressure and communicate with your team?`
    ]
    return questions[index] || questions[0]
  }

  const evaluateAnswer = (question: string, answer: string) => {
    const answerLower = answer.toLowerCase()
    
    if (question.includes('debug')) {
      const hasGoodKeywords = answerLower.includes('log') || answerLower.includes('monitor') || 
                               answerLower.includes('investigate') || answerLower.includes('check')
      return hasGoodKeywords ? 
        "Excellent! You mentioned systematic investigation approaches like checking logs or monitoring - this shows strong debugging instincts." :
        "Consider mentioning systematic approaches like log analysis, monitoring tools, or step-by-step investigation."
    }
    
    if (question.includes('architecture')) {
      const hasGoodKeywords = answerLower.includes('plan') || answerLower.includes('design') || 
                               answerLower.includes('research') || answerLower.includes('team')
      return hasGoodKeywords ?
        "Great thinking! You mentioned planning and research - essential for architectural decisions." :
        "Think about mentioning planning, research, stakeholder input, or team collaboration."
    }
    
    if (question.includes('presenting')) {
      const hasGoodKeywords = answerLower.includes('simple') || answerLower.includes('visual') || 
                               answerLower.includes('analogy') || answerLower.includes('benefits')
      return hasGoodKeywords ?
        "Perfect! You understand the importance of simplifying and using visual aids for non-technical audiences." :
        "Consider using simple language, visual aids, analogies, or focusing on benefits rather than technical details."
    }
    
    if (question.includes('pressure')) {
      const hasGoodKeywords = answerLower.includes('communicate') || answerLower.includes('prioritize') || 
                               answerLower.includes('support') || answerLower.includes('realistic')
      return hasGoodKeywords ?
        "Excellent approach! Communication and prioritization are key when handling project pressure." :
        "Think about open communication, prioritizing tasks, supporting your team, or setting realistic expectations."
    }
    
    return "Good effort! Keep practicing your communication and problem-solving skills."
  }

  const submitAnswer = () => {
    if (!userAnswer.trim()) return
    
    const feedback = evaluateAnswer(currentQuestion, userAnswer)
    
    setSimulationResults(prev => [
      ...prev, 
      `**Q${currentQuestionIndex + 1}:** ${currentQuestion}`, 
      `**Your Answer:** ${userAnswer}`, 
      `**Feedback:** ${feedback}`, 
      ""
    ])
    
    // Move to next question or end simulation
    if (currentQuestionIndex < 3) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setCurrentQuestion(getSimulationQuestion(nextIndex))
      setUserAnswer("")
    } else {
      // End simulation
      setSimulationResults(prev => [
        ...prev,
        "🎉 **Simulation Complete!**",
        "You've completed the career simulation. Review your answers and feedback above to improve your approach."
      ])
      setTimeout(() => {
        setSimulatorActive(false)
      }, 3000)
    }
  }

  const resetSimulation = () => {
    setSimulatorActive(false)
    setCurrentQuestion("")
    setUserAnswer("")
    setSimulationResults([])
    setCurrentQuestionIndex(0)
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
            <h1 className="text-4xl font-bold mb-2">{careerData?.name || careerName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IconBriefcase className="h-4 w-4" />
                {careerData?.industry || industry}
                </span>
                <span className="flex items-center gap-1">
                  <IconMapPin className="h-4 w-4" />
                  Remote/Hybrid
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
            {careerData?.matchScore ?? 0}% Match
            </Badge>
          </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Why This Career Fits You</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{careerData?.matchExplanation || ""}</p>
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
          {careerData && (
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
                <SalaryBellCurve data={careerData.salaryData || []} />
              </CardContent>
            </Card>
          )}

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
                {(userProfile?.aiAnalysisResults?.skills || []).slice(0, 5).map((skill: string, index: number) => (
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
                      {(userProfile?.aiAnalysisResults?.skills || []).slice(3, 6).map((skill, index) => (
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
                Career Simulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!simulatorActive ? (
                <div className="text-center space-y-4">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-2">Test Your Skills</h3>
                    <p className="text-muted-foreground mb-4">
                      Practice real-world scenarios you'll encounter as a {careerData?.name || careerName}. 
                      Answer questions and get personalized feedback to improve your approach.
                    </p>
                  </div>
                  <Button onClick={startSimulation} size="lg">
                    <IconTarget className="w-4 h-4 mr-2" />
                    Start Career Simulation
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of 4</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetSimulation}
                      className="text-destructive"
                    >
                      End Simulation
                    </Button>
                  </div>
                  
                  {/* Current question */}
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Scenario:</h4>
                    <p className="text-sm">{currentQuestion}</p>
                  </div>

                  {/* Answer input */}
                  <div className="space-y-3">
                    <Label htmlFor="answer">Your Response:</Label>
                    <Textarea
                      id="answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Share your approach to this situation..."
                      className="min-h-[100px]"
                      disabled={currentQuestionIndex >= 4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        onClick={submitAnswer} 
                        disabled={!userAnswer.trim() || currentQuestionIndex >= 4}
                      >
                        Submit Answer
                      </Button>
                    </div>
                  </div>

                  {/* Results */}
                  {simulationResults.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Simulation Results:</h4>
                      <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                        {simulationResults.map((result, index) => (
                          <div key={index} className="mb-3 last:mb-0">
                            <ReactMarkdown className="text-sm prose prose-sm max-w-none">
                              {result}
                            </ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional practice resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBook className="h-5 w-5" />
                Practice Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Mock Interviews</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Practice common interview questions for {careerData?.name || careerName} roles
                  </p>
                  <Button size="sm" variant="outline">Practice Interview</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Technical Challenges</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Solve real coding and problem-solving challenges
                  </p>
                  <Button size="sm" variant="outline">Start Challenge</Button>
                </div>
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
                {(careerData?.resources || []).filter((r: any) => r.type === 'article' || r.type === 'video' || r.type === 'blog').map((resource: any, index: number) => (
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
                {(careerData?.resources || []).filter((r: any) => r.type === 'local_expert' || r.type === 'online_expert').map((opportunity: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{opportunity.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="h-3 w-3" />
                        {opportunity.metadata?.location || "Remote"}
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
