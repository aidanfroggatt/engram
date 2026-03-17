"use client";

import { extractMetadata, ParsedMediaMetadata } from "@/lib/exif";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  Activity,
  CheckCircle2,
  FileImage,
  Server,
  Upload,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Shadcn UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Types ---
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

// --- Utility Functions ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// --- Sub-Components ---

function EnvironmentBanner() {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="absolute top-0 left-0 w-full flex justify-center z-50">
      <div
        className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest w-full text-center ${
          isDev
            ? "bg-amber-500/20 text-amber-500"
            : "bg-emerald-500/20 text-emerald-500"
        }`}
      >
        {isDev ? "Development Environment" : "Production Environment"}
      </div>
    </div>
  );
}

function AuthTestCard({
  getToken,
}: {
  getToken: () => Promise<string | null>;
}) {
  const [goResponse, setGoResponse] = useState<string>("");

  const testGoConnection = async (): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication Failed", {
          description: "No Clerk token found.",
        });
        return;
      }

      const res = await fetch("http://localhost:8080/protected", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      setGoResponse(text);

      if (res.ok) {
        toast.success("Go Server Reached", {
          description: `Status: ${res.status}`,
        });
      } else {
        toast.error("Go Server Error", { description: text });
      }
    } catch (error: unknown) {
      toast.error("Network Error", {
        description:
          getErrorMessage(error) || "Is the Go API running on :8080?",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="w-5 h-5 text-muted-foreground" />
          1. Zero-Trust Auth
        </CardTitle>
        <CardDescription>
          Verify JWT middleware against the Go backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={testGoConnection}
          variant="secondary"
          className="w-full font-bold uppercase tracking-wider"
        >
          Ping Go Server
        </Button>
        {goResponse && (
          <div className="p-3 bg-muted rounded-md font-mono text-xs break-all border border-border">
            {goResponse}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExtractionCard({
  isParsing,
  onFileSelect,
}: {
  isParsing: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-muted-foreground" />
          2. EXIF Extraction
        </CardTitle>
        <CardDescription>
          Parse GPS and capture time securely in the browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className="flex flex-col items-center justify-center w-full cursor-pointer p-8 border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 rounded-lg transition-all">
          <FileImage className="w-8 h-8 text-muted-foreground mb-4" />
          <span className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
            {isParsing ? "Extracting Metadata..." : "Select Media Files"}
          </span>
          <span className="text-xs text-muted-foreground">
            Supports JPEG, PNG, HEIC, MP4
          </span>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={onFileSelect}
            disabled={isParsing}
          />
        </label>
      </CardContent>
    </Card>
  );
}

function SystemStatsCard({ files }: { files: FileState[] }) {
  const total = files.length;
  const vaulted = files.filter((f) => f.uploadStatus === "success").length;
  const failed = files.filter((f) => f.uploadStatus === "error").length;
  const pending = total - vaulted - failed;

  const progress = total === 0 ? 0 : (vaulted / total) * 100;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Session Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono uppercase text-muted-foreground">
            <span>Vault Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col p-2 bg-muted/50 rounded-lg border">
            <span className="text-2xl font-black">{pending}</span>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              Pending
            </span>
          </div>
          <div className="flex flex-col p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-500">
            <span className="text-2xl font-black">{vaulted}</span>
            <span className="text-[10px] font-mono uppercase">Vaulted</span>
          </div>
          <div className="flex flex-col p-2 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive">
            <span className="text-2xl font-black">{failed}</span>
            <span className="text-[10px] font-mono uppercase">Failed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---

export default function Home() {
  const { getToken } = useAuth();
  const [parsedFiles, setParsedFiles] = useState<FileState[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsParsing(true);
    const fileCount = e.target.files.length;
    toast.loading(`Extracting EXIF from ${fileCount} files...`, {
      id: "parsing",
    });

    try {
      const filesArray = Array.from(e.target.files);
      const results: FileState[] = await Promise.all(
        filesArray.map(async (file) => {
          const meta = await extractMetadata(file);
          return { ...meta, file, uploadStatus: "idle" };
        }),
      );
      setParsedFiles((prev) => [...prev, ...results]);
      toast.success(`Successfully parsed ${fileCount} files.`, {
        id: "parsing",
      });
    } catch (error: unknown) {
      toast.error("Extraction failed.", {
        description: getErrorMessage(error),
        id: "parsing",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const commitSingleFile = async (index: number): Promise<void> => {
    const target = parsedFiles[index];
    if (!target || target.uploadStatus !== "idle") return;

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

      const ticketRes = await fetch("http://localhost:8080/api/upload/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: target.fileName,
          mimeType: target.mimeType,
        }),
      });
      if (!ticketRes.ok) throw new Error("B2 Ticket generation failed");
      const ticket = (await ticketRes.json()) as GoTicketResponse;

      const b2Res = await fetch(ticket.uploadUrl, {
        method: "PUT",
        body: target.file,
        headers: { "Content-Type": target.mimeType },
      });
      if (!b2Res.ok) throw new Error("B2 Storage upload failed");

      const commitRes = await fetch("http://localhost:8080/api/upload/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileKey: ticket.fileKey,
          mimeType: target.mimeType,
          captureTime: target.captureTime.toISOString(),
          latitude: target.latitude,
          longitude: target.longitude,
        }),
      });
      if (!commitRes.ok) throw new Error("Database commit failed");

      updateStatus("success", ticket.fileKey);
      toast.success(`${target.fileName} vaulted.`);
    } catch (error: unknown) {
      updateStatus("error");
      toast.error(`Failed to vault ${target.fileName}`, {
        description: getErrorMessage(error),
      });
    }
  };

  const handleCommitAll = async () => {
    const pendingIndices = parsedFiles
      .map((file, idx) => (file.uploadStatus === "idle" ? idx : -1))
      .filter((idx) => idx !== -1);

    if (pendingIndices.length === 0) return;

    toast.info(`Starting batch upload of ${pendingIndices.length} files...`);
    // Upload sequentially to avoid overwhelming the network/Go server in dev
    for (const idx of pendingIndices) {
      await commitSingleFile(idx);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-4 font-sans bg-background">
      <EnvironmentBanner />

      <div className="absolute top-12 right-6">
        <UserButton />
      </div>

      <div className="mt-4 mb-12 flex flex-col items-center space-y-2">
        <h1 className="text-4xl font-black tracking-widest uppercase text-foreground">
          Engram
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
          System Diagnostics
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Diagnostics & Inputs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AuthTestCard getToken={getToken} />
          <ExtractionCard
            isParsing={isParsing}
            onFileSelect={handleFileSelect}
          />
          <SystemStatsCard files={parsedFiles} />
        </div>

        {/* Right Column: Ingestion Pipeline View */}
        <div className="lg:col-span-8 flex flex-col h-[750px]">
          <Card className="flex-1 flex flex-col shadow-sm border bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Ingestion Queue
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {parsedFiles.length} Total
                  </Badge>
                  {parsedFiles.some((f) => f.uploadStatus === "idle") && (
                    <Button
                      size="sm"
                      onClick={handleCommitAll}
                      className="h-6 text-[10px] uppercase font-bold px-3"
                    >
                      <Upload className="w-3 h-3 mr-1" /> Commit Pending
                    </Button>
                  )}
                </div>
              </div>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full px-6 pb-6">
                {parsedFiles.length === 0 ? (
                  <div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground/50 space-y-4">
                    <FileImage className="w-12 h-12 opacity-20" />
                    <span className="text-sm font-mono uppercase tracking-widest">
                      No files in queue
                    </span>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {parsedFiles.map((file, idx) => (
                      <Card
                        key={idx}
                        className={`p-4 flex justify-between items-center transition-colors ${
                          file.uploadStatus === "success"
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : file.uploadStatus === "error"
                              ? "bg-destructive/5 border-destructive/20"
                              : "bg-background"
                        }`}
                      >
                        <div className="overflow-hidden pr-4 flex-1">
                          <p className="font-bold truncate text-sm text-foreground">
                            {file.fileName}
                          </p>
                          <div className="flex gap-2 text-muted-foreground text-[10px] font-mono uppercase mt-1">
                            <span>{file.captureTime.toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{file.mimeType.split("/")[1]}</span>
                            {file.latitude && (
                              <>
                                <span>•</span>
                                <span className="text-blue-500/80 font-bold">
                                  GPS
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          {file.uploadStatus === "success" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 uppercase font-bold text-[10px] border-none flex gap-1 items-center">
                              <CheckCircle2 className="w-3 h-3" /> Vaulted
                            </Badge>
                          ) : file.uploadStatus === "error" ? (
                            <Badge
                              variant="destructive"
                              className="uppercase font-bold text-[10px] flex gap-1 items-center"
                            >
                              <XCircle className="w-3 h-3" /> Failed
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => commitSingleFile(idx)}
                              disabled={file.uploadStatus === "uploading"}
                              size="sm"
                              variant={
                                file.uploadStatus === "uploading"
                                  ? "secondary"
                                  : "default"
                              }
                              className="text-xs font-bold uppercase w-24 transition-all"
                            >
                              {file.uploadStatus === "uploading"
                                ? "Streaming..."
                                : "Commit"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
