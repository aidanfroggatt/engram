import { ApiError, useApi } from "@/hooks/use-api";
import { MediaAsset } from "@/types/media";
import { useCallback, useEffect, useState } from "react";

export function useVaultGallery() {
  // 1. Initialize our custom API client (Handles Auth, URLs, and JSON parsing internally)
  const api = useApi();

  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Wrap the fetcher in useCallback so it maintains referential equality.
  // This allows us to safely expose it to other components to trigger manual reloads.
  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Look how clean this is now. Fully typed, environment-aware, and authenticated.
      const data = await api.get<MediaAsset[]>("/api/media");
      setMedia(data || []);
    } catch (err: unknown) {
      // Gracefully handle the "Empty Vault" 404 state without throwing a red error to the UI
      if (err instanceof ApiError && err.status === 404) {
        setMedia([]);
      } else {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [api]); // Re-create only if the api instance changes

  // 3. Fire on mount
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { media, isLoading, error, refetch: fetchMedia };
}
