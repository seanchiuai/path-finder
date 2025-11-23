"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  Heart
} from "lucide-react";

export default function CareerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const careerProfile = useQuery(api.careerProfiles.getCareerProfile);
  const careerRecommendations = useQuery(api.careerRecommendations.getCareerRecommendations);
  const savedCareers = useQuery(api.savedCareers.getSavedCareers);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasProfile = careerProfile && Object.keys(careerProfile).length > 1; // More than just userId
  const hasRecommendations = careerRecommendations?.recommendations && careerRecommendations.recommendations.length > 0;
  const savedCareersCount = savedCareers?.length || 0;

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStartedSteps = [
    {
      id: 1,
      title: "Complete Your Profile",
      description: "Share your background, skills, and career goals",
      completed: hasProfile,
      action: () => router.push("/onboarding"),
      icon: Brain
    },
    {
      id: 2,
      title: "Get AI Recommendations",
      description: "Let our AI analyze your profile and suggest careers",
      completed: hasRecommendations,
      action: () => router.push("/recommendations"),
      icon: Sparkles
    },
    {
      id: 3,
      title: "Save Interesting Careers",
      description: "Bookmark careers that match your interests",
      completed: savedCareersCount > 0,
      action: () => router.push("/saved-careers"),
      icon: Heart
    }
  ];

  const completedSteps = getStartedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / getStartedSteps.length) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user.firstName || user.fullName}!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your personalized career discovery journey continues. Let&apos;s find your perfect career match.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Career Journey Progress
              </CardTitle>
              <CardDescription>
                {completedSteps} of {getStartedSteps.length} steps completed
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {Math.round(progressPercentage)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {getStartedSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card 
              key={step.id} 
              className="animate-scale-in hover:shadow-lg transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={step.action}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {step.completed && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ Complete
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant={step.completed ? "outline" : "default"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    step.action();
                  }}
                >
                  {step.completed ? "Review" : "Start"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Recommendations */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recent Recommendations
            </CardTitle>
            <CardDescription>
              Careers matched to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasRecommendations ? (
              <div className="space-y-3">
                {careerRecommendations.recommendations.slice(0, 3).map((rec, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/career/${encodeURIComponent(rec.role)}?industry=${encodeURIComponent(rec.industry)}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{rec.role}</h4>
                        <p className="text-sm text-muted-foreground">{rec.industry}</p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(rec.matchScore * 100)}% Match
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => router.push("/recommendations")}
                >
                  View All Recommendations
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-3">
                  No recommendations yet
                </p>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/onboarding")}
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Careers */}
        <Card className="animate-scale-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Saved Careers
            </CardTitle>
            <CardDescription>
              Careers you&apos;ve bookmarked for later
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedCareersCount > 0 ? (
              <div className="space-y-3">
                {savedCareers?.slice(0, 3).map((career) => (
                  <div 
                    key={career._id}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/career/${encodeURIComponent(career.careerName)}?industry=${encodeURIComponent(career.industry)}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{career.careerName}</h4>
                        <p className="text-sm text-muted-foreground">{career.industry}</p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(career.matchScore * 100)}% Match
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => router.push("/saved-careers")}
                >
                  View All Saved ({savedCareersCount})
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-3">
                  No saved careers yet
                </p>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/recommendations")}
                >
                  Browse Recommendations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "200ms" }}>
          <div className="text-3xl font-bold text-primary">{hasRecommendations ? careerRecommendations.recommendations.length : 0}</div>
          <div className="text-sm text-muted-foreground">AI Recommendations</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "250ms" }}>
          <div className="text-3xl font-bold text-accent">{savedCareersCount}</div>
          <div className="text-sm text-muted-foreground">Saved Careers</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "300ms" }}>
          <div className="text-3xl font-bold text-secondary">
            {careerProfile?.skills?.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Skills Identified</div>
        </Card>
        <Card className="p-4 text-center animate-scale-in" style={{ animationDelay: "350ms" }}>
          <div className="text-3xl font-bold text-success">
            {Math.round(progressPercentage)}
          </div>
          <div className="text-sm text-muted-foreground">Profile Complete</div>
        </Card>
      </div>
    </div>
  );
}