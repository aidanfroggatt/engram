"use client";

import { extractMetadata, ParsedMediaMetadata } from "@/lib/exif";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {
  const { getToken } = useAuth();

  // State for Auth Test
  const [goResponse, setGoResponse] = useState<string>("");

  // State for EXIF Test
  const [parsedFiles, setParsedFiles] = useState<ParsedMediaMetadata[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // --- Auth Test: Pings the /protected endpoint on the Go backend ---
  const testGoConnection = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setGoResponse("No Clerk token found. Please sign in.");
        return;
      }

      const res = await fetch("http://localhost:8080/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      setGoResponse(`Status: ${res.status} | Go Says: ${text}`);
    } catch (error) {
      console.error(error);
      setGoResponse("Network error: Is the Go API running on :8080?");
    }
  };

  // --- EXIF Test: Parses metadata locally in the browser ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsParsing(true);
    const filesArray = Array.from(e.target.files);

    try {
      const results = await Promise.all(
        filesArray.map((file) => extractMetadata(file)),
      );
      setParsedFiles(results);
    } catch (error) {
      console.error("Parsing error:", error);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-12 px-4 bg-zinc-950 text-white">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>

      <h1 className="text-4xl font-bold mb-12 tracking-tighter">
        ENGRAM_VAULT
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test 1: Go Backend Auth */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300">
            1. Auth Connection
          </h2>
          <button
            onClick={testGoConnection}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold transition-colors mb-4"
          >
            PING GO SERVER
          </button>
          {goResponse && (
            <div className="p-3 bg-black rounded font-mono text-xs break-all text-blue-400 border border-blue-900/30">
              {goResponse}
            </div>
          )}
        </div>

        {/* Test 2: Local Metadata Extraction */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-zinc-300">
            2. EXIF Extraction
          </h2>
          <div className="mb-4">
            <label className="block w-full cursor-pointer text-center px-4 py-8 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded transition-colors bg-zinc-950/50">
              <span className="text-sm font-medium text-zinc-400">
                {isParsing ? "PARSING..." : "SELECT PHOTOS TO PARSE"}
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={isParsing}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Metadata Results Grid */}
      {parsedFiles.length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h3 className="text-sm font-bold mb-4 text-zinc-500 uppercase tracking-widest">
            Extracted Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parsedFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-sm"
              >
                <p className="font-bold text-zinc-100 truncate mb-2">
                  {file.fileName}
                </p>
                <div className="text-zinc-400 space-y-1 text-[11px] font-mono">
                  <p>
                    <span className="text-zinc-600">Captured:</span>{" "}
                    {file.captureTime.toLocaleString()}
                  </p>
                  <p>
                    <span className="text-zinc-600">Type:</span> {file.mimeType}
                  </p>
                  <p>
                    <span className="text-zinc-600">GPS:</span>
                    {file.latitude && file.longitude
                      ? `${file.latitude.toFixed(4)}, ${file.longitude.toFixed(4)}`
                      : "None"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
