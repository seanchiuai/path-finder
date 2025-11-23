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
  LucideIcon
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
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Choose Your Career Path</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You haven't selected a career yet. Let's find the perfect match for you!
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/recommendations")}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            Explore Career Recommendations
          </Button>
        </div>
      </div>
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold tracking-tight">
            Your Career Journey: {careerRole}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          You're on your way to becoming a {careerRole} in {careerIndustry}! Complete these milestones to advance your career.
        </p>
      </div>

      <Card className="animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {careerRole} Career Path
              </CardTitle>
              <CardDescription>
                {careerIndustry} • {Math.round(matchScore)}% Match
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Level 1 • Beginner
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-6 h-6" />
          Career Milestones
        </h2>

        {careerProgress.map((milestone, index) => {
          const Icon = milestone.icon;
          const isCompleted = milestone.status === "completed";
          const isInProgress = milestone.status === "in-progress";

          return (
            <Card
              key={milestone.id}
              className="animate-scale-in hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCompleted ? 'bg-green-100' : isInProgress ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isCompleted ? 'text-green-600' : isInProgress ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <CardDescription>{milestone.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {isInProgress && <Clock className="w-5 h-5 text-blue-500" />}
                    <Badge variant={isCompleted ? "secondary" : "outline"}>
                      {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={isInProgress ? "default" : "outline"}
                      onClick={() => handleNavigateToCareer()}
                    >
                      {isInProgress ? "Continue" : isCompleted ? "Review" : "Start"}
                    </Button>
                    {milestone.title.includes("LinkedIn") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open('https://linkedin.com', '_blank')}
                      >
                        Open LinkedIn
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Learning Resources
            </CardTitle>
            <CardDescription>
              Courses and materials for {careerRole}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleNavigateToCareer("learn")}
            >
              Browse Learning Materials
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Network Building
            </CardTitle>
            <CardDescription>
              Connect with professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleNavigateToCareer("network")}
            >
              Find Networking Events
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Career Simulator
            </CardTitle>
            <CardDescription>
              Try real-world scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleNavigateToCareer("experiment")}
            >
              Start Simulation
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "200ms" }}>
          <div className="text-3xl font-bold text-yellow-500">
            {careerProgress.filter(t => t.status === "completed").length}
          </div>
          <div className="text-sm text-muted-foreground">Milestones Completed</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "250ms" }}>
          <div className="text-3xl font-bold text-blue-500">
            {Math.round(overallProgress)}
          </div>
          <div className="text-sm text-muted-foreground">Overall Progress</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "300ms" }}>
          <div className="text-3xl font-bold text-green-500">
            {skillsCount}
          </div>
          <div className="text-sm text-muted-foreground">Skills Identified</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "350ms" }}>
          <div className="text-3xl font-bold text-purple-500">
            1
          </div>
          <div className="text-sm text-muted-foreground">Career Path Selected</div>
        </Card>
      </div>
    </div>
  );
}

