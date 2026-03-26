"use client";

import { Download, Info, MoreVertical, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAssetMetadata } from "@/hooks/use-asset-metadata";
import { MediaAsset } from "@/types/media";
import { MediaRenderer } from "../media-renderer";

import { DeleteModal } from "./delete-modal";
import { EditModal } from "./edit-modal";
import { InfoSidebar } from "./info-sidebar";

export function LightboxRoot({
  asset,
  onClose,
  onDeleteSuccess,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onDeleteSuccess: () => void;
}) {
  const { filename } = useAssetMetadata(asset);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // Use 100dvh for mobile browser address bar fix.
        // Add bg-black/95 for a slightly softer dark mode feel.
        className="max-w-none w-screen h-[100dvh] p-0 border-none flex flex-col shadow-none bg-background/95 backdrop-blur-sm [&>button]:hidden sm:bg-background/90"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Viewing {filename}</DialogTitle>

        {/* Floating Header: Position absolute so it overlays the top padding of the image container cleanly */}
        <DialogHeader className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between p-4 space-y-0 shrink-0 bg-gradient-to-b from-black/50 to-transparent text-white sm:p-6 sm:from-transparent sm:text-foreground">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 hover:bg-black/40 text-white sm:bg-transparent sm:hover:bg-accent sm:text-foreground"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogClose>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 hover:bg-black/40 text-white sm:bg-transparent sm:hover:bg-accent sm:text-foreground"
              asChild
            >
              <a href={asset.url} download>
                <Download className="h-5 w-5" />
              </a>
            </Button>

            <InfoSidebar asset={asset}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/20 hover:bg-black/40 text-white sm:bg-transparent sm:hover:bg-accent sm:text-foreground"
              >
                <Info className="h-5 w-5" />
              </Button>
            </InfoSidebar>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/20 hover:bg-black/40 text-white sm:bg-transparent sm:hover:bg-accent sm:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <EditModal asset={asset}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Metadata
                  </DropdownMenuItem>
                </EditModal>

                <DropdownMenuSeparator />

                <DeleteModal asset={asset} onSuccess={onDeleteSuccess}>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Asset
                  </DropdownMenuItem>
                </DeleteModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        {/* Image Container: Added padding (p-4 sm:p-12) to ensure the image is never pressed against the screen edge */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4 pt-20 pb-safe sm:p-12 sm:pt-24">
          <div className="relative w-full h-full flex items-center justify-center">
            <MediaRenderer asset={asset} isThumbnail={false} priority={true} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
