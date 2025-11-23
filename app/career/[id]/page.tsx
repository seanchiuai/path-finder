"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnimatedBackground from "@/components/AnimatedBackground";
import XPProgressBar from "@/components/career/XPProgressBar";
import PhaseCard from "@/components/career/PhaseCard";
import TaskItem from "@/components/career/TaskItem";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Users,
  Target,
  Youtube,
  Flame,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface CareerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CareerDetailPage({ params }: CareerDetailPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const unwrapped = use(params);
  const careerId = decodeURIComponent(unwrapped.id);

  // Queries
  const selectedCareers = useQuery(api.selectedCareers.getActiveSelectedCareers);
  const actionPlan = useQuery(api.actionPlans.getActionPlanByCareer, { careerId });
  const progress = useQuery(api.careerProgress.getCareerProgress, { careerId });

  // Mutations
  const updateTaskMutation = useMutation(api.actionPlans.updateTaskStatus);
  const updateProgressMutation = useMutation(api.careerProgress.updateTaskProgress);

  // State
  const [activePhaseId, setActivePhaseId] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please sign in to view career details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find selected career info
  const career = selectedCareers?.find(c => c.careerId === careerId);

  if (!career || !actionPlan || !progress) {
    return (
      <>
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  // Get active phase tasks
  const activePhase = actionPlan.phases?.find(p => p.phaseId === activePhaseId);
  const phaseTasks = actionPlan.tasks?.filter(t => t.phase === activePhaseId) || [];

  // Group tasks by track
  const tasksByTrack = {
    learning: phaseTasks.filter(t => t.track === "learning"),
    projects: phaseTasks.filter(t => t.track === "projects"),
    networking: phaseTasks.filter(t => t.track === "networking"),
    simulator: phaseTasks.filter(t => t.track === "simulator")
  };

  // Calculate phase progress
  const getPhaseProgress = (phaseId: number) => {
    const tasks = actionPlan.tasks?.filter(t => t.phase === phaseId) || [];
    const completed = tasks.filter(t => t.status === "completed").length;
    return { total: tasks.length, completed };
  };

  // Handle task toggle
  const handleTaskToggle = async (taskId: string, newStatus: "completed" | "not_started") => {
    if (isUpdating) return;

    const task = actionPlan.tasks?.find(t => t.taskId === taskId);
    if (!task) return;

    setIsUpdating(true);

    try {
      // Update task status in action plan
      await updateTaskMutation({
        careerId,
        taskId,
        newStatus
      });

      // Calculate new stats
      const totalTasks = actionPlan.tasks?.length || 0;
      const completedTasks = actionPlan.tasks?.filter(t =>
        t.taskId === taskId ? newStatus === "completed" : t.status === "completed"
      ).length || 0;

      // Update progress
      await updateProgressMutation({
        careerId,
        taskId,
        taskXP: task.xp,
        oldStatus: task.status,
        newStatus,
        totalTasks,
        completedTasks
      });

      toast.success(
        newStatus === "completed"
          ? `Task completed! +${task.xp} XP earned`
          : "Task marked as incomplete"
      );
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Career Header */}
        <Card className="bg-card/80 backdrop-blur-xl border-2 border-primary/30 shadow-2xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-primary/10 border-primary/30">
                    {career.industry}
                  </Badge>
                  <Badge variant="outline" className="bg-accent/10 border-accent/30">
                    <Award className="w-3 h-3 mr-1" />
                    {Math.round(career.fitScore)}% fit
                  </Badge>
                </div>
                <CardTitle className="text-3xl md:text-4xl">{career.careerName}</CardTitle>
                <CardDescription className="text-base">
                  {progress.completionPercent}% complete • Level {progress.level}
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div className="text-sm">
                    <div className="font-semibold text-orange-600 dark:text-orange-400">{progress.streak}</div>
                    <div className="text-xs text-muted-foreground">day streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="text-sm">
                    <div className="font-semibold text-green-600 dark:text-green-400">{progress.tasksCompletedThisWeek}</div>
                    <div className="text-xs text-muted-foreground">this week</div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <XPProgressBar
              currentXP={progress.xp}
              level={progress.level}
              xpToNextLevel={progress.xpToNextLevel}
            />
          </CardContent>
        </Card>

        {/* Phases Navigation */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Learning Phases
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {actionPlan.phases?.map(phase => (
              <PhaseCard
                key={phase.phaseId}
                phase={phase}
                taskProgress={getPhaseProgress(phase.phaseId)}
                isActive={activePhaseId === phase.phaseId}
                onClick={() => setActivePhaseId(phase.phaseId)}
              />
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <Card className="bg-card/80 backdrop-blur-xl border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">
              Phase {activePhaseId}: {activePhase?.name}
            </CardTitle>
            <CardDescription>
              Complete tasks to earn XP and unlock the next phase at 70% completion
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="learning" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="learning" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Learning ({tasksByTrack.learning.length})
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  Projects ({tasksByTrack.projects.length})
                </TabsTrigger>
                <TabsTrigger value="networking" className="gap-2">
                  <Users className="w-4 h-4" />
                  Networking ({tasksByTrack.networking.length})
                </TabsTrigger>
                <TabsTrigger value="simulator" className="gap-2">
                  <Target className="w-4 h-4" />
                  Simulator ({tasksByTrack.simulator.length})
                </TabsTrigger>
              </TabsList>

              {/* Learning Tasks */}
              <TabsContent value="learning" className="space-y-3">
                {tasksByTrack.learning.length > 0 ? (
                  tasksByTrack.learning.map(task => (
                    <TaskItem
                      key={task.taskId}
                      task={task}
                      onToggle={handleTaskToggle}
                      disabled={isUpdating}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No learning tasks in this phase
                  </p>
                )}
              </TabsContent>

              {/* Projects Tasks */}
              <TabsContent value="projects" className="space-y-3">
                {tasksByTrack.projects.length > 0 ? (
                  tasksByTrack.projects.map(task => (
                    <TaskItem
                      key={task.taskId}
                      task={task}
                      onToggle={handleTaskToggle}
                      disabled={isUpdating}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No project tasks in this phase
                  </p>
                )}
              </TabsContent>

              {/* Networking Tasks */}
              <TabsContent value="networking" className="space-y-3">
                {tasksByTrack.networking.length > 0 ? (
                  tasksByTrack.networking.map(task => (
                    <TaskItem
                      key={task.taskId}
                      task={task}
                      onToggle={handleTaskToggle}
                      disabled={isUpdating}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No networking tasks in this phase
                  </p>
                )}
              </TabsContent>

              {/* Simulator Tasks */}
              <TabsContent value="simulator" className="space-y-3">
                {tasksByTrack.simulator.length > 0 ? (
                  tasksByTrack.simulator.map(task => (
                    <TaskItem
                      key={task.taskId}
                      task={task}
                      onToggle={handleTaskToggle}
                      disabled={isUpdating}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No simulator tasks in this phase
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Videos Section */}
        {actionPlan.videos && actionPlan.videos.length > 0 && (
          <Card className="bg-card/80 backdrop-blur-xl border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Youtube className="w-6 h-6 text-red-500" />
                Learning Resources
              </CardTitle>
              <CardDescription>
                Curated video tutorials to help you master this career
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {actionPlan.videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                        alt={video.title}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Youtube className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
