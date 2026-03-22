import exifr from "exifr";

export interface ParsedMediaMetadata {
  fileName: string;
  mimeType: string;
  size: number;
  captureTime: Date;
  latitude: number | null;
  longitude: number | null;
}

export async function extractMetadata(file: File): Promise<ParsedMediaMetadata> {
  // 1. Set the default fallback to the OS file creation/modification time
  let captureTime = new Date(file.lastModified);
  let latitude: number | null = null;
  let longitude: number | null = null;

  try {
    // 2. Only attempt EXIF extraction on images (videos require heavy server-side parsing like FFmpeg)
    if (file.type.startsWith("image/")) {
      // Extract general EXIF data (specifically targeting timestamps)
      const exifData = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: false, // We will extract GPS separately for accuracy
      });

      if (exifData) {
        if (exifData.DateTimeOriginal) {
          captureTime = new Date(exifData.DateTimeOriginal);
        } else if (exifData.CreateDate) {
          captureTime = new Date(exifData.CreateDate);
        }
      }

      // 3. Extract GPS coordinate data
      const gpsData = await exifr.gps(file);
      if (gpsData) {
        latitude = gpsData.latitude;
        longitude = gpsData.longitude;
      }
    }
  } catch (error) {
    console.warn(
      `Could not extract EXIF from ${file.name}. Defaulting to file system metadata.`,
      error
    );
  }

  return {
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    captureTime,
    latitude,
    longitude,
  };
}
