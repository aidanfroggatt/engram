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
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [localLat, setLocalLat] = useState<string>(
    asset.latitude?.toString() ?? "",
  );
  const [localLng, setLocalLng] = useState<string>(
    asset.longitude?.toString() ?? "",
  );

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
    field: "latitude" | "longitude",
  ): void => {
    const val = e.target.value;
    // Regex allows empty, just "-", decimals, or complete floats
    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      setter(val);
      const parsed = parseFloat(val);
      // Update parent only if it's a valid complete number
      if (!isNaN(parsed)) {
        onUpdate(asset.id, { [field]: parsed });
      } else if (val === "") {
        onUpdate(asset.id, { [field]: null });
      }
    }
  };

  const handleCoordBlur = (
    val: string,
    field: "latitude" | "longitude",
  ): void => {
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
      className={`p-4 border rounded-lg bg-card transition-all ${isSuccess ? "opacity-40" : "shadow-sm"}`}
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-24 rounded bg-muted overflow-hidden shrink-0 border">
          {previewUrl &&
            (asset.mimeType.startsWith("video/") ? (
              <video src={previewUrl} className="w-full h-full object-cover" />
            ) : (
              <Image
                src={previewUrl}
                alt={asset.fileName}
                fill
                unoptimized
                className="object-cover"
              />
            ))}
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {isSuccess && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate max-w-[180px]">
              {asset.fileName}
            </span>
            {!isSuccess && !isUploading && (
              <button
                onClick={() => onRemove(asset.id)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Remove asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <div className="relative">
                <Calendar
                  className={`absolute left-2.5 top-2 w-3.5 h-3.5 ${needsDate ? "text-destructive" : "text-muted-foreground"}`}
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
                  className={`h-8 pl-9 text-xs font-mono ${needsDate ? "border-destructive focus-visible:ring-destructive" : "bg-muted/30"}`}
                />
              </div>
              {needsDate && (
                <p className="text-[9px] text-destructive uppercase font-bold tracking-tighter flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Required for Vaulting
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="LAT"
                  disabled={isUploading || isSuccess}
                  value={localLat}
                  onChange={(e) =>
                    handleCoordChange(e, setLocalLat, "latitude")
                  }
                  onBlur={() => handleCoordBlur(localLat, "latitude")}
                  className="h-8 pl-9 text-xs font-mono bg-muted/30"
                />
              </div>
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="LNG"
                  disabled={isUploading || isSuccess}
                  value={localLng}
                  onChange={(e) =>
                    handleCoordChange(e, setLocalLng, "longitude")
                  }
                  onBlur={() => handleCoordBlur(localLng, "longitude")}
                  className="h-8 px-3 text-xs font-mono bg-muted/30"
                />
              </div>
            </div>
          </div>

          {isErrorState && (
            <p className="text-[9px] text-destructive font-bold uppercase flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{" "}
              {asset.errorMessage || "Network Error"}
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

  const handleFileSelect = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
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
        }),
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
    (f) => f.uploadStatus === "idle" || f.uploadStatus === "error",
  );
  const isReadyToCommit =
    pendingFiles.length > 0 && pendingFiles.every((f) => f.captureTime);

  const handleCommitBatch = async (): Promise<void> => {
    if (!isReadyToCommit) return;
    setIsCommitting(true);
    let hasErrors = false;

    for (const file of pendingFiles) {
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, uploadStatus: "uploading" } : f,
        ),
      );

      const result = await uploadFile(file);

      if (result.success) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, uploadStatus: "success", fileKey: result.fileKey }
              : f,
          ),
        );
      } else {
        hasErrors = true;
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, uploadStatus: "error", errorMessage: result.error }
              : f,
          ),
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
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-8">
      <header className="flex items-center justify-between mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
            className="h-9 w-9 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter text-foreground leading-tight">
              Staging Area
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              Ready: {pendingFiles.length} • Total: {stagedFiles.length}
            </p>
          </div>
        </div>
        <Button
          disabled={!isReadyToCommit || isCommitting}
          onClick={handleCommitBatch}
          className="uppercase text-[10px] font-bold px-8 h-9"
        >
          {isCommitting ? "Vaulting..." : "Commit Batch"}
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto space-y-8">
          <label className="flex flex-col items-center justify-center w-full p-16 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group">
            <Plus className="w-10 h-10 text-muted-foreground group-hover:text-primary mb-3" />
            <p className="text-[11px] font-mono uppercase font-bold tracking-widest text-muted-foreground group-hover:text-foreground">
              {isParsing ? "Analyzing Files..." : "Tap to select assets"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stagedFiles.map((file) => (
              <StagedAssetCard
                key={file.id}
                asset={file}
                onRemove={(id: string) =>
                  setStagedFiles((prev) => prev.filter((f) => f.id !== id))
                }
                onUpdate={(id: string, up: Partial<StagedFile>) =>
                  setStagedFiles((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, ...up } : f)),
                  )
                }
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
