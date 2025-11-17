"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    router.push('/tasks');
  }, [router]);

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="inline-block px-6 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <span className="text-sm font-medium text-primary">VIBED</span>
        </div>
        <p className="text-muted-foreground mt-2">Taking you to your workspace...</p>
      </div>
    </div>
  );
}

function SignInForm() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Hero Badge */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your minimalist workspace
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              VIBED
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            Simple, beautiful task management that sparks joy
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-primary/5 animate-scale-in stagger-2">
          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button className="group relative w-full px-6 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <span className="relative z-10">Sign in to continue</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </SignInButton>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <SignUpButton mode="modal">
              <button className="w-full px-6 py-3.5 border-2 border-border rounded-xl font-medium hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200">
                Create your account
              </button>
            </SignUpButton>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/50">
            <div className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
              ✓ Clean & minimal
            </div>
            <div className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
              ✓ Fast & smooth
            </div>
            <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              ✓ Made with joy
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in stagger-3">
          Free forever • No credit card required
        </p>
      </div>
    </div>
  );
}

