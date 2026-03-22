import { MediaAsset } from "@/types/media";
import { format } from "date-fns";
import { useMemo } from "react";

export function useAssetMetadata(asset: MediaAsset) {
  return useMemo(() => {
    const filename = asset.fileKey.split("/").pop() || "asset_node";
    const captureDate = new Date(asset.captureTime);

    return {
      filename,
      displayDate: format(captureDate, "yyyy-MM-dd • HH:mm:ss"),
      inputDate: format(captureDate, "yyyy-MM-dd'T'HH:mm"),
      deleteConfirmation: `delete ${filename}`,
    };
  }, [asset]);
}
