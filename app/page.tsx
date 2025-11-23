"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen texture-minimal flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-block px-6 py-2 rounded-lg border border-border mb-4">
          <span className="text-sm font-medium text-foreground tracking-wide">Career Discovery Platform</span>
        </div>
        <p className="text-muted-foreground mt-2">Taking you to your career dashboard...</p>
      </div>
    </div>
  );
}

function SignInForm() {
  return (
    <div className="min-h-screen texture-minimal flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight text-foreground">
            Career Discovery Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            AI-powered career recommendations personalized for you
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-minimal rounded-xl p-8 animate-scale-in stagger-2">
          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <Button className="w-full">
                Sign in to continue
              </Button>
            </SignInButton>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <SignUpButton mode="modal">
              <Button variant="outline" className="w-full">
                Create account
              </Button>
            </SignUpButton>
          </div>

          {/* Feature List */}
          <div className="mt-8 pt-6 border-t border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span>AI-powered career matching</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span>Personalized recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-secondary" />
              <span>Interactive career exploration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

