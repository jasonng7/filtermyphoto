import * as exifr from 'exifr';

export interface ExtractedPhoto {
  filename: string;
  previewBlob: Blob;
  previewUrl: string;
  metadata?: {
    make?: string;
    model?: string;
    dateTime?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: number;
    focalLength?: number;
  };
}

export async function extractPreviewFromARW(file: File): Promise<ExtractedPhoto> {
  try {
    // Extract the embedded JPEG preview from the ARW file
    const preview = await exifr.thumbnailUrl(file);
    
    if (!preview) {
      throw new Error('No embedded preview found in ARW file');
    }

    // Fetch the blob from the object URL
    const response = await fetch(preview);
    const previewBlob = await response.blob();

    // Extract metadata
    const metadata = await exifr.parse(file, {
      pick: ['Make', 'Model', 'DateTimeOriginal', 'ISO', 'FNumber', 'ExposureTime', 'FocalLength']
    });

    return {
      filename: file.name,
      previewBlob,
      previewUrl: preview,
      metadata: metadata ? {
        make: metadata.Make,
        model: metadata.Model,
        dateTime: metadata.DateTimeOriginal?.toISOString?.() || metadata.DateTimeOriginal,
        iso: metadata.ISO,
        fNumber: metadata.FNumber,
        exposureTime: metadata.ExposureTime,
        focalLength: metadata.FocalLength,
      } : undefined,
    };
  } catch (error) {
    console.error(`Failed to extract preview from ${file.name}:`, error);
    throw error;
  }
}

export async function extractBatchPreviews(
  files: File[],
  onProgress: (current: number, total: number, filename: string) => void
): Promise<ExtractedPhoto[]> {
  const results: ExtractedPhoto[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(i + 1, files.length, file.name);
    
    try {
      const extracted = await extractPreviewFromARW(file);
      results.push(extracted);
    } catch (error) {
      console.error(`Skipping ${file.name} due to extraction error`);
    }
  }
  
  return results;
}
