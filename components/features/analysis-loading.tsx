"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBrain, IconCheck, IconLoader2 } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"

interface AnalysisStage {
  name: string
  duration: number // seconds
  description: string
}

const ANALYSIS_STAGES: AnalysisStage[] = [
  { name: "Processing Transcript", duration: 3, description: "Analyzing your conversation..." },
  { name: "Skills Analysis", duration: 4, description: "Identifying your strengths and abilities..." },
  { name: "Personality Assessment", duration: 4, description: "Understanding your work style..." },
  { name: "Passion Discovery", duration: 3, description: "Discovering what drives you..." },
  { name: "Values Alignment", duration: 3, description: "Aligning with your core values..." },
  { name: "Career Matching", duration: 5, description: "Finding perfect career matches..." },
]

interface AnalysisLoadingProps {
  onComplete?: () => void
  totalDuration?: number // Override total duration in seconds
}

export default function AnalysisLoading({ onComplete, totalDuration }: AnalysisLoadingProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completedStages, setCompletedStages] = useState<number[]>([])

  // Calculate total duration from stages or use override
  const calculatedDuration = ANALYSIS_STAGES.reduce((sum, stage) => sum + stage.duration, 0)
  const duration = totalDuration || calculatedDuration

  useEffect(() => {
    let stageStartTime = Date.now()
    let currentStage = 0
    let accumulatedTime = 0

    const interval = setInterval(() => {
      const elapsed = (Date.now() - stageStartTime) / 1000
      const stageProgress = (elapsed / ANALYSIS_STAGES[currentStage].duration) * 100
      const overallProgress = ((accumulatedTime + elapsed) / duration) * 100

      setProgress(Math.min(overallProgress, 100))

      // Move to next stage when current stage duration is complete
      if (elapsed >= ANALYSIS_STAGES[currentStage].duration) {
        setCompletedStages((prev) => [...prev, currentStage])
        accumulatedTime += ANALYSIS_STAGES[currentStage].duration
        currentStage += 1

        if (currentStage < ANALYSIS_STAGES.length) {
          setCurrentStageIndex(currentStage)
          stageStartTime = Date.now()
        } else {
          // All stages complete
          clearInterval(interval)
          setProgress(100)
          setTimeout(() => {
            onComplete?.()
          }, 500)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  const currentStage = ANALYSIS_STAGES[currentStageIndex]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <IconBrain className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl">Analyzing Your Career Profile</CardTitle>
          <CardDescription>
            Our AI agents are working together to find your perfect career matches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Stage */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <IconLoader2 className="h-5 w-5 text-primary animate-spin" />
              <h3 className="font-semibold text-lg">{currentStage.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{currentStage.description}</p>
          </div>

          {/* Stage List */}
          <div className="space-y-2">
            {ANALYSIS_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(index)
              const isCurrent = index === currentStageIndex
              const isPending = index > currentStageIndex

              return (
                <div
                  key={stage.name}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500/10 border border-green-500/20"
                      : isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/30 border border-transparent"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <IconCheck className="w-4 h-4" />
                    ) : isCurrent ? (
                      <IconLoader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm transition-all ${
                      isCompleted
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : isCurrent
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Info Message */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            This analysis typically takes {Math.round(duration)} seconds. Please don&apos;t close this window.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
