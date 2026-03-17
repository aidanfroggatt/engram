"use client";

import { UserButton } from "@clerk/nextjs";
import {
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { MapPin, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVaultGallery } from "@/hooks/use-vault-gallery";
import { MediaAsset } from "@/types/media";

type TimeScale = "day" | "week" | "month" | "year";

export default function GalleryPage() {
  const { media, isLoading } = useVaultGallery();
  const [timeScale, setTimeScale] = useState<TimeScale>("week");

  // Basic Grouping Logic
  const groupedMedia = useMemo(() => {
    if (!media.length) return {};
    const groups: Record<string, MediaAsset[]> = {};

    // Ensure chronological order
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
      <div className="p-8 font-mono text-xs uppercase">Syncing Vault...</div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      {/* Utility Header */}
      <header className="flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-tighter">
            Engram Vault
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">
            {media.length} assets synced
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

      {/* Timescale Selector */}
      <div className="mb-12">
        <Tabs
          value={timeScale}
          onValueChange={(v) => setTimeScale(v as TimeScale)}
        >
          <TabsList className="bg-muted/50">
            <TabsTrigger
              value="day"
              className="text-[10px] uppercase font-bold"
            >
              Day
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="text-[10px] uppercase font-bold"
            >
              Week
            </TabsTrigger>
            <TabsTrigger
              value="month"
              className="text-[10px] uppercase font-bold"
            >
              Month
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className="text-[10px] uppercase font-bold"
            >
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grouped Grid */}
      <div className="space-y-12">
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
                    <div className="aspect-square relative bg-muted cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={asset.url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {asset.latitude && (
                        <div className="absolute top-1 right-1">
                          <MapPin className="w-3 h-3 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </DialogTrigger>

                  {/* Simple Detail View */}
                  <DialogContent className="max-w-3xl">
                    <div className="space-y-4">
                      <div className="aspect-video relative bg-black rounded-lg overflow-hidden">
                        <Image
                          src={asset.url}
                          alt=""
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase">
                        <div className="p-3 bg-muted rounded">
                          <p className="text-muted-foreground mb-1">
                            Captured At
                          </p>
                          <p className="font-bold">
                            {format(
                              new Date(asset.captureTime),
                              "yyyy-MM-dd HH:mm:ss",
                            )}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="text-muted-foreground mb-1">
                            Mime Type
                          </p>
                          <p className="font-bold">{asset.mimeType}</p>
                        </div>
                        {asset.latitude && (
                          <div className="p-3 bg-muted rounded col-span-2">
                            <p className="text-muted-foreground mb-1">
                              Coordinates
                            </p>
                            <p className="font-bold">
                              {asset.latitude}, {asset.longitude}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </section>
        ))}
      </div>

      {media.length === 0 && !isLoading && (
        <div className="py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-xs font-mono uppercase text-muted-foreground">
            No media found in vault
          </p>
        </div>
      )}
    </div>
  );
}
