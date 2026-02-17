/**
 * Image Conversion Utilities
 *
 * This module provides utilities for browser-based image conversion.
 * All processing happens client-side using native browser APIs.
 */

// File signatures (header bytes) for image format detection
// These are the first few bytes of a file that identify its true format
const FILE_SIGNATURES = {
  // JPEG: Starts with FF D8 FF
  jpeg: {
    signature: [0xff, 0xd8, 0xff],
    mimeType: "image/jpeg",
    name: "JPEG",
  },
  // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A (‰PNG....)
  png: {
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    mimeType: "image/png",
    name: "PNG",
  },
  // GIF: Starts with "GIF87a" or "GIF89a"
  gif87a: {
    signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    mimeType: "image/gif",
    name: "GIF",
  },
  gif89a: {
    signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    mimeType: "image/gif",
    name: "GIF",
  },
  // WebP: Starts with "RIFF" followed by file size, then "WEBP"
  webp: {
    signature: [0x52, 0x49, 0x46, 0x46], // "RIFF" - need additional check for "WEBP"
    mimeType: "image/webp",
    name: "WebP",
    additionalCheck: (bytes) => {
      // Check for "WEBP" at bytes 8-11
      return (
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    },
  },
  // BMP: Starts with "BM"
  bmp: {
    signature: [0x42, 0x4d],
    mimeType: "image/bmp",
    name: "BMP",
  },
  // ICO: Starts with 00 00 01 00
  ico: {
    signature: [0x00, 0x00, 0x01, 0x00],
    mimeType: "image/x-icon",
    name: "ICO",
  },
  // AVIF: Starts with specific ftyp box
  avif: {
    signature: [0x00, 0x00, 0x00], // Variable, need additional check
    mimeType: "image/avif",
    name: "AVIF",
    additionalCheck: (bytes) => {
      // Check for "ftyp" at bytes 4-7 and "avif" somewhere after
      const str = String.fromCharCode(...bytes.slice(4, 12));
      return str.includes("ftyp") && str.includes("avif");
    },
  },
};

// Supported input formats (what browsers can read)
const INPUT_FORMATS = [
  { name: "JPEG", extensions: [".jpg", ".jpeg"], mimeType: "image/jpeg" },
  { name: "PNG", extensions: [".png"], mimeType: "image/png" },
  { name: "WebP", extensions: [".webp"], mimeType: "image/webp" },
  { name: "GIF", extensions: [".gif"], mimeType: "image/gif" },
  { name: "BMP", extensions: [".bmp"], mimeType: "image/bmp" },
  { name: "SVG", extensions: [".svg"], mimeType: "image/svg+xml" },
  { name: "ICO", extensions: [".ico"], mimeType: "image/x-icon" },
  { name: "AVIF", extensions: [".avif"], mimeType: "image/avif" },
];

// Output formats (what canvas.toBlob supports)
const OUTPUT_FORMATS = [
  { name: "JPEG", mimeType: "image/jpeg", supportsQuality: true },
  { name: "PNG", mimeType: "image/png", supportsQuality: false },
  { name: "WebP", mimeType: "image/webp", supportsQuality: true },
];

/**
 * Detect which output formats the current browser supports
 * Uses canvas.toDataURL to test format support
 *
 * @returns {Array} List of supported output formats
 */
export function getSupportedFormats() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 1, 1);

  return OUTPUT_FORMATS.filter((format) => {
    try {
      const dataUrl = canvas.toDataURL(format.mimeType);
      // If the browser doesn't support the format, it returns a PNG
      return dataUrl.startsWith(`data:${format.mimeType}`);
    } catch {
      return false;
    }
  });
}

/**
 * Get accepted input file types for the file input
 *
 * @returns {string} Comma-separated list of accepted extensions
 */
export function getAcceptedInputTypes() {
  return INPUT_FORMATS.flatMap((f) => f.extensions).join(",");
}

/**
 * Detect actual file type by reading file signature (header bytes)
 * This is more reliable than checking file.type which is based on extension
 *
 * @param {File} file - The file to analyze
 * @returns {Promise<Object>} { mimeType: string, name: string } or null if unknown
 */
export async function detectActualFileType(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target.result);

      // Check each known format
      for (const [key, format] of Object.entries(FILE_SIGNATURES)) {
        const { signature, mimeType, name, additionalCheck } = format;

        // Check if the file starts with this signature
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            matches = false;
            break;
          }
        }

        // If basic signature matches, check additional validation if required
        if (matches) {
          if (additionalCheck) {
            if (additionalCheck(bytes)) {
              resolve({ mimeType, name, detectedFrom: "file-signature" });
              return;
            }
          } else {
            resolve({ mimeType, name, detectedFrom: "file-signature" });
            return;
          }
        }
      }

      // SVG detection (text-based, check for <?xml or <svg)
      const textStart = String.fromCharCode(...bytes.slice(0, 100));
      if (
        textStart.includes("<?xml") ||
        textStart.includes("<svg") ||
        textStart.includes("<!DOCTYPE svg")
      ) {
        resolve({
          mimeType: "image/svg+xml",
          name: "SVG",
          detectedFrom: "file-signature",
        });
        return;
      }

      // Unknown format - return null
      resolve(null);
    };

    reader.onerror = () => resolve(null);

    // Read first 100 bytes for signature detection
    reader.readAsArrayBuffer(file.slice(0, 100));
  });
}

