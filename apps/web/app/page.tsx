"use client";

import { extractMetadata, ParsedMediaMetadata } from "@/lib/exif";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState } from "react";

// 1. Strict Types
type FileUploadStatus = "idle" | "uploading" | "success" | "error";

type FileState = ParsedMediaMetadata & {
  file: File;
  uploadStatus: FileUploadStatus;
  fileKey?: string;
};

interface GoTicketResponse {
  uploadUrl: string;
  fileKey: string;
}

export default function Home() {
  const { getToken } = useAuth();

  const [goResponse, setGoResponse] = useState<string>("");
  const [parsedFiles, setParsedFiles] = useState<FileState[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // --- Auth Test ---
  const testGoConnection = async (): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        setGoResponse("No Clerk token found. Please sign in.");
        return;
      }

      const res = await fetch("http://localhost:8080/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      setGoResponse(`Status: ${res.status} | Go Says: ${text}`);
    } catch (error) {
      console.error(error);
      setGoResponse("Network error: Is the Go API running on :8080?");
    }
  };

  // --- EXIF Test ---
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsParsing(true);

    try {
      const filesArray = Array.from(e.target.files);
      const results: FileState[] = await Promise.all(
        filesArray.map(async (file) => {
          const meta = await extractMetadata(file);
          return { ...meta, file, uploadStatus: "idle" };
        }),
      );
      setParsedFiles(results);
    } catch (error) {
      console.error("Parsing error:", error);
    } finally {
      setIsParsing(false);
    }
  };

  // --- Upload Pipeline ---
  const handleUpload = async (index: number): Promise<void> => {
    // Strict boundary check to satisfy TypeScript
    const target = parsedFiles[index];
    if (!target) {
      console.error(`No file found at index ${index}`);
      return;
    }

    const updateStatus = (status: FileUploadStatus, key?: string): void => {
      setParsedFiles((prev) => {
        const newFiles = [...prev];
        const existing = newFiles[index];
        if (existing) {
          newFiles[index] = { ...existing, uploadStatus: status, fileKey: key };
        }
        return newFiles;
      });
    };

    updateStatus("uploading");

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing.");

      // A. Get Ticket from Go
      const ticketRes = await fetch(
        "http://localhost:8080/engram.upload.v1.UploadService/GetUploadURL",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: target.fileName,
            mimeType: target.mimeType,
          }),
        },
      );

      if (!ticketRes.ok) {
        throw new Error(`Failed to get B2 ticket. Status: ${ticketRes.status}`);
      }

      // Cast the response strictly
      const ticket = (await ticketRes.json()) as GoTicketResponse;

      // B. Stream to B2
      const b2Res = await fetch(ticket.uploadUrl, {
        method: "PUT",
        body: target.file,
        headers: { "Content-Type": target.mimeType },
      });

      if (!b2Res.ok) {
        const errText = await b2Res.text();
        throw new Error(`B2 Storage Error (${b2Res.status}): ${errText}`);
      }

      updateStatus("success", ticket.fileKey);
    } catch (error) {
      console.error("Upload pipeline failed:", error);
      updateStatus("error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-12 px-4 bg-zinc-950 text-white font-sans">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>

      <h1 className="text-4xl font-black mb-12 tracking-widest uppercase text-zinc-100">
        Engram Vault
      </h1>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test 1: Go Backend Auth */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-lg font-bold mb-4 text-zinc-300">
            1. Auth Connection
          </h2>
          <button
            onClick={testGoConnection}
            className="w-full px-4 py-3 bg-zinc-100 text-black hover:bg-zinc-300 rounded-lg text-sm font-black uppercase transition-colors mb-4"
          >
            Ping Go Server
          </button>
          {goResponse && (
            <div className="p-3 bg-black rounded-lg font-mono text-xs break-all text-zinc-400 border border-zinc-800">
              {goResponse}
            </div>
          )}
        </div>

        {/* Test 2: Local Metadata Extraction */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h2 className="text-lg font-bold mb-4 text-zinc-300">
            2. EXIF Extraction
          </h2>
          <label className="flex items-center justify-center w-full cursor-pointer px-4 py-8 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors bg-black/50">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              {isParsing ? "Parsing..." : "Select Media"}
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

      {/* Test 3: The Upload Pipeline */}
      {parsedFiles.length > 0 && (
        <div className="w-full max-w-4xl mt-12">
          <h3 className="text-xs font-black mb-4 text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-2">
            Ingestion Pipeline
          </h3>
          <div className="grid gap-3">
            {parsedFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center"
              >
                <div className="overflow-hidden pr-4">
                  <p className="font-bold text-zinc-100 truncate text-sm">
                    {file.fileName}
                  </p>
                  <p className="text-zinc-500 text-[10px] font-mono uppercase mt-1">
                    {file.captureTime.toLocaleDateString()} • {file.mimeType}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {file.uploadStatus === "success" ? (
                    <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-3 py-1.5 rounded-md">
                      VAULTED: {file.fileKey?.split("/").pop()}
                    </span>
                  ) : file.uploadStatus === "error" ? (
                    <span className="text-[10px] font-mono text-red-400 bg-red-400/10 px-3 py-1.5 rounded-md">
                      FAILED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUpload(idx)}
                      disabled={file.uploadStatus === "uploading"}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                      {file.uploadStatus === "uploading"
                        ? "Streaming..."
                        : "Upload to B2"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
