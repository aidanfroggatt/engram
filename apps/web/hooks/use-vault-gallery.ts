import { ApiError, useApi } from "@/hooks/use-api";
import { MediaAsset, PaginatedMediaResponse } from "@/types/media";
import { useCallback, useEffect, useRef, useState } from "react";

export function useVaultGallery() {
  const api = useApi();

  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchLock = useRef(false);

  const fetchMedia = useCallback(
    async (cursor?: string | null, isLoadMore = false) => {
      if (fetchLock.current) return;
      fetchLock.current = true;

      if (!isLoadMore) setIsLoading(true);
      else setIsFetchingNextPage(true);

      setError(null);

      try {
        const endpoint = cursor ? `/api/media?cursor=${encodeURIComponent(cursor)}` : "/api/media";

        // Fetch the paginated response
        const res = await api.get<PaginatedMediaResponse>(endpoint);

        // Extract res.data (which is MediaAsset[]) and append or replace
        setMedia((prev) => (isLoadMore ? [...prev, ...(res.data || [])] : res.data || []));

        // Save the new cursor for the next call
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

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

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
