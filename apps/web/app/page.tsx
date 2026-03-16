"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {
  const { getToken } = useAuth();
  const [goResponse, setGoResponse] = useState<string>("");

  const testGoConnection = async () => {
    try {
      // 1. Ask Clerk for a fresh JWT session token
      const token = await getToken();

      if (!token) {
        setGoResponse("Failed to get Clerk token. Are you logged in?");
        return;
      }

      // 2. Fire a request to the protected Go endpoint, attaching the token
      const res = await fetch("http://localhost:8080/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 3. Read the response
      const text = await res.text();
      setGoResponse(`Status: ${res.status} | Go Says: ${text}`);
    } catch (error) {
      console.error(error);
      setGoResponse("Network error hitting Go API.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>

      <h1 className="text-4xl font-bold mb-8">Engram Vault</h1>

      <button
        onClick={testGoConnection}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors mb-8"
      >
        Test Authenticated Go Connection
      </button>

      {goResponse && (
        <div className="w-full max-w-lg p-4 bg-zinc-900 rounded-lg font-mono text-sm break-all">
          {goResponse}
        </div>
      )}
    </main>
  );
}
