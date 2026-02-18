/**
 * Test utilities for Image Converter tests
 *
 * These helpers create mock File and Blob objects with proper signatures
 * for testing file validation and conversion without real image files.
 */

// File signature bytes for different image formats
export const FILE_SIGNATURES = {
  jpeg: new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]),
  png: new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]),
  gif: new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
  ]),
  webp: new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]),
  bmp: new Uint8Array([
    0x42, 0x4d, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00,
  ]),
  // Invalid/unknown format
  unknown: new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]),
};

/**
 * Create a mock File object with proper signature bytes
 *
 * @param {Object} options
 * @param {string} options.name - File name (e.g., "test.jpg")
 * @param {string} options.type - MIME type (e.g., "image/jpeg")
 * @param {string} options.signature - Key from FILE_SIGNATURES (e.g., "jpeg")
 * @param {number} options.size - Approximate file size in bytes (default: 1024)
 * @returns {File}
 */
export function createMockFile({
  name = "test.jpg",
  type = "image/jpeg",
  signature = "jpeg",
  size = 1024,
} = {}) {
  const signatureBytes = FILE_SIGNATURES[signature] || FILE_SIGNATURES.unknown;

  // Create padding to reach desired size
  const paddingSize = Math.max(0, size - signatureBytes.length);
  const padding = new Uint8Array(paddingSize);

  // Combine signature + padding
  const content = new Uint8Array(signatureBytes.length + paddingSize);
  content.set(signatureBytes, 0);
  content.set(padding, signatureBytes.length);

  return new File([content], name, { type });
}

/**
 * Create a mock File with mismatched extension and actual format
 * (e.g., a PNG file named "image.jpg")
 *
 * @param {Object} options
 * @param {string} options.name - File name with wrong extension
 * @param {string} options.claimedType - MIME type based on extension
 * @param {string} options.actualSignature - Actual format signature
 * @returns {File}
 */
export function createMismatchedFile({
  name = "fake.jpg",
  claimedType = "image/jpeg",
  actualSignature = "png",
} = {}) {
  const signatureBytes = FILE_SIGNATURES[actualSignature];
  return new File([signatureBytes], name, { type: claimedType });
}

/**
 * Create a File that's too large
 *
 * @param {number} sizeMB - Size in megabytes
 * @returns {File}
 */
export function createLargeFile(sizeMB = 60) {
  const sizeBytes = sizeMB * 1024 * 1024;
  // Don't actually allocate that much memory - mock the size property
  const smallContent = FILE_SIGNATURES.jpeg;
  const file = new File([smallContent], "large.jpg", { type: "image/jpeg" });

  // Override size property
  Object.defineProperty(file, "size", {
    value: sizeBytes,
    writable: false,
  });

  return file;
}

/**
 * Create a mock HTMLImageElement with custom dimensions
 *
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @returns {Object} Mock image object
 */
export function createMockImage({ width = 800, height = 600 } = {}) {
  return {
    width,
    height,
    src: "",
    onload: null,
    onerror: null,
  };
}

/**
 * Create a mock Blob
 *
 * @param {Object} options
 * @param {string} options.type - MIME type
 * @param {number} options.size - Size in bytes
 * @returns {Blob}
 */
export function createMockBlob({ type = "image/jpeg", size = 5000 } = {}) {
  const content = new Uint8Array(size);
  return new Blob([content], { type });
}

/**
 * Wait for async operations to complete
 * Useful for waiting for FileReader callbacks
 */
export function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create conversion settings for testing
 *
 * @param {Object} overrides
 * @returns {Object}
 */
export function createConversionSettings(overrides = {}) {
  return {
    format: "image/jpeg",
    quality: 0.9,
    width: 800,
    height: 600,
    maintainAspectRatio: true,
    ...overrides,
  };
}

/**
 * Mock format support detection results
 */
export const MOCK_SUPPORTED_FORMATS = [
  { name: "JPEG", mimeType: "image/jpeg", supportsQuality: true },
  { name: "PNG", mimeType: "image/png", supportsQuality: false },
  { name: "WebP", mimeType: "image/webp", supportsQuality: true },
];
