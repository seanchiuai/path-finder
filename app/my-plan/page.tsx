"use client"

import { useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function MyPlanPage() {
  const actionPlans = useQuery(api.actionPlans.getActionPlans)
  const recommendations = useQuery(api.careerRecommendations.getCareerRecommendations)
  const generatePlan = useAction(api.actionPlans.generateActionPlan)
  const [timeframe, setTimeframe] = useState<string>("6_months")
  const [isGenerating, setIsGenerating] = useState(false)

  const recommendationId = recommendations?._id

  const handleGenerate = async () => {
    if (!recommendationId) return
    setIsGenerating(true)
    try {
      await generatePlan({ recommendationId, timeframe })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">My Career Plan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Action Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3_months">3 months</SelectItem>
              <SelectItem value="6_months">6 months</SelectItem>
              <SelectItem value="1_year">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={!recommendationId || isGenerating}>
            {isGenerating ? "Generating..." : "Generate Plan"}
          </Button>
        </CardContent>
      </Card>

      {actionPlans && actionPlans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {actionPlans.map(plan => (
            <Card key={plan._id}>
              <CardHeader>
                <CardTitle>{plan.timeframe} Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.generatedPlanMarkdown && (
                  <div className="prose prose-sm">
                    <ReactMarkdown>{plan.generatedPlanMarkdown}</ReactMarkdown>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Phases</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {plan.phases.map((ph: any, idx: number) => (
                      <li key={idx}>{ph.title} – {ph.duration}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No action plans yet. Choose a career and generate a plan above.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
