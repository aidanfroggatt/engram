"use client";

import { AlertCircle, Calendar, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { StagedFile } from "@/types/media";
import { LocationSearch } from "./location-search";

interface StagedAssetCardProps {
  asset: StagedFile;
  onUpdate: (id: string, updates: Partial<StagedFile>) => void;
  onRemove: (id: string) => void;
}

export function StagedAssetCard({ asset, onUpdate, onRemove }: StagedAssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate pr-4">
              {asset.fileName}
            </span>
            {!isSuccess && !isUploading && (
              <button
                onClick={() => onRemove(asset.id)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 shrink-0"
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

            {/* Replaced manual Lat/Lng inputs with the visual Location Search */}
            <LocationSearch
              currentLat={asset.latitude}
              currentLng={asset.longitude}
              disabled={isUploading || isSuccess}
              onLocationSelect={(lat, lng) => {
                onUpdate(asset.id, {
                  latitude: lat ?? undefined,
                  longitude: lng ?? undefined,
                });
              }}
            />
          </div>

          {isErrorState && (
            <p className="text-[9px] text-destructive font-bold uppercase flex items-center gap-1.5 mt-2 bg-destructive/10 px-2 py-1.5 rounded-md w-fit">
              <AlertCircle className="w-3 h-3" /> {asset.errorMessage || "Network Error"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
