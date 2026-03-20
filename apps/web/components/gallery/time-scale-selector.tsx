"use client";

import { TimeScale } from "@/hooks/use-grouped-media";

interface TimeScaleSelectorProps {
  value: TimeScale;
  onChange: (value: TimeScale) => void;
}

export function TimeScaleSelector({ value, onChange }: TimeScaleSelectorProps) {
  const scales: TimeScale[] = ["day", "week", "month", "year"];

  return (
    <div className="inline-flex h-auto bg-muted/40 p-1 backdrop-blur-md border border-border/50 rounded-xl shadow-sm">
      {scales.map((scale) => {
        const isActive = value === scale;

        return (
          <button
            key={scale}
            onClick={() => onChange(scale)}
            className={`text-[10px] uppercase font-bold px-5 py-2 tracking-widest rounded-lg transition-all ${
              isActive
                ? "bg-background text-foreground shadow-md" // Active State
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground" // Inactive State
            }`}
          >
            {scale}
          </button>
        );
      })}
    </div>
  );
}
