"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AnimatedBackground from "@/components/AnimatedBackground";
import {
  Target,
  Trophy,
  BookOpen,
  Users,
  Briefcase,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  LucideIcon,
  Sparkles,
  Zap
} from "lucide-react";

interface CareerMilestone {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: "completed" | "in-progress" | "not-started";
  icon: LucideIcon;
}

export default function GameifiedCareerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const careerProfile = useQuery(api.careerProfiles.getCareerProfile);
  const selectedCareer = useQuery(api.careerRecommendations.getSelectedCareer);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedCareer || !selectedCareer.role) {
    return (
      <>
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-2xl bg-card/80 backdrop-blur-xl border-2 border-primary/30 shadow-2xl p-8 md:p-12 text-center space-y-6 animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl" />

            <div className="relative space-y-6">
              <div className="relative mx-auto w-fit">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
                <Trophy className="relative w-20 h-20 mx-auto text-yellow-500" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  Choose Your Career Path
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                  You haven&apos;t selected a career yet. Let&apos;s find the perfect match for you!
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => router.push("/recommendations")}
                className="gap-2 group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/30"
              >
                <Target className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Explore Career Recommendations
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const careerRole = selectedCareer.role || "your chosen career";
  const careerIndustry = selectedCareer.industry || "your industry";
  const matchScore = selectedCareer.matchScore ?? 85;

  const careerProgress: CareerMilestone[] = [
    {
      id: 1,
      title: "Complete LinkedIn Profile",
      description: `Optimize your profile for ${careerRole} roles`,
      progress: 75,
      status: "in-progress",
      icon: Users
    },
    {
      id: 2,
      title: "Learn Key Skills",
      description: `Master essential skills for ${careerRole}`,
      progress: 40,
      status: "in-progress",
      icon: BookOpen
    },
    {
      id: 3,
      title: "Build Portfolio",
      description: "Create projects that showcase your abilities",
      progress: 20,
      status: "not-started",
      icon: Briefcase
    },
    {
      id: 4,
      title: "Network Building",
      description: `Connect with professionals in ${careerIndustry}`,
      progress: 60,
      status: "in-progress",
      icon: Users
    }
  ];

  const overallProgress = careerProgress.reduce((acc, task) => acc + task.progress, 0) / careerProgress.length;
  const skillsCount = Array.isArray(careerProfile?.skills) ? careerProfile.skills.length : 0;

  const handleNavigateToCareer = (tab?: string) => {
    const baseUrl = `/career/${encodeURIComponent(careerRole)}`;
    const params = new URLSearchParams({
      industry: careerIndustry,
      ...(tab && { tab })
    });
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Hero Section with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent backdrop-blur-sm border border-primary/20 p-8 md:p-12 text-center space-y-6 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 animate-pulse" style={{ animationDuration: "3s" }} />

          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" />
              <Trophy className="relative w-12 h-12 md:w-16 md:h-16 text-yellow-500 drop-shadow-lg" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Your Career Journey
              </h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm md:text-base px-4 py-1.5 bg-primary/10 border-primary/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {careerRole}
                </Badge>
              </div>
            </div>
          </div>

          <p className="relative text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            You&apos;re on your way to becoming a <span className="font-semibold text-primary">{careerRole}</span> in <span className="font-semibold text-accent">{careerIndustry}</span>! Complete these milestones to advance your career.
          </p>
        </div>

        {/* Career Progress Card with Glassmorphism */}
        <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-2 border-primary/30 shadow-2xl animate-scale-in hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

          <CardHeader className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  {careerRole} Career Path
                </CardTitle>
                <CardDescription className="text-base flex items-center gap-2 flex-wrap">
                  <span>{careerIndustry}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Zap className="w-4 h-4" />
                    {Math.round(matchScore)}% Match
                  </span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base md:text-lg px-4 py-2 bg-accent/10 border-accent/40 backdrop-blur-sm w-fit">
                Level 1 • Beginner
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">Overall Progress</span>
                <span className="text-lg font-bold text-primary">{Math.round(overallProgress)}%</span>
              </div>
              <div className="relative">
                <Progress value={overallProgress} className="h-4" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-sm" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Milestones Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Award className="w-7 h-7 text-yellow-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Career Milestones</h2>
          </div>

          <div className="grid gap-4 md:gap-6">
            {careerProgress.map((milestone, index) => {
              const Icon = milestone.icon;
              const isCompleted = milestone.status === "completed";
              const isInProgress = milestone.status === "in-progress";

              return (
                <Card
                  key={milestone.id}
                  className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-primary/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-500/5 to-transparent'
                      : isInProgress
                        ? 'bg-gradient-to-br from-primary/5 to-accent/5'
                        : 'bg-gradient-to-br from-muted/5 to-transparent'
                  }`} />

                  <CardHeader className="relative pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`relative p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
                          isCompleted
                            ? 'bg-green-500/10 group-hover:bg-green-500/20'
                            : isInProgress
                              ? 'bg-primary/10 group-hover:bg-primary/20'
                              : 'bg-muted/50'
                        }`}>
                          {isCompleted && <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-lg" />}
                          {isInProgress && <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg" />}
                          <Icon className={`relative w-6 h-6 ${
                            isCompleted
                              ? 'text-green-600'
                              : isInProgress
                                ? 'text-primary'
                                : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-lg md:text-xl">{milestone.title}</CardTitle>
                          <CardDescription className="text-sm md:text-base">{milestone.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {isInProgress && <Clock className="w-5 h-5 text-primary animate-pulse" />}
                        <Badge
                          variant={isCompleted ? "secondary" : "outline"}
                          className={`${
                            isCompleted
                              ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                              : isInProgress
                                ? 'bg-primary/10 border-primary/30'
                                : ''
                          }`}
                        >
                          {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-bold text-primary">{milestone.progress}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={milestone.progress} className="h-2.5" />
                        <div
                          className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-sm transition-all duration-500"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant={isInProgress ? "default" : "outline"}
                        onClick={() => handleNavigateToCareer()}
                        className="hover:scale-105 transition-transform duration-200"
                      >
                        {isInProgress ? "Continue" : isCompleted ? "Review" : "Start"}
                      </Button>
                      {milestone.title.includes("LinkedIn") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open('https://linkedin.com', '_blank')}
                          className="hover:scale-105 transition-transform duration-200"
                        >
                          Open LinkedIn
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-blue-500/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Learning Resources</CardTitle>
              <CardDescription className="text-base">
                Courses and materials for {careerRole}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button
                variant="outline"
                className="w-full hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300"
                onClick={() => handleNavigateToCareer("learn")}
              >
                Browse Materials
              </Button>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-purple-500/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "100ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <CardTitle className="text-xl">Network Building</CardTitle>
              <CardDescription className="text-base">
                Connect with professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button
                variant="outline"
                className="w-full hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300"
                onClick={() => handleNavigateToCareer("network")}
              >
                Find Events
              </Button>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-green-500/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <div className="p-3 bg-green-500/10 rounded-2xl w-fit mb-2 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Career Simulator</CardTitle>
              <CardDescription className="text-base">
                Try real-world scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button
                variant="outline"
                className="w-full hover:bg-green-500/10 hover:border-green-500/40 transition-all duration-300"
                onClick={() => handleNavigateToCareer("experiment")}
              >
                Start Simulation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-yellow-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 group-hover:scale-110 transition-transform duration-300">
                {careerProgress.filter(t => t.status === "completed").length}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Milestones<br />Completed</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-blue-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "250ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-blue-500 group-hover:scale-110 transition-transform duration-300">
                {Math.round(overallProgress)}%
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Overall<br />Progress</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-green-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-green-500 group-hover:scale-110 transition-transform duration-300">
                {skillsCount}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Skills<br />Identified</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-purple-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "350ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-purple-500 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Career Path<br />Selected</div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

