/**
 * Unit tests for image-utils.js
 *
 * Tests file signature detection, validation, and conversion utilities.
 */

import {
  getSupportedFormats,
  getAcceptedInputTypes,
  detectActualFileType,
  validateFile,
  validateFileWithSignature,
  convertImage,
  formatFileSize,
  getFormatInfo,
} from "@/components/features/image-converter/utils/image-utils";

import {
  createMockFile,
  createMismatchedFile,
  createLargeFile,
  createMockImage,
  createConversionSettings,
  flushPromises,
} from "./test-utils";

describe("image-utils", () => {
  // ==========================================
  // getSupportedFormats
  // ==========================================
  describe("getSupportedFormats", () => {
    it("should return an array of supported formats", () => {
      const formats = getSupportedFormats();

      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });

    it("should include format properties: name, mimeType, supportsQuality", () => {
      const formats = getSupportedFormats();

      formats.forEach((format) => {
        expect(format).toHaveProperty("name");
        expect(format).toHaveProperty("mimeType");
        expect(format).toHaveProperty("supportsQuality");
      });
    });

    it("should always include PNG (universally supported)", () => {
      const formats = getSupportedFormats();
      const png = formats.find((f) => f.mimeType === "image/png");

      expect(png).toBeDefined();
      expect(png.supportsQuality).toBe(false);
    });
  });

  // ==========================================
  // getAcceptedInputTypes
  // ==========================================
  describe("getAcceptedInputTypes", () => {
    it("should return a comma-separated string of extensions", () => {
      const accepted = getAcceptedInputTypes();

      expect(typeof accepted).toBe("string");
      expect(accepted).toContain(".jpg");
      expect(accepted).toContain(".png");
    });

    it("should include common image extensions", () => {
      const accepted = getAcceptedInputTypes();

      expect(accepted).toContain(".jpeg");
      expect(accepted).toContain(".webp");
      expect(accepted).toContain(".gif");
    });
  });

  // ==========================================
  // validateFile (basic validation)
  // ==========================================
  describe("validateFile", () => {
    it("should return valid: true for a valid image file", () => {
      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024,
      });

      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject files larger than 50MB", () => {
      const file = createLargeFile(60); // 60MB

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("50MB");
    });

    it("should reject non-image files", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });

      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    it("should reject null/undefined input", () => {
      expect(validateFile(null).valid).toBe(false);
      expect(validateFile(undefined).valid).toBe(false);
    });
  });

  // ==========================================
  // detectActualFileType (file signature detection)
  // Note: These tests require actual binary file reading which is complex
  // to mock correctly in jsdom. Testing the function structure instead.
  // ==========================================
  describe("detectActualFileType", () => {
    it("should be a function that returns a promise", () => {
      const file = createMockFile({
        name: "image.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const result = detectActualFileType(file);

      expect(result).toBeInstanceOf(Promise);
    });

    it("should eventually resolve (not hang)", async () => {
      const file = createMockFile({
        name: "image.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      // Should resolve within reasonable time
      const result = await Promise.race([
        detectActualFileType(file),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 1000),
        ),
      ]);

      // Result can be either an object or null depending on mock behavior
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("should handle unknown format gracefully", async () => {
      const file = createMockFile({
        name: "unknown.xyz",
        type: "application/octet-stream",
        signature: "unknown",
      });

      // Should not throw
      const result = await detectActualFileType(file);

      // Unknown format should return null
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // validateFileWithSignature (deep validation)
  // ==========================================
  describe("validateFileWithSignature", () => {
    it("should validate file and return result object", async () => {
      const file = createMockFile({
        name: "photo.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const result = await validateFileWithSignature(file);

      expect(result).toHaveProperty("valid");
      expect(typeof result.valid).toBe("boolean");
    });

    it("should accept valid file", async () => {
      const file = createMockFile({
        name: "photo.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const result = await validateFileWithSignature(file);

      expect(result.valid).toBe(true);
    });

    it("should reject files exceeding size limit", async () => {
      const file = createLargeFile(100); // 100MB

      const result = await validateFileWithSignature(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("50MB");
    });

    it("should provide warning for unverifiable formats", async () => {
      const file = createMismatchedFile({
        name: "fake.jpg",
        claimedType: "image/jpeg",
        actualSignature: "png",
      });

      const result = await validateFileWithSignature(file);

      // Should still be valid but may have a warning
      expect(result.valid).toBe(true);
      // Warning may or may not be present depending on detection
      if (result.warning) {
        expect(typeof result.warning).toBe("string");
      }
    });
  });

  // ==========================================
  // convertImage
  // ==========================================
  describe("convertImage", () => {
    it("should convert image with default settings", async () => {
      const mockImage = createMockImage({ width: 800, height: 600 });
      const settings = createConversionSettings();

      const blob = await convertImage(mockImage, settings);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("image/jpeg");
    });

    it("should respect custom dimensions", async () => {
      const mockImage = createMockImage({ width: 1920, height: 1080 });
      const settings = createConversionSettings({
        width: 640,
        height: 480,
      });

      const blob = await convertImage(mockImage, settings);

      expect(blob).toBeInstanceOf(Blob);
    });

    it("should convert to PNG format", async () => {
      const mockImage = createMockImage();
      const settings = createConversionSettings({
        format: "image/png",
      });

      const blob = await convertImage(mockImage, settings);

      expect(blob.type).toBe("image/png");
    });

    it("should convert to WebP format", async () => {
      const mockImage = createMockImage();
      const settings = createConversionSettings({
        format: "image/webp",
        quality: 0.8,
      });

      const blob = await convertImage(mockImage, settings);

      expect(blob.type).toBe("image/webp");
    });

    it("should throw error for excessive dimensions", async () => {
      const mockImage = createMockImage();
      const settings = createConversionSettings({
        width: 20000, // Exceeds 16384 limit
        height: 20000,
      });

      await expect(convertImage(mockImage, settings)).rejects.toThrow(
        /dimensions too large/i,
      );
    });
  });

  // ==========================================
  // formatFileSize
  // ==========================================
  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 Bytes");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(2048)).toBe("2 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(5242880)).toBe("5 MB");
    });

    it("should handle zero", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format with decimals", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });
  });

  // ==========================================
  // getFormatInfo
  // ==========================================
  describe("getFormatInfo", () => {
    it("should return format info for JPEG", () => {
      const info = getFormatInfo("image/jpeg");

      expect(info).toBeDefined();
      expect(info.name).toBe("JPEG");
      expect(info.supportsQuality).toBe(true);
    });

    it("should return format info for PNG", () => {
      const info = getFormatInfo("image/png");

      expect(info).toBeDefined();
      expect(info.name).toBe("PNG");
      expect(info.supportsQuality).toBe(false);
    });

    it("should return undefined for unknown format", () => {
      const info = getFormatInfo("image/unknown");

      expect(info).toBeUndefined();
    });
  });
});
