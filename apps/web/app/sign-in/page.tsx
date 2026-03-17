"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const handleDemoLogin = () => {
    // We will wire this up to a Clerk test token or programmatic sign-in later.
    alert("Demo login execution will be wired up here!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 font-sans">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-widest text-zinc-100 uppercase">
          Engram
        </h1>
        <p className="text-zinc-400 mt-2 text-sm tracking-wide">
          Personal Context Engine
        </p>
      </div>

      {/* Standard Clerk Login */}
      {/* Note: In the future, we can pass appearance={{ baseTheme: dark }} to match the UI */}
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />

      {/* Portfolio Demo Entry for Guests */}
      <div className="mt-8 flex w-full max-w-[400px] flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Separator className="flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600 font-mono uppercase">Or</span>
          <Separator className="flex-1 bg-zinc-800" />
        </div>

        <div className="flex flex-col items-center space-y-3 pt-2 w-full">
          <p className="text-sm text-zinc-500">Exploring the architecture?</p>
          <Button
            variant="secondary"
            className="w-full font-bold uppercase tracking-wider bg-zinc-100 text-zinc-900 hover:bg-zinc-300 transition-colors"
            onClick={handleDemoLogin}
          >
            View Live Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
