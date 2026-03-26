"use client";

import { ChevronLeft, Loader2, Plus, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StagedAssetCard } from "@/components/upload/staged-asset-card";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { extractMetadata } from "@/lib/exif";
import { StagedFile } from "@/types/media";

// --- Helpers ---
function isError(error: Error | unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: Error | unknown): string {
  if (isError(error)) return error.message;
  return "An unexpected error occurred";
}

// --- Main Page ---
export default function UploadBatchPage() {
  const router = useRouter();
  const { uploadFile } = useMediaUpload();
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsing(true);
    const filesArray = Array.from(files);
    toast.loading(`Extracting metadata...`, { id: "parsing" });

    try {
      const results: StagedFile[] = await Promise.all(
        filesArray.map(async (file) => {
          const meta = await extractMetadata(file);
          return {
            ...meta,
            id: crypto.randomUUID(),
            file,
            uploadStatus: "idle",
          };
        })
      );
      setStagedFiles((prev) => [...prev, ...results]);
      toast.success(`${filesArray.length} assets staged.`, { id: "parsing" });
    } catch (err: unknown) {
      toast.error("Extraction failed.", {
        description: getErrorMessage(err),
        id: "parsing",
      });
    } finally {
      setIsParsing(false);
      e.target.value = "";
    }
  };

  const pendingFiles = stagedFiles.filter(
    (f) => f.uploadStatus === "idle" || f.uploadStatus === "error"
  );
  const isReadyToCommit = pendingFiles.length > 0 && pendingFiles.every((f) => f.captureTime);

  const handleCommitBatch = async (): Promise<void> => {
    if (!isReadyToCommit) return;
    setIsCommitting(true);
    let hasErrors = false;

    for (const file of pendingFiles) {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, uploadStatus: "uploading" } : f))
      );

      const result = await uploadFile(file);

      if (result.success) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, uploadStatus: "success", fileKey: result.fileKey } : f
          )
        );
      } else {
        hasErrors = true;
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, uploadStatus: "error", errorMessage: result.error } : f
          )
        );
      }
    }

    setIsCommitting(false);
    if (!hasErrors) {
      toast.success("Vault update complete.");
      setTimeout(() => router.push("/"), 1000);
    } else {
      toast.warning("Some assets failed to upload. Please review the errors.");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex flex-col">
      <header className="fixed top-4 md:top-6 inset-x-4 md:inset-x-8 z-50 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/50 bg-background/80 p-2 pr-6 backdrop-blur-xl shadow-lg transition-all hover:bg-background/95 supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-10 w-10 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col py-1">
            <h1 className="text-[11px] font-black uppercase tracking-widest leading-none text-foreground">
              Staging Area
            </h1>
            <p className="mt-1 text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
              Ready: {pendingFiles.length} • Total: {stagedFiles.length}
            </p>
          </div>
        </div>
        <div className="pointer-events-auto hidden md:block">
          <Button
            onClick={handleCommitBatch}
            disabled={!isReadyToCommit || isCommitting}
            variant="outline"
            className="h-14 rounded-2xl border-border/50 bg-background/80 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-xl shadow-lg transition-all hover:bg-muted/80 hover:text-foreground disabled:opacity-30 supports-[backdrop-filter]:bg-background/60"
          >
            {isCommitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {isCommitting ? "Vaulting..." : "Commit Batch"}
          </Button>
        </div>
      </header>
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none md:hidden transition-all duration-500">
        <div
          className={`pointer-events-auto transition-transform ${stagedFiles.length > 0 ? "translate-y-0" : "translate-y-24 opacity-0"}`}
        >
          <Button
            onClick={handleCommitBatch}
            disabled={!isReadyToCommit || isCommitting}
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-border/50 bg-background/95 px-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground shadow-2xl transition-all active:scale-95 disabled:opacity-30 supports-[backdrop-filter]:bg-background/80"
          >
            {isCommitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-5 w-5" />
            )}
            {isCommitting ? "Vaulting..." : "Commit Batch"}
          </Button>
        </div>
      </div>
      <main className="mx-auto w-full max-w-5xl px-4 pt-32 pb-32 md:pb-12 md:px-8 flex-1 flex flex-col">
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out flex-1 flex flex-col">
          <label className="flex flex-col items-center justify-center w-full p-12 md:p-20 border border-dashed border-border/60 rounded-3xl cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors group shrink-0">
            <div className="h-16 w-16 rounded-2xl bg-background/50 border border-border/50 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="text-xs font-mono uppercase font-bold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors text-center">
              {isParsing ? "Analyzing Files..." : "Tap to stage assets"}
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={isParsing || isCommitting}
            />
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stagedFiles.map((file) => (
              <StagedAssetCard
                key={file.id}
                asset={file}
                onRemove={(id: string) => setStagedFiles((prev) => prev.filter((f) => f.id !== id))}
                onUpdate={(id: string, up: Partial<StagedFile>) =>
                  setStagedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...up } : f)))
                }
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
