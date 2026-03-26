import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, useApi } from "@/hooks/use-api";
import { MediaAsset, PaginatedMediaResponse } from "@/types/media";

export function useVaultGallery() {
  const api = useApi();
  // Bring in Clerk's auth state
  const { isLoaded, isSignedIn } = useAuth();

  const [media, setMedia] = useState<MediaAsset[]>([]);
  // Start loading as true so the UI doesn't flash empty while waiting for Clerk
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const fetchLock = useRef(false);

  // We wrap the fetch logic in useCallback, but remove `isLoaded` and `isSignedIn`
  // from its dependencies to prevent recreation. We pass the cursor directly.
  const fetchMedia = useCallback(
    async (cursor?: string | null, isLoadMore = false) => {
      if (fetchLock.current) return;
      fetchLock.current = true;

      if (!isLoadMore) setIsLoading(true);
      else setIsFetchingNextPage(true);

      setError(null);

      try {
        const endpoint = cursor ? `/api/media?cursor=${encodeURIComponent(cursor)}` : "/api/media";

        const res = await api.get<PaginatedMediaResponse>(endpoint);

        setMedia((prev) => (isLoadMore ? [...prev, ...(res.data || [])] : res.data || []));
        setNextCursor(res.nextCursor || null);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          if (!isLoadMore) setMedia([]);
        } else {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
        fetchLock.current = false;
      }
    },
    [api]
  );

  // This is the crucial fix: Watch Clerk's state.
  useEffect(() => {
    // Only attempt the initial fetch if Clerk has finished loading AND the user is signed in.
    if (isLoaded && isSignedIn) {
      fetchMedia();
    } else if (isLoaded && !isSignedIn) {
      // If Clerk loads and there is no user, stop the loading spinner
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, fetchMedia]);

  const loadMore = useCallback(() => {
    if (nextCursor && !isFetchingNextPage) {
      fetchMedia(nextCursor, true);
    }
  }, [nextCursor, isFetchingNextPage, fetchMedia]);

  const hasNextPage = !!nextCursor;

  return {
    media,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    loadMore,
    refetch: () => fetchMedia(),
  };
}
