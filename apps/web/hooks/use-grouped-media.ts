import { MediaAsset } from "@/types/media";
import {
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { useMemo } from "react";

export type TimeScale = "day" | "week" | "month" | "year";

export function useGroupedMedia(media: MediaAsset[], timeScale: TimeScale) {
  return useMemo(() => {
    if (!media || media.length === 0) return {};

    const groups: Record<string, MediaAsset[]> = {};
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
}
