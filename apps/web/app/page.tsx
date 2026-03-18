"use client";

import { UserButton } from "@clerk/nextjs";
import { DatabaseBackup, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { AssetDialog } from "@/components/gallery/asset-dialog";
import { TimeScaleSelector } from "@/components/gallery/time-scale-selector";
import { Button } from "@/components/ui/button";
import { TimeScale, useGroupedMedia } from "@/hooks/use-grouped-media";
import { useVaultGallery } from "@/hooks/use-vault-gallery";

export default function GalleryPage() {
  const { media, isLoading } = useVaultGallery();
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const groupedMedia = useGroupedMedia(media, timeScale);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="mb-6 animate-pulse scale-125">
          <Logo showText={false} iconSize={24} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Establishing Connection...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* --- DESKTOP & MOBILE TOP NAV (Info & Auth) --- */}
      <header className="fixed top-4 md:top-6 inset-x-4 md:inset-x-8 z-50 flex items-start justify-between pointer-events-none">
        {/* Left: Branding & Status Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/50 bg-background/60 pr-5 backdrop-blur-xl shadow-2xl transition-all hover:bg-background/80">
          <div className="scale-90 origin-left">
            <Logo showText={false} iconSize={18} />
          </div>
          <div className="flex flex-col py-2">
            <h1 className="text-[11px] font-black uppercase tracking-widest leading-none text-foreground">
              Engram
            </h1>
            <p className="mt-1 text-[8px] font-mono text-muted-foreground uppercase tracking-widest">
              {media.length} Nodes Active
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Desktop Only: Floating Add Media Button */}
          <Link href="/upload" className="hidden md:block">
            <Button
              size="sm"
              variant="outline"
              className="h-12 rounded-2xl border-border/50 bg-background/60 px-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-xl shadow-2xl transition-all hover:bg-muted/50 hover:text-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Media
            </Button>
          </Link>

          {/* User Profile Pill */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl transition-all hover:bg-background/80">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "h-8 w-8 rounded-xl" },
              }}
            />
          </div>
        </div>
      </header>

      {/* --- MOBILE BOTTOM NAV (Thumb Navigation) --- */}
      <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none md:hidden">
        <Link href="/upload" className="pointer-events-auto">
          <Button
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-border/50 bg-background/80 px-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-2xl shadow-2xl transition-all hover:scale-105 hover:bg-muted/80 hover:text-foreground active:scale-95"
          >
            <Plus className="mr-2 h-5 w-5" /> Upload Asset
          </Button>
        </Link>
      </div>

      {/* --- MAIN CONTENT STAGE --- */}
      {/* Added pt-32 to clear the floating top nav, and pb-32 on mobile to clear the bottom nav */}
      <main className="mx-auto max-w-[1600px] px-4 pt-32 pb-32 md:pb-12 md:px-8">
        {/* Scale Controls */}
        <div className="mb-12 flex justify-start animate-in fade-in slide-in-from-top-4 duration-1000">
          <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        </div>

        {/* Dynamic Feed */}
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 py-32 bg-muted/5 transition-colors hover:bg-muted/10">
            <DatabaseBackup className="mb-6 h-12 w-12 text-muted-foreground/30" />
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-8 text-center">
              Vault Partition Empty
            </p>
            {/* Kept this button for desktop empty states */}
            <Link href="/upload" className="hidden md:block">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border/50 bg-background/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Initialize Batch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedMedia).map(([label, assets]) => (
              <section
                key={label}
                className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out"
              >
                {/* Sticky Group Header */}
                <div className="flex items-center gap-4 mb-6 sticky top-24 bg-background/90 backdrop-blur-xl py-4 z-40 border-b border-border/30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
                  <h2 className="text-sm font-black uppercase tracking-widest text-foreground pl-2">
                    {label}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/30 border border-border/30 px-3 py-1.5 rounded-lg mr-2">
                    {assets.length} items
                  </span>
                </div>

                {/* Spatial Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {assets.map((asset) => (
                    <AssetDialog key={asset.id} asset={asset} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
