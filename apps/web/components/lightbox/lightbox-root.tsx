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
        className="max-w-none w-screen h-screen p-0 border-none flex flex-col shadow-none [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-row items-center justify-between px-6 h-16 space-y-0 shrink-0">
          <DialogTitle className="sr-only">Viewing {filename}</DialogTitle>

          <DialogClose asChild>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </DialogClose>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href={asset.url} download>
                <Download className="h-5 w-5" />
              </a>
            </Button>

            <InfoSidebar asset={asset}>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </InfoSidebar>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
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
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Asset
                  </DropdownMenuItem>
                </DeleteModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <MediaRenderer asset={asset} isThumbnail={false} priority={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
