"use client";

import { UserButton } from "@clerk/nextjs";
import {
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { MapPin, PlayCircle, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVaultGallery } from "@/hooks/use-vault-gallery";
import { MediaAsset } from "@/types/media";

type TimeScale = "day" | "week" | "month" | "year";

// --- Sub-Component: MediaRenderer ---
function MediaRenderer({
  asset,
  isThumbnail = false,
}: {
  asset: MediaAsset;
  isThumbnail?: boolean;
}) {
  const isVideo = asset.mimeType.startsWith("video/");

  if (isVideo) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          src={`${asset.url}${isThumbnail ? "#t=0.001" : ""}`}
          className="w-full h-full object-cover"
          controls={!isThumbnail}
          autoPlay={!isThumbnail}
          preload="metadata"
          playsInline
        />
        {isThumbnail && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <PlayCircle className="w-8 h-8 text-white/80 drop-shadow-md" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Image
      src={asset.url}
      alt={asset.fileKey}
      fill
      unoptimized
      className={isThumbnail ? "object-cover" : "object-contain"}
    />
  );
}

// --- Main Page ---

export default function GalleryPage() {
  const { media, isLoading } = useVaultGallery();
  const [timeScale, setTimeScale] = useState<TimeScale>("week");

  const groupedMedia = useMemo(() => {
    if (!media.length) return {};
    const groups: Record<string, MediaAsset[]> = {};

    const sorted = [...media].sort(
      (a, b) =>
        new Date(b.captureTime).getTime() - new Date(a.captureTime).getTime(),
    );

    sorted.forEach((item) => {
      const date = new Date(item.captureTime);
      let key = "";
      switch (timeScale) {
        case "day":
          key = format(startOfDay(date), "MMM dd, yyyy");
          break;
        case "week":
          key = `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), "MMM dd")}`;
          break;
        case "month":
          key = format(startOfMonth(date), "MMMM yyyy");
          break;
        case "year":
          key = format(startOfYear(date), "yyyy");
          break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key]?.push(item);
    });
    return groups;
  }, [media, timeScale]);

  if (isLoading)
    return (
      <div className="p-8 font-mono text-[10px] uppercase tracking-widest animate-pulse">
        Establishing Connection...
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-tighter">
            Vault Gallery
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">
            {media.length} nodes active
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/upload">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 uppercase text-[10px] font-bold"
            >
              <Plus className="w-3 h-3" /> Add Media
            </Button>
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="mb-12">
        <Tabs
          value={timeScale}
          onValueChange={(v) => setTimeScale(v as TimeScale)}
        >
          <TabsList className="bg-muted/50">
            {["day", "week", "month", "year"].map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="text-[10px] uppercase font-bold px-6"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-12 pb-24">
        {Object.entries(groupedMedia).map(([label, assets]) => (
          <section key={label}>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest">
                {label}
              </h2>
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-mono text-muted-foreground">
                {assets.length} items
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {assets.map((asset) => (
                <Dialog key={asset.id}>
                  <DialogTrigger asChild>
                    <div className="aspect-square relative bg-muted cursor-pointer hover:ring-1 hover:ring-primary transition-all rounded overflow-hidden">
                      <MediaRenderer asset={asset} isThumbnail={true} />
                      {asset.latitude && (
                        <div className="absolute top-1 right-1 bg-black/40 p-1 rounded-sm">
                          <MapPin className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl p-6 bg-zinc-950 border-white/10">
                    <DialogHeader className="sr-only">
                      <DialogTitle>
                        Asset Details for {asset.fileKey}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                      <div className="md:col-span-2 aspect-video relative bg-black rounded-lg overflow-hidden border border-white/5">
                        <MediaRenderer asset={asset} isThumbnail={false} />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1 border-b border-white/5 pb-4">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            Context Info
                          </p>
                          <h3 className="text-xs font-bold uppercase italic text-zinc-300">
                            File Metadata
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-[10px] font-mono uppercase">
                          <div className="p-3 bg-white/5 rounded">
                            <p className="text-zinc-500 mb-1">Captured</p>
                            <p className="text-zinc-200">
                              {format(
                                new Date(asset.captureTime),
                                "yyyy-MM-dd HH:mm:ss",
                              )}
                            </p>
                          </div>
                          {asset.latitude && (
                            <div className="p-3 bg-white/5 rounded border border-blue-500/20">
                              <p className="text-blue-500/60 mb-1">Location</p>
                              <p className="text-blue-400">
                                {asset.latitude.toFixed(4)},{" "}
                                {asset.longitude?.toFixed(4)}
                              </p>
                            </div>
                          )}
                          <div className="p-3 bg-white/5 rounded">
                            <p className="text-zinc-500 mb-1">File ID</p>
                            <p className="text-zinc-200 truncate">
                              {asset.fileKey.split("/").pop()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
