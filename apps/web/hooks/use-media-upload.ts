import { ApiError, useApi } from "@/hooks/use-api";
import { CommitPayload, GoTicketResponse, StagedFile } from "@/types/media";

interface UploadResult {
  success: boolean;
  fileKey?: string;
  error?: string;
}

export function useMediaUpload() {
  const api = useApi();

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred during upload.";
  };

  const uploadFile = async (stagedFile: StagedFile): Promise<UploadResult> => {
    try {
      // 1. Get B2 Ticket
      // Generics <ReturnType, BodyType> enforce strict typing automatically
      const ticket = await api.post<GoTicketResponse, { filename: string; mimeType: string }>(
        "/api/upload/url",
        {
          filename: stagedFile.fileName,
          mimeType: stagedFile.mimeType,
        }
      );

      // 2. Stream Binary to B2
      // We use api.raw() because B2 requires a direct binary stream, not a JSON payload.
      // The hook recognizes the absolute URL and safely omits the Clerk token.
      await api.raw(ticket.uploadUrl, {
        method: "PUT",
        body: stagedFile.file,
        headers: { "Content-Type": stagedFile.mimeType },
      });

      // 3. Commit to Neon DB
      const payload: CommitPayload = {
        fileKey: ticket.fileKey,
        mimeType: stagedFile.mimeType,
        captureTime: stagedFile.captureTime.toISOString(),
        latitude: stagedFile.latitude ?? null,
        longitude: stagedFile.longitude ?? null,
      };

      await api.post<void, CommitPayload>("/api/upload/commit", payload);

      return { success: true, fileKey: ticket.fileKey };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return { uploadFile };
}
