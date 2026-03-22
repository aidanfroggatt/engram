import { ParsedMediaMetadata } from "@/lib/exif";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type StagedFile = ParsedMediaMetadata & {
  id: string;
  file: File;
  uploadStatus: UploadStatus;
  fileKey?: string;
  errorMessage?: string;
};

export interface GoTicketResponse {
  uploadUrl: string;
  fileKey: string;
}

export interface CommitPayload {
  fileKey: string;
  mimeType: string;
  captureTime: string;
  latitude: number | null;
  longitude: number | null;
}

export interface MediaAsset {
  id: string;
  fileKey: string;
  mimeType: string;
  captureTime: string;
  latitude: number | null;
  longitude: number | null;
  url: string;
}

export interface PaginatedMediaResponse {
  data: MediaAsset[];
  nextCursor: string | null;
}
