"use client";

import { format } from "date-fns";
import { Download, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaAsset } from "@/types/media";
import { MediaRenderer } from "./media-renderer";

export function AssetDialog({
  asset,
  priority = false,
}: {
  asset: MediaAsset;
  priority?: boolean;
}) {
  const captureDate = new Date(asset.captureTime);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted shadow-sm ring-offset-background transition-all hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="View asset details"
        >
          <MediaRenderer asset={asset} isThumbnail={true} priority={priority} />

          {asset.latitude && (
            <div className="absolute right-2 top-2 rounded-md bg-background/70 p-1.5 backdrop-blur-md border border-border/50 shadow-sm transition-opacity group-hover:opacity-100">
              <MapPin className="h-3 w-3 text-foreground" />
            </div>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Asset Details for {asset.fileKey}</DialogTitle>
        </DialogHeader>

        {/* Responsive Container: Stacks on mobile, Side-by-side on desktop */}
        <div className="flex flex-col md:flex-row h-[90vh] md:h-[75vh] max-h-200">
          {/* Media Display Area */}
          <div className="relative w-full h-[45vh] md:h-auto md:flex-7 bg-black flex items-center justify-center border-b md:border-b-0 md:border-r border-border/50 shrink-0">
            <div className="relative h-full w-full">
              <MediaRenderer asset={asset} isThumbnail={false} />
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="flex-1 flex flex-col bg-muted/10 md:flex-3 overflow-hidden">
            {/* ... Sidebar code remains exactly the same ... */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="space-y-1 border-b border-border/50 pb-6 mb-6 mt-2 md:mt-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Context Metadata
                </p>
                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                  Asset Profile
                </h3>
              </div>

              <div className="flex flex-col gap-6 text-[10px] font-mono uppercase">
                <div className="space-y-2">
                  <p className="text-muted-foreground tracking-widest">
                    Captured
                  </p>
                  <time
                    dateTime={captureDate.toISOString()}
                    className="flex h-10 w-full items-center rounded-md border border-border/50 bg-background/50 px-3 text-xs font-semibold text-foreground"
                  >
                    {format(captureDate, "yyyy-MM-dd • HH:mm:ss")}
                  </time>
                </div>

                {asset.latitude && (
                  <div className="space-y-2">
                    <p className="text-primary/70 tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Coordinates
                    </p>
                    <div className="flex h-10 w-full items-center rounded-md border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary">
                      {asset.latitude.toFixed(4)}, {asset.longitude?.toFixed(4)}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-muted-foreground tracking-widest">
                    System Key
                  </p>
                  <div
                    className="flex h-10 w-full items-center rounded-md border border-border/50 bg-background/50 px-3 text-xs font-semibold text-foreground truncate"
                    title={asset.fileKey}
                  >
                    {asset.fileKey.split("/").pop()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground tracking-widest">
                    MIME Protocol
                  </p>
                  <div className="flex h-10 w-full items-center rounded-md border border-border/50 bg-background/50 px-3 text-xs font-semibold text-foreground">
                    {asset.mimeType}
                  </div>
                </div>
              </div>
            </div>

            {/* Utility Footer */}
            <div className="p-6 bg-muted/30 border-t border-border/50 flex justify-end shrink-0">
              <a
                href={asset.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Source File
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
