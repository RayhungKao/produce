import styles from "./index.module.scss";

const STEPS = [
  {
    title: "Waiting for Input",
    description: "Select an image file to begin the conversion process.",
    api: null,
    code: null,
  },
  {
    title: "Validating File Signature",
    description:
      "Before processing, we read the file's binary signature (first few bytes) to verify its actual format. This prevents issues where a file extension doesn't match the true content.",
    api: "FileReader.readAsArrayBuffer()",
    code: `// File Signature Detection
// Each image format has a unique byte sequence at the start
const FILE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],           // JPEG always starts with these bytes
  png:  [0x89, 0x50, 0x4E, 0x47],     // PNG signature: \x89PNG
  gif:  [0x47, 0x49, 0x46],           // GIF starts with "GIF"
  webp: [0x52, 0x49, 0x46, 0x46],     // WebP: "RIFF" + "WEBP" at byte 8
  bmp:  [0x42, 0x4D],                 // BMP starts with "BM"
};

async function detectFileType(file) {
  // Read first 12 bytes of the file
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Compare against known signatures
  for (const [format, signature] of Object.entries(FILE_SIGNATURES)) {
    const matches = signature.every((byte, i) => bytes[i] === byte);
    if (matches) return format;
  }
  
  return null; // Unknown format
}

// Example: Detect if "photo.jpg" is actually a WebP
const actualType = await detectFileType(file);
if (actualType !== expectedType) {
  console.warn('File extension mismatch! Actual format:', actualType);
}`,
    keyPoints: [
      "File signatures (header bytes) identify the true format",
      "Prevents processing files with misleading extensions",
      "Only reads a few bytes - very fast operation",
      "WebP/AVIF require additional validation at specific offsets",
    ],
  },
  {
    title: "Reading File with FileReader API",
    description:
      "The FileReader API reads the selected file from your device's file system. It converts the binary file data into a format JavaScript can work with.",
    api: "FileReader API",
    code: `// Step 1: Read file as DataURL (base64 encoded string)
const reader = new FileReader();

reader.onload = (event) => {
  // event.target.result contains the base64 DataURL
  // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  const dataUrl = event.target.result;
};

reader.onerror = (error) => {
  console.error('Failed to read file:', error);
};

// Start reading the file
reader.readAsDataURL(file);`,
    keyPoints: [
      "Runs entirely in the browser - no server upload needed",
      "readAsDataURL() returns a base64-encoded string",
      "Alternative: readAsArrayBuffer() for binary processing",
      "Asynchronous operation - must use callbacks or Promises",
    ],
  },
  {
    title: "Decoding Image with Image Element",
    description:
      "The HTML Image element decodes the base64 DataURL into actual image pixel data that can be drawn on a canvas.",
    api: "HTMLImageElement",
    code: `// Step 2: Create Image element and load the DataURL
const img = new Image();

img.onload = () => {
  // Image is now decoded and ready to use
  console.log('Image dimensions:', img.width, 'x', img.height);
  
  // Now we can draw it on a canvas
  drawOnCanvas(img);
};

img.onerror = () => {
  console.error('Failed to decode image');
};

// Set the source to trigger loading
img.src = dataUrl; // The DataURL from FileReader`,
    keyPoints: [
      "Browser automatically detects and decodes the image format",
      "Supports JPEG, PNG, WebP, GIF, BMP, SVG, and more",
      "Asynchronous - image loads in the background",
      "Alternative: createImageBitmap() for better performance",
    ],
  },
  {
    title: "Rendering with Canvas API",
    description:
      "The Canvas API provides a 2D drawing surface where we can manipulate the image. This is where the actual format conversion happens.",
    api: "Canvas API",
    code: `// Step 3: Draw image on canvas for processing
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match desired output dimensions
canvas.width = targetWidth;
canvas.height = targetHeight;

// For JPEG output, fill with white (no transparency support)
if (outputFormat === 'image/jpeg') {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw the image onto the canvas
// This decodes pixels and allows manipulation
ctx.drawImage(
  img,           // Source image
  0, 0,          // Destination x, y
  canvas.width,  // Destination width
  canvas.height  // Destination height
);

// Optional: Apply filters, transformations, etc.
// ctx.filter = 'grayscale(100%)';
// ctx.globalAlpha = 0.5;`,
    keyPoints: [
      "Canvas is a pixel-based drawing surface",
      "drawImage() can resize the image automatically",
      "Can apply filters, rotations, and transformations",
      "Memory usage scales with canvas dimensions",
    ],
  },
  {
    title: "Exporting with canvas.toBlob()",
    description:
      "The toBlob() method converts the canvas pixels into a compressed image file in the desired format. This is where format conversion actually occurs.",
    api: "Blob API + Canvas.toBlob()",
    code: `// Step 4: Export canvas as a Blob in the target format
canvas.toBlob(
  (blob) => {
    if (blob) {
      console.log('Converted successfully!');
      console.log('New size:', blob.size, 'bytes');
      console.log('Type:', blob.type);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      downloadFile(url, 'converted.jpg');
      
      // IMPORTANT: Revoke URL to free memory
      URL.revokeObjectURL(url);
    } else {
      console.error('Conversion failed');
    }
  },
  'image/jpeg',  // Target MIME type
  0.9            // Quality (0.0 to 1.0, for JPEG/WebP)
);

// Supported output formats (browser dependent):
// - 'image/jpeg' - Lossy, no transparency, quality setting
// - 'image/png'  - Lossless, supports transparency
// - 'image/webp' - Modern format, best compression`,
    keyPoints: [
      "Browser's built-in encoder handles compression",
      "Quality parameter only works for JPEG and WebP",
      "PNG is always lossless (quality parameter ignored)",
      "Blob is a raw binary object, efficient for large files",
      "URL.createObjectURL() creates a temporary download URL",
    ],
  },
  {
    title: "Download Complete!",
    description:
      "The converted image has been downloaded to your device. The entire process happened in your browser without any server involvement.",
    api: "URL.createObjectURL()",
    code: `// Step 5: Trigger file download
function downloadFile(blob, filename) {
  // Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary <a> element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename; // Suggested filename
  
  // Programmatically click the link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // IMPORTANT: Free memory by revoking the URL
  URL.revokeObjectURL(url);
}`,
    keyPoints: [
      "URL.createObjectURL() creates a blob: URL",
      "The download attribute suggests a filename",
      "No actual network request is made",
      "Always revoke URLs to prevent memory leaks",
    ],
  },
];

