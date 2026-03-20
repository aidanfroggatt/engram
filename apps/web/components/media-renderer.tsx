"use client";

import {
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MediaAsset } from "@/types/media";

interface MediaRendererProps {
  asset: MediaAsset;
  isThumbnail?: boolean;
  priority?: boolean;
}

export function MediaRenderer({
  asset,
  isThumbnail = false,
  priority = false,
}: MediaRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isVideo = asset.mimeType.startsWith("video/");
  const filename = asset.fileKey.split("/").pop() || "Vault Asset";

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        {!isThumbnail && (
          <p className="mt-2 text-xs font-mono uppercase tracking-widest">
            Load Failure
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted/5">
      {/* --- SHADCN SKELETON LOADING STATE --- */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Skeleton className="h-full w-full flex items-center justify-center rounded-none">
            {isVideo ? (
              <FileVideo className="h-6 w-6 opacity-20" />
            ) : (
              <ImageIcon className="h-6 w-6 opacity-20" />
            )}
          </Skeleton>
        </div>
      )}

      {isVideo ? (
        <div className="relative h-full w-full flex items-center justify-center">
          <video
            src={asset.url}
            className={cn(
              "transition-opacity duration-500",
              isLoading ? "opacity-0" : "opacity-100",
              isThumbnail
                ? "h-full w-full object-cover"
                : "max-h-full max-w-full object-contain",
            )}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            controls={!isThumbnail}
            autoPlay={!isThumbnail}
            muted={isThumbnail}
            loop={isThumbnail}
            playsInline
            preload={priority ? "auto" : "metadata"}
          />
          {isThumbnail && (
            <div className="absolute left-3 top-3 pointer-events-none">
              <PlayCircle className="h-5 w-5 text-white/80 drop-shadow-md" />
            </div>
          )}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={filename}
          className={cn(
            "transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100",
            isThumbnail
              ? "h-full w-full object-cover"
              : "max-h-full max-w-full object-contain",
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
        />
      )}
    </div>
  );
}
