import { MediaAsset } from "@/types/media";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useVaultGallery() {
  const { getToken } = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token missing.");

        const res = await fetch("http://localhost:8080/api/media", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setMedia([]);
            return;
          }
          throw new Error(`Failed to fetch gallery: ${res.status}`);
        }

        const data = await res.json();
        setMedia(data || []);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMedia();
  }, [getToken]);

  return { media, isLoading, error };
}
