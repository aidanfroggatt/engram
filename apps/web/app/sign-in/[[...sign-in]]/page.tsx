"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function SignInPage() {
  const handleDemoLogin = () => {
    alert("Guest Demo execution will be wired up here!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8 text-foreground">
      <div className="mb-10 flex flex-col items-center space-y-4 text-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">
            {siteConfig.name}
          </h1>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>
      </div>

      <div className="w-full max-w-95 flex flex-col items-center space-y-6">
        <div className="w-full">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
        </div>

        <div className="flex w-full items-center gap-4 px-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="w-full">
          <Button
            variant="outline"
            className="w-full h-12 bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all group"
            onClick={handleDemoLogin}
          >
            <Sparkles className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Explore Demo Vault
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
