"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { extractMetadata } from "@/lib/exif";
import { StagedFile } from "@/types/media";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function StagedAssetCard({
  asset,
  onUpdate,
  onRemove,
}: {
  asset: StagedFile;
  onUpdate: (id: string, updates: Partial<StagedFile>) => void;
  onRemove: (id: string) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(asset.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [asset.file]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const date = new Date(e.target.value);
    onUpdate(asset.id, {
      captureTime: isNaN(date.getTime()) ? undefined : date,
    });
  };

  const isUploading = asset.uploadStatus === "uploading";
  const isSuccess = asset.uploadStatus === "success";
  const isError = asset.uploadStatus === "error";
  const needsDate = !asset.captureTime;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${isSuccess ? "opacity-50 grayscale" : "hover:border-primary/50"}`}
    >
      <CardContent className="p-3 flex flex-row gap-4">
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-lg overflow-hidden bg-muted shrink-0 border border-border flex items-center justify-center">
          {!previewUrl ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
          ) : asset.mimeType.startsWith("video/") ? (
            <video src={previewUrl} className="w-full h-full object-cover" />
          ) : (
            <Image
              src={previewUrl}
              alt={asset.fileName}
              fill
              unoptimized
              className="object-cover"
            />
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {isSuccess && (
            <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-8 h-8 drop-shadow-md" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest truncate">
                {asset.mimeType.split("/")[1]} •{" "}
                {(asset.file.size / 1024 / 1024).toFixed(1)}MB
              </p>
              {isError && (
                <p className="text-xs text-destructive font-bold mt-1 truncate">
                  {asset.errorMessage || "Upload failed"}
                </p>
              )}
            </div>
            {!isSuccess && !isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(asset.id)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2 -mt-2 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${needsDate ? "text-destructive" : "text-muted-foreground"}`}
              />
              <div className="relative flex-1">
                <Input
                  type="datetime-local"
                  disabled={isUploading || isSuccess}
                  value={
                    asset.captureTime
                      ? new Date(
                          asset.captureTime.getTime() -
                            asset.captureTime.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={handleDateChange}
                  className={`h-7 px-2 py-0 text-xs font-mono shadow-none transition-colors ${
                    needsDate
                      ? "border-destructive/50 bg-destructive/5 text-destructive focus-visible:ring-destructive"
                      : "border-transparent bg-muted/50 hover:bg-muted focus-visible:ring-primary/20 focus-visible:bg-transparent"
                  }`}
                />
              </div>
              {needsDate && (
                <AlertCircle className="w-3.5 h-3.5 text-destructive animate-pulse shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 gap-1">
                <Input
                  type="number"
                  placeholder="Latitude"
                  disabled={isUploading || isSuccess}
                  value={asset.latitude || ""}
                  onChange={(e) =>
                    onUpdate(asset.id, {
                      latitude: parseFloat(e.target.value) || null,
                    })
                  }
                  className="h-7 px-2 py-0 text-xs font-mono shadow-none border-transparent bg-muted/50 hover:bg-muted focus-visible:ring-primary/20 focus-visible:bg-transparent"
                />
                <Input
                  type="number"
                  placeholder="Longitude"
                  disabled={isUploading || isSuccess}
                  value={asset.longitude || ""}
                  onChange={(e) =>
                    onUpdate(asset.id, {
                      longitude: parseFloat(e.target.value) || null,
                    })
                  }
                  className="h-7 px-2 py-0 text-xs font-mono shadow-none border-transparent bg-muted/50 hover:bg-muted focus-visible:ring-primary/20 focus-visible:bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UploadBatchPage() {
  const router = useRouter(); // <-- Add this here
  const { uploadFile } = useMediaUpload();
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsParsing(true);
    const filesArray = Array.from(e.target.files);

    toast.loading(`Extracting metadata from ${filesArray.length} assets...`, {
      id: "parsing",
    });

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
      toast.success(`${filesArray.length} assets staged successfully.`, {
        id: "parsing",
      });
    } catch (error: unknown) {
      toast.error("Extraction failed", {
        description: getErrorMessage(error),
        id: "parsing",
      });
    } finally {
      setIsParsing(false);
      if (e.target) e.target.value = "";
    }
  };

  const updateStagedFile = (id: string, updates: Partial<StagedFile>): void => {
    setStagedFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, ...updates } : file)),
    );
  };

  const removeStagedFile = (id: string): void => {
    setStagedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const pendingFiles = stagedFiles.filter(
    (f) => f.uploadStatus === "idle" || f.uploadStatus === "error",
  );
  const completedCount = stagedFiles.length - pendingFiles.length;
  const isReadyToCommit =
    pendingFiles.length > 0 && pendingFiles.every((f) => f.captureTime);

  const handleCommitBatch = async (): Promise<void> => {
    if (!isReadyToCommit) return;
    setIsCommitting(true);
    toast.info(
      `Initializing batch vaulting for ${pendingFiles.length} assets...`,
    );

    let hasErrors = false;

    for (const file of pendingFiles) {
      updateStagedFile(file.id, {
        uploadStatus: "uploading",
        errorMessage: undefined,
      });

      const result = await uploadFile(file);

      if (result.success) {
        updateStagedFile(file.id, {
          uploadStatus: "success",
          fileKey: result.fileKey,
        });
      } else {
        hasErrors = true;
        updateStagedFile(file.id, {
          uploadStatus: "error",
          errorMessage: result.error,
        });
        toast.error("Upload failed", { description: result.error });
      }
    }

    setIsCommitting(false);

    if (hasErrors) {
      toast.warning(
        "Batch completed with errors. Please review the failed assets.",
      );
    } else {
      toast.success("Batch execution completed. Redirecting to vault...");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile-Sticky Premium Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-black uppercase tracking-widest text-foreground leading-none">
            Staging Area
          </h1>
          {stagedFiles.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
              {completedCount} / {stagedFiles.length} Vaulted
            </span>
          )}
        </div>
        {stagedFiles.length > 0 && (
          <Button
            onClick={handleCommitBatch}
            disabled={!isReadyToCommit || isCommitting}
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px] h-8 transition-all"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Committing
              </>
            ) : (
              "Commit Batch"
            )}
          </Button>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24 mt-4">
          {/* Dropzone / Input */}
          <label className="flex flex-col items-center justify-center w-full cursor-pointer p-8 border border-dashed border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-primary/50 rounded-2xl transition-all group">
            <div className="h-12 w-12 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-bold text-foreground uppercase tracking-widest mb-1 text-center">
              {isParsing ? "Reading Metadata..." : "Add Media to Batch"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase text-center max-w-xs">
              Missing timestamps must be patched prior to commit.
            </span>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={isParsing || isCommitting}
            />
          </label>

          {stagedFiles.length > 0 && (
            <div className="pt-4 flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Review Queue
              </span>
              <Separator className="flex-1" />
            </div>
          )}

          {/* Staging Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stagedFiles.map((file) => (
              <StagedAssetCard
                key={file.id}
                asset={file}
                onUpdate={updateStagedFile}
                onRemove={removeStagedFile}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
