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
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink
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
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    if (updatingTaskId) return;

    const task = actionPlan.tasks?.find(t => t.taskId === taskId);
    if (!task) return;

    // Optimistic update - immediately update UI
    setOptimisticTasks(prev => ({ ...prev, [taskId]: newStatus }));
    setUpdatingTaskId(taskId);

    console.log(`[Task Toggle] Starting update for task ${taskId} to ${newStatus}`);

    try {
      // Update task status in action plan
      console.log('[Task Toggle] Calling updateTaskMutation...');
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
      console.log('[Task Toggle] Calling updateProgressMutation...');
      await updateProgressMutation({
        careerId,
        taskId,
        taskXP: task.xp,
        oldStatus: task.status,
        newStatus,
        totalTasks,
        completedTasks
      });

      console.log('[Task Toggle] Mutations completed successfully');

      // Small delay to allow Convex to propagate changes
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success(
        newStatus === "completed"
          ? `Task completed! +${task.xp} XP earned`
          : "Task marked as incomplete"
      );
    } catch (error) {
      console.error("[Task Toggle] Error updating task:", error);
      // Revert optimistic update on error
      setOptimisticTasks(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      toast.error("Failed to update task. Please try again.");
    } finally {
      setUpdatingTaskId(null);
      // Clear optimistic state after a delay to let real data come through
      setTimeout(() => {
        setOptimisticTasks(prev => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      }, 500);
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

        {/* Grid Layout: Main Content + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">

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
                      disabled={updatingTaskId === task.taskId}
                      optimisticStatus={optimisticTasks[task.taskId]}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No learning tasks in this phase
                  </p>
                )}

                {/* Learning Resources Section */}
                {actionPlan.detailedPlan?.learningResources && actionPlan.detailedPlan.learningResources.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                      Recommended Resources
                    </h4>
                    <div className="space-y-2">
                      {actionPlan.detailedPlan.learningResources.map((resource: any, index: number) => {
                        const itemId = `learning-${index}`;
                        const isExpanded = expandedItems[itemId];

                        return (
                          <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                            <button
                              onClick={() => toggleExpand(itemId)}
                              className="w-full flex items-start justify-between gap-2 text-left"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{resource.title}</p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {resource.type}
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-2">
                                  {resource.description}
                                </p>
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    Learn More
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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
                      disabled={updatingTaskId === task.taskId}
                      optimisticStatus={optimisticTasks[task.taskId]}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No project tasks in this phase
                  </p>
                )}

                {/* Project Ideas Section */}
                {actionPlan.detailedPlan?.projects && actionPlan.detailedPlan.projects.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                      Project Ideas
                    </h4>
                    <div className="space-y-2">
                      {actionPlan.detailedPlan.projects.map((project: any, index: number) => {
                        const itemId = `project-${index}`;
                        const isExpanded = expandedItems[itemId];

                        return (
                          <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                            <button
                              onClick={() => toggleExpand(itemId)}
                              className="w-full flex items-start justify-between gap-2 text-left"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{project.title}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${
                                      project.difficulty === "beginner"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : project.difficulty === "intermediate"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    {project.difficulty}
                                  </Badge>
                                  {project.estimatedTime && (
                                    <Badge variant="outline" className="text-xs">
                                      {project.estimatedTime}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-2">
                                  {project.description}
                                </p>
                                {project.url && (
                                  <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    View Project Guide
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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
                      disabled={updatingTaskId === task.taskId}
                      optimisticStatus={optimisticTasks[task.taskId]}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No networking tasks in this phase
                  </p>
                )}

                {/* Networking Contacts Section */}
                {actionPlan.detailedPlan?.networkingContacts && actionPlan.detailedPlan.networkingContacts.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                      Key Contacts
                    </h4>
                    <div className="space-y-2">
                      {actionPlan.detailedPlan.networkingContacts.map((contact: any, index: number) => {
                        const itemId = `contact-${index}`;
                        const isExpanded = expandedItems[itemId];

                        return (
                          <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                            <button
                              onClick={() => toggleExpand(itemId)}
                              className="w-full flex items-start justify-between gap-2 text-left"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {contact.title} {contact.company && `at ${contact.company}`}
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t">
                                {contact.why && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <span className="font-medium">Why connect: </span>
                                    {contact.why}
                                  </p>
                                )}
                                {contact.linkedinUrl && (
                                  <a
                                    href={contact.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    View LinkedIn Profile
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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
                      disabled={updatingTaskId === task.taskId}
                      optimisticStatus={optimisticTasks[task.taskId]}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No simulator tasks in this phase
                  </p>
                )}

                {/* Interview Prep Section */}
                {actionPlan.detailedPlan?.interviewPrep && actionPlan.detailedPlan.interviewPrep.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                      Interview Resources
                    </h4>
                    <div className="space-y-2">
                      {actionPlan.detailedPlan.interviewPrep.map((resource: any, index: number) => {
                        const itemId = `interview-${index}`;
                        const isExpanded = expandedItems[itemId];

                        return (
                          <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                            <button
                              onClick={() => toggleExpand(itemId)}
                              className="w-full flex items-start justify-between gap-2 text-left"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{resource.title}</p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {resource.type}
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-2">
                                  {resource.description}
                                </p>
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    Access Resource
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

          </div>
          {/* End Main Content */}

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Career Overview Card */}
            <Card className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 p-6">
              <h3 className="mb-4 text-lg font-semibold">Career Overview</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-1 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium">Median Salary</p>
                    <p className="text-sm text-muted-foreground">
                      {actionPlan.detailedPlan?.medianSalary || "Data not available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-1 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">10-Year Growth Outlook</p>
                    <p className="text-sm text-muted-foreground">
                      {actionPlan.detailedPlan?.growthOutlook || "Data not available"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Day in the Life Videos */}
            {actionPlan.videos && actionPlan.videos.length > 0 && (
              <Card className="bg-card/80 backdrop-blur-xl border-2 border-primary/20 p-6">
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  Day in the Life
                </h3>
                <div className="space-y-4">
                  {actionPlan.videos.slice(0, 3).map((video, index) => (
                    <div key={index}>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${video.videoId}`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="border-0"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{video.title}</p>
                      {video.channel && (
                        <p className="text-xs text-muted-foreground/70 mt-1">{video.channel}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
          {/* End Sidebar */}
        </div>
        {/* End Grid Layout */}
      </div>
    </>
  );
}
