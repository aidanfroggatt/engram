"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, FileVideo, Image as ImageIcon, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
  const { getToken } = useAuth();

  // State for the URL + short-lived Clerk JWT
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isVideo = asset.mimeType.startsWith("video/");
  const filename = asset.fileKey.split("/").pop() || "Vault Asset";

  // Fetch a fresh token whenever the asset changes
  useEffect(() => {
    let isMounted = true;

    async function authorize() {
      try {
        const token = await getToken();
        if (isMounted && token && asset.url) {
          // SAFE URL CONSTRUCTION
          const url = new URL(asset.url);
          url.searchParams.set("token", token);
          setAuthUrl(url.toString());
        }
      } catch {
        if (isMounted) setHasError(true);
      }
    }

    authorize();
    return () => {
      isMounted = false;
    };
  }, [asset.url, getToken]);

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        {!isThumbnail && (
          <p className="mt-2 text-xs font-mono uppercase tracking-widest">
            Identity Verification Failed
          </p>
        )}
      </div>
    );
  }

  // If we don't have the authUrl yet, we stay in the Loading/Skeleton state
  const currentSrc = authUrl || "";
  const showSkeleton = isLoading || !authUrl;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted/5">
      {/* --- SHADCN SKELETON LOADING STATE --- */}
      {showSkeleton && (
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
            src={currentSrc}
            className={cn(
              "transition-opacity duration-500",
              showSkeleton ? "opacity-0" : "opacity-100",
              isThumbnail ? "h-full w-full object-cover" : "max-h-full max-w-full object-contain"
            )}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            controls={!isThumbnail}
            autoPlay={!isThumbnail}
            muted={isThumbnail}
            loop={isThumbnail}
            playsInline
            // Use "metadata" for thumbnails to save even more bandwidth
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
          src={currentSrc}
          alt={filename}
          className={cn(
            "transition-opacity duration-500",
            showSkeleton ? "opacity-0" : "opacity-100",
            isThumbnail ? "h-full w-full object-cover" : "max-h-full max-w-full object-contain"
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
