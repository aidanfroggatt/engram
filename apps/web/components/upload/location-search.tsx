"use client";

import { Check, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PlaceResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  currentLat?: number | null;
  currentLng?: number | null;
  onLocationSelect: (lat: number | null, lng: number | null) => void;
  disabled?: boolean;
}

export function LocationSearch({
  currentLat,
  currentLng,
  onLocationSelect,
  disabled,
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const hasLocation = currentLat !== undefined && currentLat !== null;

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const searchPlaces = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedQuery
          )}&limit=5`
        );
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Failed to search location:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchPlaces();
  }, [debouncedQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !hasLocation && "text-muted-foreground"
          )}
        >
          <span className="flex items-center truncate text-xs">
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {hasLocation
              ? `${currentLat.toFixed(4)}, ${currentLng?.toFixed(4)}`
              : "Search location..."}
          </span>
          {hasLocation && !disabled && (
            <div
              role="button"
              tabIndex={0}
              className="ml-2 rounded-sm hover:bg-muted p-0.5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLocationSelect(null, null);
              }}
            >
              <X className="h-3 w-3 opacity-50" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        {/* shouldFilter={false} is critical here so cmdk doesn't hide API results */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city, venue, or address..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {isSearching ? (
                <span className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </span>
              ) : query === "" ? (
                "Start typing to search..."
              ) : (
                "No places found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {results.map((place) => (
                <CommandItem
                  key={place.place_id}
                  value={place.display_name}
                  onSelect={() => {
                    onLocationSelect(parseFloat(place.lat), parseFloat(place.lon));
                    setOpen(false);
                    setQuery("");
                  }}
                  className="cursor-pointer"
                >
                  <span className="line-clamp-2 text-xs">{place.display_name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentLat === parseFloat(place.lat) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
