"use client";

import { MediaAsset } from "@/types/media";
import { Play } from "lucide-react";
import Image from "next/image";

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
  const isVideo = asset.mimeType.startsWith("video/");
  const altText = `Media asset captured on ${new Date(asset.captureTime).toLocaleDateString()}`;

  if (isVideo) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black overflow-hidden group">
        <video
          src={`${asset.url}${isThumbnail ? "#t=0.001" : ""}`}
          className="h-full w-full object-cover"
          controls={!isThumbnail}
          autoPlay={!isThumbnail}
          muted={!isThumbnail}
          preload="metadata"
          playsInline
          aria-label={altText}
        />
        {isThumbnail && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-all group-hover:bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5 fill-white text-white ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-muted/20 group">
      <Image
        src={asset.url}
        alt={altText}
        fill
        unoptimized
        sizes={isThumbnail ? "(max-width: 768px) 50vw, 33vw" : "100vw"}
        priority={priority}
        className={`transition-transform duration-700 ease-out ${
          isThumbnail ? "object-cover group-hover:scale-105" : "object-contain"
        }`}
      />
    </div>
  );
}
