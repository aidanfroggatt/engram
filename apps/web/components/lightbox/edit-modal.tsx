"use client";

import { Calendar, Loader2, MapPin } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useApi } from "@/hooks/use-api";
import { useAssetMetadata } from "@/hooks/use-asset-metadata";
import { MediaAsset } from "@/types/media";

export function EditModal({
  asset,
  children,
  onSuccess,
}: {
  asset: MediaAsset;
  children: ReactNode;
  onSuccess?: () => void;
}) {
  const api = useApi();
  const { filename, inputDate } = useAssetMetadata(asset);

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    captureTime: inputDate,
    lat: asset.latitude?.toString() || "",
    lng: asset.longitude?.toString() || "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/api/media/${asset.id}`, {
        captureTime: new Date(form.captureTime).toISOString(),
        latitude: form.lat ? parseFloat(form.lat) : null,
        longitude: form.lng ? parseFloat(form.lng) : null,
      });

      toast.success("Metadata synced.");
      onSuccess?.();
      setOpen(false);
    } catch {
      toast.error("Sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modify Metadata</DialogTitle>
          <DialogDescription>{filename}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>
              <Calendar /> Capture Time
            </FieldLabel>
            <Input
              type="datetime-local"
              value={form.captureTime}
              onChange={(e) =>
                setForm({ ...form, captureTime: e.target.value })
              }
            />
          </Field>

          <Field>
            <FieldLabel>
              <MapPin /> Latitude
            </FieldLabel>
            <Input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </Field>

          <Field>
            <FieldLabel>
              <MapPin /> Longitude
            </FieldLabel>
            <Input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </Field>
        </FieldGroup>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 />}
          Sync Metadata
        </Button>
      </DialogContent>
    </Dialog>
  );
}
