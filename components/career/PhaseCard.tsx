"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";

interface Phase {
  phaseId: number;
  name: string;
  order: number;
  status: "locked" | "unlocked" | "in-progress" | "completed";
}

interface PhaseCardProps {
  phase: Phase;
  taskProgress: {
    total: number;
    completed: number;
  };
  isActive: boolean;
  onClick: () => void;
}

/**
 * PhaseCard component for Career Compass gamification
 * Shows phase status, progress, and allows navigation
 */
export default function PhaseCard({
  phase,
  taskProgress,
  isActive,
  onClick
}: PhaseCardProps) {
  const progressPercent = taskProgress.total > 0
    ? (taskProgress.completed / taskProgress.total) * 100
    : 0;

  const getStatusIcon = () => {
    switch (phase.status) {
      case "locked":
        return <Lock className="w-5 h-5 text-muted-foreground" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "in-progress":
      case "unlocked":
        return <PlayCircle className="w-5 h-5 text-primary" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (phase.status) {
      case "locked":
        return <Badge variant="outline" className="bg-muted/50">Locked</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">Completed</Badge>;
      case "in-progress":
        return <Badge variant="default" className="bg-primary/10 border-primary/30">In Progress</Badge>;
      case "unlocked":
        return <Badge variant="outline" className="bg-primary/5 border-primary/30">Unlocked</Badge>;
      default:
        return null;
    }
  };

  const isClickable = phase.status !== "locked";

  return (
    <Card
      className={`
        group relative overflow-hidden transition-all duration-300
        ${isClickable ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl" : "opacity-60 cursor-not-allowed"}
        ${isActive ? "border-2 border-primary shadow-lg" : "border-2 border-transparent"}
        ${phase.status === "completed" ? "bg-green-500/5" : ""}
        ${phase.status === "locked" ? "bg-muted/30" : "bg-card/70 backdrop-blur-xl"}
      `}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Gradient Overlay */}
      {isClickable && (
        <div className={`
          absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
          ${phase.status === "completed"
            ? "bg-gradient-to-br from-green-500/5 to-transparent"
            : "bg-gradient-to-br from-primary/5 to-accent/5"
          }
        `} />
      )}

      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-xl transition-all duration-300
              ${phase.status === "completed"
                ? "bg-green-500/10"
                : phase.status === "locked"
                  ? "bg-muted/50"
                  : "bg-primary/10 group-hover:bg-primary/20"
              }
            `}>
              {getStatusIcon()}
            </div>
            <CardTitle className="text-lg">
              Phase {phase.phaseId}: {phase.name}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Progress Bar */}
        {phase.status !== "locked" && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {taskProgress.completed} / {taskProgress.total} tasks completed
              </span>
              <span className="font-semibold text-primary">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="relative">
              <Progress value={progressPercent} className="h-2" />
              <div
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-sm transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}

        {/* Locked Message */}
        {phase.status === "locked" && (
          <p className="text-sm text-muted-foreground">
            Complete {Math.ceil(taskProgress.total * 0.7)} tasks in the previous phase to unlock
          </p>
        )}
      </CardContent>
    </Card>
  );
}
