"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useApi } from "@/hooks/use-api";
import { useAssetMetadata } from "@/hooks/use-asset-metadata";
import { MediaAsset } from "@/types/media";

export function DeleteModal({
  asset,
  children,
  onSuccess,
}: {
  asset: MediaAsset;
  children: ReactNode;
  onSuccess: () => void;
}) {
  const api = useApi();
  const { deleteConfirmation } = useAssetMetadata(asset);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== deleteConfirmation) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/media/${asset.id}`);
      toast.success("Asset purged.");
      onSuccess();
      setOpen(false);
    } catch {
      toast.error("Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle /> Delete Asset
          </DialogTitle>
          <DialogDescription>
            This action is permanent. The asset will be removed from your vault and storage
            provider.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>
            Type <u>{deleteConfirmation}</u> to confirm
          </FieldLabel>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Button
          onClick={handleDelete}
          disabled={confirmText !== deleteConfirmation || isDeleting}
          variant="destructive"
        >
          {isDeleting && <Loader2 />}
          Confirm Delete
        </Button>
      </DialogContent>
    </Dialog>
  );
}
