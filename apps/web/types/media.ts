import { ParsedMediaMetadata } from "@/lib/exif";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type StagedFile = ParsedMediaMetadata & {
  id: string; // Unique ID for React mapping
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
  captureTime: string; // ISO String
  latitude: number | null;
  longitude: number | null;
}

// Represents an asset returned from the Go backend
export interface MediaAsset {
  id: string;
  fileKey: string;
  mimeType: string;
  captureTime: string; // ISO 8601 string from the database
  latitude: number | null;
  longitude: number | null;
  url: string; // Public B2 URL for rendering
}
