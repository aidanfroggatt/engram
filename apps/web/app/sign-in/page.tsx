"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const handleDemoLogin = () => {
    // We will wire this up to a Clerk test token or programmatic sign-in later.
    // For now, it's just the UI foundation.
    alert("Demo login execution will be wired up here!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">Engram</h1>
        <p className="text-zinc-400 mt-2">Personal Media Vault</p>
      </div>

      {/* Standard Clerk Login for You */}
      <SignIn path="/sign-in" routing="path" signUpUrl="/" />

      {/* Portfolio Demo Entry for Guests */}
      <div className="mt-8 flex flex-col items-center space-y-4 border-t border-zinc-800 pt-8">
        <p className="text-sm text-zinc-500">Exploring the architecture?</p>
        <button
          onClick={handleDemoLogin}
          className="rounded-md bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300"
        >
          View Live Demo
        </button>
      </div>
    </div>
  );
}
