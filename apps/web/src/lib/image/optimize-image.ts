export const MAX_RAW_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const DEFAULT_MAX_IMAGE_DIMENSION = 1200;
export const DEFAULT_WEBP_QUALITY = 0.82;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface CanvasCompressOptions {
  maxDimension: number;
  quality: number;
}

export type CanvasCompressorFn = (
  file: File,
  options: CanvasCompressOptions
) => Promise<Blob | null>;

export interface OptimizeImageOptions {
  maxSizeBytes?: number;
  maxDimension?: number;
  quality?: number;
  compressWithCanvas?: CanvasCompressorFn;
}

function replaceExtensionWithWebp(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDotIndex = trimmed.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return `${trimmed || "image"}.webp`;
  }
  return `${trimmed.slice(0, lastDotIndex)}.webp`;
}

async function defaultCanvasCompressor(
  file: File,
  { maxDimension, quality }: CanvasCompressOptions
): Promise<Blob | null> {
  if (
    typeof document === "undefined" ||
    typeof Image === "undefined" ||
    (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent))
  ) {
    return null;
  }

  const canvas = document.createElement("canvas");
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!ctx || typeof canvas.toBlob !== "function") {
    return null;
  }

  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageEl = new Image();
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = () =>
        reject(new Error("No se pudo decodificar el archivo de imagen."));
      imageEl.src = objectUrl;
    });

    const sourceWidth = img.naturalWidth || img.width;
    const sourceHeight = img.naturalHeight || img.height;

    if (!sourceWidth || !sourceHeight) {
      return null;
    }

    const scale = Math.min(
      1,
      maxDimension / sourceWidth,
      maxDimension / sourceHeight
    );
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/webp",
        quality
      );
    });
  } finally {
    if (typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const maxSizeBytes = options.maxSizeBytes ?? MAX_RAW_IMAGE_SIZE_BYTES;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_IMAGE_DIMENSION;
  const quality = options.quality ?? DEFAULT_WEBP_QUALITY;
  const compressFn = options.compressWithCanvas ?? defaultCanvasCompressor;

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      "Formato de imagen no válido. Solo se permiten archivos WEBP, JPEG o PNG."
    );
  }

  if (file.size <= 0) {
    throw new Error("El archivo de imagen seleccionado está vacío.");
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(
      `La imagen supera el límite máximo permitido de ${maxMb} MB.`
    );
  }

  const compressedBlob = await compressFn(file, { maxDimension, quality });

  if (!compressedBlob || compressedBlob.size === 0) {
    return file;
  }

  // If the original file was already a smaller WebP, keep the smaller one
  if (file.type === "image/webp" && compressedBlob.size >= file.size) {
    return file;
  }

  const webpName = replaceExtensionWithWebp(file.name);
  return new File([compressedBlob], webpName, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export type UploadMediaFolder = "products" | "combos" | "categories";

export interface UploadOptimizedMediaOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  token: string;
  file: File;
  folder: UploadMediaFolder;
  optimizeOptions?: OptimizeImageOptions;
}

async function parseUploadApiError(
  res: Response,
  fallbackMessage: string
): Promise<Error> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length > 0) {
      return new Error(body.message[0]);
    }
    if (typeof body.message === "string" && body.message.trim()) {
      return new Error(body.message);
    }
  } catch {
    // Ignore JSON parse failure
  }
  return new Error(fallbackMessage);
}

export async function uploadOptimizedMediaToR2({
  baseUrl = "",
  fetchFn = fetch,
  token,
  file,
  folder,
  optimizeOptions,
}: UploadOptimizedMediaOptions): Promise<string> {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const optimizedFile = await optimizeImageForUpload(file, optimizeOptions);

  const urlRes = await fetchFn(`${normalizedBase}/api/v1/media/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: optimizedFile.name,
      contentType: optimizedFile.type || "image/webp",
      folder,
      fileSize: optimizedFile.size,
    }),
  });

  if (!urlRes.ok) {
    throw await parseUploadApiError(
      urlRes,
      "No se pudo obtener la URL de subida a Cloudflare R2."
    );
  }

  const { uploadUrl, publicUrl } = (await urlRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const uploadRes = await fetchFn(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": optimizedFile.type || "image/webp",
    },
    body: optimizedFile,
  });

  if (!uploadRes.ok) {
    throw new Error("No se pudo transferir la imagen a Cloudflare R2.");
  }

  return publicUrl;
}
