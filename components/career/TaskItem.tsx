"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Briefcase, Users, Target, Zap } from "lucide-react";

interface Task {
  taskId: string;
  title: string;
  track: "learning" | "projects" | "networking" | "simulator";
  phase: number;
  xp: number;
  status: "not_started" | "in_progress" | "completed" | "skipped";
}

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, newStatus: "completed" | "not_started") => void;
  disabled?: boolean;
}

/**
 * TaskItem component for Career Compass gamification
 * Shows task with track icon, XP badge, and completion checkbox
 */
export default function TaskItem({ task, onToggle, disabled = false }: TaskItemProps) {
  const isCompleted = task.status === "completed";

  const getTrackIcon = () => {
    switch (task.track) {
      case "learning":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "projects":
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case "networking":
        return <Users className="w-4 h-4 text-green-500" />;
      case "simulator":
        return <Target className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTrackLabel = () => {
    switch (task.track) {
      case "learning":
        return "Learning";
      case "projects":
        return "Projects";
      case "networking":
        return "Networking";
      case "simulator":
        return "Simulator";
      default:
        return task.track;
    }
  };

  const getTrackColor = () => {
    switch (task.track) {
      case "learning":
        return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
      case "projects":
        return "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400";
      case "networking":
        return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
      case "simulator":
        return "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400";
      default:
        return "";
    }
  };

  return (
    <div
      className={`
        group flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-300
        ${isCompleted
          ? "bg-green-500/5 border-green-500/20"
          : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/80"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => {
          if (!disabled) {
            onToggle(task.taskId, checked ? "completed" : "not_started");
          }
        }}
        disabled={disabled}
        className="mt-1"
      />

      {/* Task Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`
              font-medium leading-snug transition-all duration-300
              ${isCompleted ? "line-through text-muted-foreground" : ""}
            `}
          >
            {task.title}
          </h4>

          {/* XP Badge */}
          <Badge variant="secondary" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400 shrink-0">
            <Zap className="w-3 h-3 mr-1" />
            {task.xp} XP
          </Badge>
        </div>

        {/* Track Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${getTrackColor()}`}>
            <span className="mr-1">{getTrackIcon()}</span>
            {getTrackLabel()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
