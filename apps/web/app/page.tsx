"use client";

import { UserButton } from "@clerk/nextjs";
import { DatabaseBackup, Loader2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { LightboxRoot } from "@/components/lightbox/lightbox-root";
import { MediaRenderer } from "@/components/media-renderer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { TimeScale, useGroupedMedia } from "@/hooks/use-grouped-media";
import { useVaultGallery } from "@/hooks/use-vault-gallery";
import { MediaAsset } from "@/types/media";

export default function GalleryPage() {
  const { media, isLoading, isFetchingNextPage, hasNextPage, loadMore, refetch } =
    useVaultGallery();

  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const groupedMedia = useGroupedMedia(media, timeScale);
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Logo showText={false} iconSize={32} />
        <p className="mt-4 animate-pulse font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Establishing Connection...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- TOP NAVIGATION --- */}
      <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Logo showText={false} iconSize={20} />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-tighter">Engram</span>
              <Badge variant="outline" className="h-4 px-1.5 font-mono text-[8px] uppercase">
                {media.length} Nodes
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="hidden md:flex">
              <Link href="/upload">
                <Plus className="mr-2 h-4 w-4" /> Add Media
              </Link>
            </Button>
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "h-8 w-8" },
              }}
            />
          </div>
        </div>
      </header>

      {/* --- MOBILE ACTION BAR --- */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center md:hidden pointer-events-none">
        <Button size="lg" asChild className="rounded-full shadow-lg pointer-events-auto">
          <Link href="/upload">
            <Plus className="mr-2 h-5 w-5" /> Upload
          </Link>
        </Button>
      </div>

      {/* --- GALLERY STAGE --- */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-24 pb-24 md:px-8">
        {/* TIME SCALE SELECTOR (Integrated)
            Uses Shadcn ToggleGroup for semantic "single-choice" selection.
        */}
        <div className="mb-10">
          <ToggleGroup
            type="single"
            value={timeScale}
            onValueChange={(val) => val && setTimeScale(val as TimeScale)}
            className="justify-start"
          >
            <ToggleGroupItem
              value="week"
              aria-label="Group by week"
              className="font-mono text-[10px] uppercase tracking-widest px-4"
            >
              Week
            </ToggleGroupItem>
            <ToggleGroupItem
              value="month"
              aria-label="Group by month"
              className="font-mono text-[10px] uppercase tracking-widest px-4"
            >
              Month
            </ToggleGroupItem>
            <ToggleGroupItem
              value="year"
              aria-label="Group by year"
              className="font-mono text-[10px] uppercase tracking-widest px-4"
            >
              Year
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {media.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-32 text-center">
            <CardContent>
              <DatabaseBackup className="mb-4 h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">Vault Partition Empty</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/upload">Initialize first batch</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedMedia).map(([label, assets]) => (
              <section key={label}>
                {/* Sticky Section Header */}
                <div className="sticky top-16 z-30 bg-background/95 py-4 flex items-center gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest">{label}</h2>
                  <Separator className="flex-1" />
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {assets.length}
                  </Badge>
                </div>

                {/* The Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-4">
                  {assets.map((asset, i) => (
                    <button
                      key={asset.id}
                      onClick={() => setActiveAsset(asset)}
                      aria-label={`Inspect asset from ${label}`}
                      aria-haspopup="dialog"
                      className="group relative aspect-square overflow-hidden rounded-md border bg-muted transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <MediaRenderer asset={asset} isThumbnail={true} priority={i < 8} />
                      {asset.latitude && (
                        <div className="absolute right-2 top-2">
                          <MapPin className="h-3 w-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {/* Pagination */}
            {hasNextPage && (
              <div className="flex justify-center py-12">
                <Button variant="secondary" onClick={loadMore} disabled={isFetchingNextPage}>
                  {isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFetchingNextPage ? "Decrypting Nodes..." : "Load Older Archives"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- LIGHTBOX OVERLAY --- */}
      {activeAsset && (
        <LightboxRoot
          asset={activeAsset}
          onClose={() => setActiveAsset(null)}
          onDeleteSuccess={() => {
            setActiveAsset(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
