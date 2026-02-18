// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: "",
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
}));

// Mock canvas.toBlob
HTMLCanvasElement.prototype.toBlob = jest.fn((callback, type, quality) => {
  // Create a mock blob
  const blob = new Blob(["mock-image-data"], { type: type || "image/png" });
  callback(blob);
});

// Mock canvas.toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn((type) => {
  return `data:${type || "image/png"};base64,mockBase64Data`;
});

// Mock FileReader to actually read bytes from the file/blob
class MockFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.result = `data:${file.type || "application/octet-stream"};base64,mockBase64Data`;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsArrayBuffer(blob) {
    // Actually read the blob content if possible
    const realReader = new (
      Object.getPrototypeOf(this).constructor.originalFileReader ||
      ArrayBuffer.constructor
    )();

    // Use blob.arrayBuffer() if available, otherwise use synthetic bytes
    if (typeof blob.arrayBuffer === "function") {
      blob
        .arrayBuffer()
        .then((buffer) => {
          this.result = buffer;
          if (this.onload) this.onload({ target: this });
        })
        .catch(() => {
          // Fallback to mock bytes
          const mockBytes = getMockBytesForType(blob.type || "unknown");
          this.result = mockBytes.buffer;
          if (this.onload) this.onload({ target: this });
        });
    } else {
      setTimeout(() => {
        const mockBytes = getMockBytesForType(blob.type || "unknown");
        this.result = mockBytes.buffer;
        if (this.onload) this.onload({ target: this });
      }, 0);
    }
  }
}

// Helper to generate mock file signatures
function getMockBytesForType(type) {
  const signatures = {
    "image/jpeg": new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]),
    "image/png": new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]),
    "image/gif": new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0,
    ]),
    "image/webp": new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]),
    "image/bmp": new Uint8Array([0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  };
  return signatures[type] || new Uint8Array(12);
}

global.FileReader = MockFileReader;

// Mock Image element
class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this._src = "";
    this.width = 100;
    this.height = 100;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this._src = value;
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}

global.Image = MockImage;

// Suppress console errors during tests (optional)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });
