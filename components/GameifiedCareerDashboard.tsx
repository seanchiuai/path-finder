"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedBackground from "@/components/AnimatedBackground";
import XPProgressBar from "@/components/career/XPProgressBar";
import {
  Target,
  Trophy,
  TrendingUp,
  Award,
  Sparkles,
  Flame,
  Star,
  CheckCircle2
} from "lucide-react";

export default function GameifiedCareerDashboard() {
  const { user } = useUser();
  const router = useRouter();

  // Career Compass queries
  const selectedCareers = useQuery(api.selectedCareers.getActiveSelectedCareers);
  const allProgress = useQuery(api.careerProgress.getAllProgress);
  const dashboardSummary = useQuery(api.careerProgress.getDashboardSummary);

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

  // Empty state - no careers selected
  if (!selectedCareers || selectedCareers.length === 0) {
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
                  Choose Your Career Paths
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                  You haven&apos;t selected any careers yet. Complete your voice onboarding and select up to 3 career paths to start your journey!
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

  // Match progress data with careers
  const careersWithProgress = selectedCareers.map(career => {
    const progress = allProgress?.find(p => p.careerId === career.careerId);
    return {
      ...career,
      progress: progress || {
        xp: 0,
        level: 1,
        completionPercent: 0,
        streak: 0,
        tasksCompletedThisWeek: 0,
        xpToNextLevel: 100
      }
    };
  });

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Hero Section */}
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
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Track your progress across {careersWithProgress.length} career path{careersWithProgress.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-yellow-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 group-hover:scale-110 transition-transform duration-300">
                {dashboardSummary?.totalXP || 0}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Total XP<br />Earned</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-orange-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "50ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <Flame className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <div className="text-4xl md:text-5xl font-bold text-orange-500 group-hover:scale-110 transition-transform duration-300">
                {dashboardSummary?.longestStreak || 0}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Longest<br />Streak</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-green-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "100ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <div className="text-4xl md:text-5xl font-bold text-green-500 group-hover:scale-110 transition-transform duration-300">
                {dashboardSummary?.totalTasksThisWeek || 0}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Tasks<br />This Week</div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-purple-500/40 p-6 text-center transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-scale-in" style={{ animationDelay: "150ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative space-y-2">
              <Star className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <div className="text-4xl md:text-5xl font-bold text-purple-500 group-hover:scale-110 transition-transform duration-300">
                {careersWithProgress.length}
              </div>
              <div className="text-xs md:text-sm font-medium text-muted-foreground">Active<br />Careers</div>
            </div>
          </Card>
        </div>

        {/* Career Cards */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Your Career Paths</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {careersWithProgress.map((career, index) => (
              <Card
                key={career._id}
                className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-2 hover:border-primary/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="relative pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="secondary" className="bg-primary/10 border-primary/30">
                      {career.industry}
                    </Badge>
                    <Badge variant="outline" className="bg-accent/10 border-accent/30">
                      <Award className="w-3 h-3 mr-1" />
                      {Math.round(career.fitScore)}% fit
                    </Badge>
                  </div>

                  <CardTitle className="text-xl md:text-2xl mb-2">
                    {career.careerName}
                  </CardTitle>

                  <CardDescription className="text-sm">
                    {career.progress.completionPercent}% complete
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  {/* XP Progress Bar */}
                  <XPProgressBar
                    currentXP={career.progress.xp}
                    level={career.progress.level}
                    xpToNextLevel={career.progress.xpToNextLevel}
                  />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-muted-foreground">
                        {career.progress.streak} streak
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-muted-foreground">
                        {career.progress.tasksCompletedThisWeek} this week
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/career/${career.careerId}`)}
                      className="flex-1 hover:scale-105 transition-transform duration-200"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add more careers if less than 3 */}
          {careersWithProgress.length < 3 && (
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors duration-300 cursor-pointer" onClick={() => router.push("/recommendations")}>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Add More Career Paths</h3>
                  <p className="text-sm text-muted-foreground">
                    You can select up to {3 - careersWithProgress.length} more career{3 - careersWithProgress.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Browse Recommendations
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