/**
 * Validate an uploaded file (basic validation - synchronous)
 *
 * @param {File} file - The file to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFile(file) {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file selected" };
  }

  // Check file size (max 50MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 50MB limit" };
  }

  // Check file type
  const validTypes = INPUT_FORMATS.map((f) => f.mimeType);
  if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "Invalid file type. Please upload an image.",
    };
  }

  return { valid: true };
}

/**
 * Validate file with deep content inspection using file signature
 * This detects the actual file format regardless of extension or MIME type
 *
 * @param {File} file - The file to validate
 * @returns {Promise<Object>} {
 *   valid: boolean,
 *   error?: string,
 *   warning?: string,
 *   actualType?: { mimeType: string, name: string },
 *   claimedType?: { mimeType: string, name: string }
 * }
 */
export async function validateFileWithSignature(file) {
  // First run basic validation
  const basicResult = validateFile(file);
  if (!basicResult.valid) {
    return basicResult;
  }

  // Detect actual file type from file signature
  const actualType = await detectActualFileType(file);

  // Get the claimed type from file extension/MIME
  const claimedMime = file.type;
  const claimedFormat = INPUT_FORMATS.find((f) => f.mimeType === claimedMime);

  // If we couldn't detect the actual type
  if (!actualType) {
    // If it claims to be an image type, we'll allow it but warn
    if (claimedMime.startsWith("image/")) {
      return {
        valid: true,
        warning: `Unable to verify file format. Proceeding based on extension (${
          claimedFormat?.name || claimedMime
        })`,
        claimedType: claimedFormat
          ? { mimeType: claimedMime, name: claimedFormat.name }
          : null,
      };
    }
    return {
      valid: false,
      error: "Unrecognized file format. Please upload a valid image.",
    };
  }

  // Check if actual type matches claimed type
  const typeMismatch = claimedMime && actualType.mimeType !== claimedMime;

  if (typeMismatch) {
    const claimedName = claimedFormat?.name || claimedMime;
    return {
      valid: true, // Still valid, but with a warning
      warning: `File extension suggests ${claimedName}, but actual content is ${actualType.name}. Using detected format.`,
      actualType,
      claimedType: { mimeType: claimedMime, name: claimedName },
      correctedType: actualType,
    };
  }

  return {
    valid: true,
    actualType,
    claimedType: claimedFormat
      ? { mimeType: claimedMime, name: claimedFormat.name }
      : null,
  };
}

/**
 * Convert an image to a different format using Canvas API
 *
 * TECHNICAL FLOW:
 * 1. Create a canvas element with target dimensions
 * 2. Draw the source image onto the canvas (this decodes the image)
 * 3. Export the canvas as a Blob in the target format
 *
 * @param {HTMLImageElement} image - Source image element
 * @param {Object} settings - Conversion settings
 * @param {string} settings.format - Target MIME type (e.g., 'image/jpeg')
 * @param {number} settings.quality - Quality 0-1 (for JPEG/WebP)
 * @param {number} settings.width - Target width in pixels
 * @param {number} settings.height - Target height in pixels
 * @returns {Promise<Blob>} Converted image as a Blob
 */
export async function convertImage(image, settings) {
  const { format, quality, width, height } = settings;

  const targetWidth = width || image.width;
  const targetHeight = height || image.height;

  // Check for excessive dimensions (browsers have canvas size limits)
  // Most browsers limit canvas to ~16384px or ~268 million pixels total
  const MAX_DIMENSION = 16384;
  const MAX_PIXELS = 268435456; // 16384 * 16384
  const totalPixels = targetWidth * targetHeight;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    throw new Error(
      `Dimensions too large. Maximum is ${MAX_DIMENSION}px per side. ` +
        `Try reducing output dimensions.`,
    );
  }

  if (totalPixels > MAX_PIXELS) {
    throw new Error(
      `Total pixels (${(totalPixels / 1000000).toFixed(1)}M) exceeds browser limit. ` +
        `Try reducing output dimensions.`,
    );
  }

  // Create canvas with target dimensions
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Get 2D rendering context
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Failed to get canvas context. Browser may be out of memory.",
    );
  }

  // For JPEG, fill with white background (no transparency support)
  if (format === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw the image onto canvas
  // This is where the actual format conversion happens
  try {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    throw new Error(
      "Failed to draw image. The image may be corrupted or tainted by CORS.",
    );
  }

  // Convert canvas to Blob
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                `Failed to encode as ${format}. ` +
                  `Try a different format or reduce dimensions/quality.`,
              ),
            );
          }
        },
        format,
        quality,
      );
    } catch (err) {
      reject(new Error(`Encoding failed: ${err.message}`));
    }
  });
}

/**
 * Create a downloadable URL from a Blob
 * Remember to revoke the URL after use to free memory!
 *
 * @param {Blob} blob - The blob to create URL for
 * @returns {string} Object URL
 */
export function createDownloadUrl(blob) {
  return URL.createObjectURL(blob);
}

/**
 * Format file size for display
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get format info from MIME type
 *
 * @param {string} mimeType - MIME type to look up
 * @returns {Object|undefined} Format info object
 */
export function getFormatInfo(mimeType) {
  return OUTPUT_FORMATS.find((f) => f.mimeType === mimeType);
}
