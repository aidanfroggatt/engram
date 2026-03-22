"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { extractMetadata } from "@/lib/exif";
import { StagedFile } from "@/types/media";

// --- Type Guards & Helpers ---

function isError(error: Error | unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: Error | unknown): string {
  if (isError(error)) return error.message;
  return "An unexpected error occurred";
}

// --- Sub-Components ---

interface StagedAssetCardProps {
  asset: StagedFile;
  onUpdate: (id: string, updates: Partial<StagedFile>) => void;
  onRemove: (id: string) => void;
}

function StagedAssetCard({ asset, onUpdate, onRemove }: StagedAssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Local state for coordinates to allow seamless typing of "-" and "."
  const [localLat, setLocalLat] = useState<string>(asset.latitude?.toString() ?? "");
  const [localLng, setLocalLng] = useState<string>(asset.longitude?.toString() ?? "");

  useEffect(() => {
    const url = URL.createObjectURL(asset.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [asset.file]);

  const getFormattedDate = (date?: Date): string => {
    if (!date) return "";
    const pad = (num: number): string => num.toString().padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const handleCoordChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    field: "latitude" | "longitude"
  ): void => {
    const val = e.target.value;
    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      setter(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        onUpdate(asset.id, { [field]: parsed });
      } else if (val === "") {
        onUpdate(asset.id, { [field]: null });
      }
    }
  };

  const handleCoordBlur = (val: string, field: "latitude" | "longitude"): void => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      onUpdate(asset.id, { [field]: null });
    } else {
      onUpdate(asset.id, { [field]: parsed });
    }
  };

  const isUploading = asset.uploadStatus === "uploading";
  const isSuccess = asset.uploadStatus === "success";
  const isErrorState = asset.uploadStatus === "error";
  const needsDate = !asset.captureTime;

  return (
    <div
      className={`p-4 md:p-5 border border-border/50 rounded-2xl bg-muted/5 backdrop-blur-sm transition-all duration-500 ${
        isSuccess ? "opacity-40 grayscale" : "hover:bg-muted/10 hover:border-border shadow-sm"
      }`}
    >
      <div className="flex gap-4 md:gap-6">
        {/* Media Preview */}
        <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-xl bg-black overflow-hidden shrink-0 border border-border/50 shadow-inner">
          {previewUrl &&
            (asset.mimeType.startsWith("video/") ? (
              <video src={previewUrl} className="w-full h-full object-cover opacity-90" />
            ) : (
              <Image
                src={previewUrl}
                alt={asset.fileName}
                fill
                unoptimized
                className="object-cover opacity-90"
              />
            ))}
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-foreground" />
            </div>
          )}
          {isSuccess && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-md flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-foreground drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* Form Controls */}
        <div className="flex-1 space-y-3 md:space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate max-w-[160px] md:max-w-[220px]">
              {asset.fileName}
            </span>
            {!isSuccess && !isUploading && (
              <button
                onClick={() => onRemove(asset.id)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                aria-label="Remove asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 md:gap-3">
            <div className="space-y-1">
              <div className="relative">
                <Calendar
                  className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${needsDate ? "text-destructive" : "text-muted-foreground/70"}`}
                />
                <Input
                  type="datetime-local"
                  disabled={isUploading || isSuccess}
                  value={getFormattedDate(asset.captureTime)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const d = new Date(e.target.value);
                    onUpdate(asset.id, {
                      captureTime: isNaN(d.getTime()) ? undefined : d,
                    });
                  }}
                  className={`h-9 pl-9 text-xs font-mono rounded-lg border-border/50 bg-background/50 focus-visible:ring-1 focus-visible:ring-foreground transition-all ${
                    needsDate
                      ? "border-destructive/50 bg-destructive/5 text-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground/70" />
                <Input
                  type="text"
                  placeholder="LAT"
                  disabled={isUploading || isSuccess}
                  value={localLat}
                  onChange={(e) => handleCoordChange(e, setLocalLat, "latitude")}
                  onBlur={() => handleCoordBlur(localLat, "latitude")}
                  className="h-9 pl-9 text-xs font-mono rounded-lg border-border/50 bg-background/50 focus-visible:ring-1 focus-visible:ring-foreground transition-all"
                />
              </div>
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="LNG"
                  disabled={isUploading || isSuccess}
                  value={localLng}
                  onChange={(e) => handleCoordChange(e, setLocalLng, "longitude")}
                  onBlur={() => handleCoordBlur(localLng, "longitude")}
                  className="h-9 px-3 text-xs font-mono rounded-lg border-border/50 bg-background/50 focus-visible:ring-1 focus-visible:ring-foreground transition-all"
                />
              </div>
            </div>
          </div>

          {isErrorState && (
            <p className="text-[9px] text-destructive font-bold uppercase flex items-center gap-1.5 mt-2 bg-destructive/10 px-2 py-1.5 rounded-md inline-flex">
              <AlertCircle className="w-3 h-3" /> {asset.errorMessage || "Network Error"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* --- DESKTOP & MOBILE TOP NAV (Info & Context) --- */}
      <header className="fixed top-4 md:top-6 inset-x-4 md:inset-x-8 z-50 flex items-start justify-between pointer-events-none">
        {/* Left: Branding & Status Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 p-2 pr-6 backdrop-blur-xl shadow-2xl transition-all hover:bg-background/80">
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

        {/* Right Action (Desktop Only) */}
        <div className="pointer-events-auto hidden md:block">
          <Button
            onClick={handleCommitBatch}
            disabled={!isReadyToCommit || isCommitting}
            variant="outline"
            className="h-14 rounded-2xl border-border/50 bg-background/60 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-xl shadow-2xl transition-all hover:bg-muted/50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-background/60"
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

      {/* --- MOBILE BOTTOM NAV (Thumb Navigation) --- */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none md:hidden transition-all duration-500">
        <div
          className={`pointer-events-auto transition-transform ${stagedFiles.length > 0 ? "translate-y-0" : "translate-y-24 opacity-0"}`}
        >
          <Button
            onClick={handleCommitBatch}
            disabled={!isReadyToCommit || isCommitting}
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-border/50 bg-background/80 px-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-2xl shadow-2xl transition-all hover:scale-105 hover:bg-muted/80 hover:text-foreground active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-background/80"
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

      {/* --- MAIN CONTENT STAGE --- */}
      {/* pt-32 clears the top floating nav, pb-32 clears the bottom floating pill on mobile */}
      <main className="mx-auto max-w-5xl px-4 pt-32 pb-32 md:pb-12 md:px-8">
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          {/* Dropzone */}
          <label className="flex flex-col items-center justify-center w-full p-12 md:p-20 border border-dashed border-border/60 rounded-3xl cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors group">
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

          {/* Staging Grid */}
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