export default function TechExplanation({ currentStep }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔧 How It Works: The Technical Flow</h2>
      <p className={styles.intro}>
        This image converter uses native browser APIs to process images entirely
        on your device. No server uploads, no privacy concerns. Here&apos;s how
        each step works:
      </p>

      <div className={styles.timeline}>
        {STEPS.map((step, index) => (
          <div
            key={index}
            className={`${styles.step} ${
              index === currentStep ? styles.active : ""
            } ${index < currentStep ? styles.completed : ""}`}
          >
            <div className={styles.stepIndicator}>
              <div className={styles.stepNumber}>
                {index < currentStep ? "✓" : index}
              </div>
              {index < STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>

            <div className={styles.stepContent}>
              <h3 className={styles.stepTitle}>
                {step.title}
                {step.api && <span className={styles.apiTag}>{step.api}</span>}
              </h3>
              <p className={styles.stepDescription}>{step.description}</p>

              {step.code && (
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <span>JavaScript</span>
                    <button
                      className={styles.copyButton}
                      onClick={() => navigator.clipboard.writeText(step.code)}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <pre className={styles.code}>{step.code}</pre>
                </div>
              )}

              {step.keyPoints && (
                <div className={styles.keyPoints}>
                  <h4>Key Points:</h4>
                  <ul>
                    {step.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <h3>📊 Browser API Summary</h3>
        <div className={styles.apiTable}>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>File Signature</div>
            <div className={styles.apiRole}>
              Validates actual format via header bytes
            </div>
          </div>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>FileReader</div>
            <div className={styles.apiRole}>
              Reads files from device → DataURL
            </div>
          </div>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>Image</div>
            <div className={styles.apiRole}>Decodes DataURL → Pixel data</div>
          </div>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>Canvas</div>
            <div className={styles.apiRole}>Renders & manipulates pixels</div>
          </div>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>toBlob()</div>
            <div className={styles.apiRole}>Encodes pixels → Target format</div>
          </div>
          <div className={styles.apiRow}>
            <div className={styles.apiName}>Blob/URL</div>
            <div className={styles.apiRole}>Creates downloadable file</div>
          </div>
        </div>
      </div>

      <div className={styles.tryIt}>
        <h3>🚀 Try It Yourself</h3>
        <p>
          Copy the code snippets above and paste them into your browser&apos;s
          Developer Console (F12) to experiment. The complete flow can be
          implemented in under 50 lines of JavaScript!
        </p>
      </div>
    </div>
  );
}
