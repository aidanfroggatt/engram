"use client";

import { Calendar, Hash, MapPin, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAssetMetadata } from "@/hooks/use-asset-metadata";
import { MediaAsset } from "@/types/media";

interface InfoSidebarProps {
  asset: MediaAsset;
  children: ReactNode;
}

export function InfoSidebar({ asset, children }: InfoSidebarProps) {
  const { filename, displayDate } = useAssetMetadata(asset);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Asset Context</SheetTitle>
          <SheetDescription>Node Metadata</SheetDescription>
        </SheetHeader>

        <FieldSet>
          <Field>
            <FieldLabel>
              <Calendar /> Captured
            </FieldLabel>
            <Input readOnly value={displayDate} />
          </Field>

          {asset.latitude && (
            <Field>
              <FieldLabel>
                <MapPin /> Coordinates
              </FieldLabel>
              <Input
                readOnly
                value={`${asset.latitude.toFixed(6)}, ${asset.longitude?.toFixed(6)}`}
              />
            </Field>
          )}

          <Field>
            <FieldLabel>
              <Hash /> System Key
            </FieldLabel>
            <Input readOnly value={filename} />
          </Field>

          <Field>
            <FieldLabel>
              <ShieldCheck /> MIME Protocol
            </FieldLabel>
            <Input readOnly value={asset.mimeType} />
          </Field>
        </FieldSet>
      </SheetContent>
    </Sheet>
  );
}
