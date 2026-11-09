/**
 * CRM visit photos (client-side, mock only).
 *
 * A phone photo can be many megabytes, but the Stage 1 CRM keeps everything in
 * localStorage. The upload is therefore resized and re-encoded before it is
 * stored. Stage 2 moves the file to object storage and keeps only a URL.
 *
 * The parser is deliberately strict: only raster data URLs produced here (or a
 * compatible image encoder) are accepted back from storage. SVG is refused.
 */

export const CRM_PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CRM_PHOTO_MAX_SOURCE_BYTES = 12 * 1024 * 1024;
export const CRM_PHOTO_MAX_DATA_URL_LENGTH = 350_000;
export const CRM_PHOTO_MAX_EDGE = 900;

const DATA_PHOTO = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/** True only for a small, raster image data URL stored by this app. */
export function isCrmPhotoDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= CRM_PHOTO_MAX_DATA_URL_LENGTH &&
    DATA_PHOTO.test(value)
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = url;
  });
}

function draw(image: HTMLImageElement, edge: number): HTMLCanvasElement {
  const width = image.naturalWidth || edge;
  const height = image.naturalHeight || edge;
  const scale = Math.min(1, edge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Resize and compress one photo. Throws a friendly message when the file is
 * not an accepted image or cannot be made small enough for browser storage.
 */
export async function compressCrmPhoto(file: File): Promise<string> {
  if (!CRM_PHOTO_ACCEPTED_TYPES.includes(file.type as (typeof CRM_PHOTO_ACCEPTED_TYPES)[number])) {
    throw new Error("Choose a JPG, PNG or WebP photo.");
  }
  if (file.size > CRM_PHOTO_MAX_SOURCE_BYTES) {
    throw new Error("Choose a photo under 12 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    for (const edge of [CRM_PHOTO_MAX_EDGE, 720, 560]) {
      const canvas = draw(image, edge);
      for (const quality of [0.8, 0.68, 0.55]) {
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length <= CRM_PHOTO_MAX_DATA_URL_LENGTH) return dataUrl;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Could not read that image.") {
      throw new Error("Could not read that photo. Try another image.");
    }
    throw error;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  throw new Error("That photo is still too large after resizing. Try a smaller one.");
}
