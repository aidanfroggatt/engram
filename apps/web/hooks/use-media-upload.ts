import { CommitPayload, GoTicketResponse, StagedFile } from "@/types/media";
import { useAuth } from "@clerk/nextjs";

interface UploadResult {
  success: boolean;
  fileKey?: string;
  error?: string;
}

export function useMediaUpload() {
  const { getToken } = useAuth();

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
  };

  const uploadFile = async (stagedFile: StagedFile): Promise<UploadResult> => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing.");

      // 1. Get B2 Ticket
      const ticketRes = await fetch("http://localhost:8080/api/upload/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: stagedFile.fileName,
          mimeType: stagedFile.mimeType,
        }),
      });

      if (!ticketRes.ok)
        throw new Error(`Ticket generation failed: ${ticketRes.status}`);
      const ticket = (await ticketRes.json()) as GoTicketResponse;

      // 2. Stream to B2
      const b2Res = await fetch(ticket.uploadUrl, {
        method: "PUT",
        body: stagedFile.file,
        headers: { "Content-Type": stagedFile.mimeType },
      });

      if (!b2Res.ok)
        throw new Error(`B2 Storage upload failed: ${b2Res.status}`);

      // 3. Commit to Neon
      const payload: CommitPayload = {
        fileKey: ticket.fileKey,
        mimeType: stagedFile.mimeType,
        captureTime: stagedFile.captureTime.toISOString(),
        latitude: stagedFile.latitude ?? null,
        longitude: stagedFile.longitude ?? null,
      };

      const commitRes = await fetch("http://localhost:8080/api/upload/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!commitRes.ok)
        throw new Error(`Database commit failed: ${commitRes.status}`);

      return { success: true, fileKey: ticket.fileKey };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return { uploadFile };
}
