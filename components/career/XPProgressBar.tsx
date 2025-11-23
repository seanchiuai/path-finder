"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface XPProgressBarProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
  showBadge?: boolean;
}

/**
 * XPProgressBar component for Career Compass gamification
 * Shows current level, XP progress to next level
 */
export default function XPProgressBar({
  currentXP,
  level,
  xpToNextLevel,
  className = "",
  showBadge = true
}: XPProgressBarProps) {
  // Calculate current level's base XP and next level's XP
  const currentLevelXP = level * level * 100;
  const nextLevelXP = (level + 1) * (level + 1) * 100;
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpRequiredForLevel = nextLevelXP - currentLevelXP;
  const progressPercent = (xpInCurrentLevel / xpRequiredForLevel) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {showBadge && (
          <Badge variant="secondary" className="bg-primary/10 border-primary/30 text-primary">
            <Zap className="w-3 h-3 mr-1" />
            Level {level}
          </Badge>
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {xpInCurrentLevel} / {xpRequiredForLevel} XP
        </span>
      </div>

      <div className="relative">
        <Progress value={progressPercent} className="h-2.5" />
        <div
          className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-sm transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {xpToNextLevel} XP to Level {level + 1}
      </p>
    </div>
  );
}
