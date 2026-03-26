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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background">
        <Logo showText={false} iconSize={32} className="animate-pulse" />
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          Establishing Connection...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Logo showText={false} iconSize={20} />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-tighter">Engram</span>
              <Badge
                variant="outline"
                className="h-4 px-1.5 font-mono text-[8px] uppercase border-muted-foreground/30"
              >
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
      <main className="mx-auto w-full max-w-400 flex-1 px-4 pt-24 pb-32 md:pb-24 md:px-8">
        <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <ToggleGroup
            type="single"
            value={timeScale}
            onValueChange={(val) => val && setTimeScale(val as TimeScale)}
            className="justify-start inline-flex"
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
          <Card className="flex flex-col items-center justify-center border-dashed py-32 text-center bg-muted/30">
            <CardContent>
              <DatabaseBackup className="mb-4 h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">Vault Partition Empty</p>
              <Button variant="link" asChild className="mt-2 text-primary">
                <Link href="/upload">Initialize first batch</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            {Object.entries(groupedMedia).map(([label, assets]) => (
              <section key={label}>
                <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-4 flex items-center gap-4 supports-[backdrop-filter]:bg-background/80">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/90">
                    {label}
                  </h2>
                  <Separator className="flex-1" />
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] text-muted-foreground"
                  >
                    {assets.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 md:gap-3 mt-2">
                  {assets.map((asset, i) => (
                    <button
                      key={asset.id}
                      onClick={() => setActiveAsset(asset)}
                      aria-label={`Inspect asset from ${label}`}
                      aria-haspopup="dialog"
                      className="group relative aspect-square overflow-hidden md:rounded-md bg-muted transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <MediaRenderer asset={asset} isThumbnail={true} priority={i < 8} />
                      {asset.latitude && (
                        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                          <MapPin className="absolute right-2 top-2 h-3.5 w-3.5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            {hasNextPage && (
              <div className="flex justify-center py-12">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={isFetchingNextPage}
                  className="w-full sm:w-auto"
                >
                  {isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFetchingNextPage ? "Decrypting Nodes..." : "Load Older Archives"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <div className="fixed bottom-0 inset-x-0 z-40 h-24 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-6 md:hidden pointer-events-none">
        <Button
          size="lg"
          asChild
          className="rounded-full shadow-xl pointer-events-auto w-2/3 max-w-sm"
        >
          <Link href="/upload">
            <Plus className="mr-2 h-5 w-5" /> Upload Media
          </Link>
        </Button>
      </div>
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
