import { describe, expect, it, vi } from "vitest";
import {
  MAX_RAW_IMAGE_SIZE_BYTES,
  optimizeImageForUpload,
} from "./optimize-image";

describe("optimizeImageForUpload (TDD)", () => {
  it("rejects files with unsupported MIME types", async () => {
    const invalidFile = new File(["<svg></svg>"], "malicious.svg", {
      type: "image/svg+xml",
    });

    await expect(optimizeImageForUpload(invalidFile)).rejects.toThrow(
      /formato.*webp.*jpeg.*png/i
    );
  });

  it("rejects empty files (0 bytes)", async () => {
    const emptyFile = new File([], "vacio.webp", {
      type: "image/webp",
    });

    await expect(optimizeImageForUpload(emptyFile)).rejects.toThrow(
      /vacío/i
    );
  });

  it("rejects files larger than the 5 MB maximum limit before uploading", async () => {
    const oversizedBytes = new Uint8Array(MAX_RAW_IMAGE_SIZE_BYTES + 1024);
    const oversizedFile = new File([oversizedBytes], "foto-camara-raw.jpg", {
      type: "image/jpeg",
    });

    await expect(optimizeImageForUpload(oversizedFile)).rejects.toThrow(
      /5\s*MB/i
    );
  });

  it("compresses and converts a valid JPEG image to WebP with normalized .webp filename", async () => {
    const rawFile = new File(
      [new Uint8Array(50_000)],
      "Almendras Nonpareil.JPG",
      { type: "image/jpeg" }
    );

    const mockCompressor = vi.fn().mockResolvedValue(
      new Blob([new Uint8Array(12_000)], { type: "image/webp" })
    );

    const result = await optimizeImageForUpload(rawFile, {
      maxDimension: 1200,
      quality: 0.82,
      compressWithCanvas: mockCompressor,
    });

    expect(mockCompressor).toHaveBeenCalledWith(rawFile, {
      maxDimension: 1200,
      quality: 0.82,
    });
    expect(result.name).toBe("Almendras Nonpareil.webp");
    expect(result.type).toBe("image/webp");
    expect(result.size).toBe(12_000);
  });
});
