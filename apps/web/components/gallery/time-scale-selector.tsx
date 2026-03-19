"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeScale } from "@/hooks/use-grouped-media";

interface TimeScaleSelectorProps {
  value: TimeScale;
  onChange: (value: TimeScale) => void;
}

export function TimeScaleSelector({ value, onChange }: TimeScaleSelectorProps) {
  const scales: TimeScale[] = ["day", "week", "month", "year"];

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeScale)}>
      <TabsList className="h-auto bg-muted/40 p-1 backdrop-blur-md border border-border/50 rounded-xl shadow-sm">
        {scales.map((scale) => (
          <TabsTrigger
            key={scale}
            value={scale}
            className="text-[10px] uppercase font-bold px-5 py-2 tracking-widest rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md"
          >
            {scale}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
