import styles from "./index.module.scss";

// Data flow diagram showing the transformation pipeline with WHY context
const DATA_FLOW = [
  {
    id: "file",
    label: "File",
    type: "Browser File object",
    description: "Raw binary from input",
  },
  {
    id: "arraybuffer",
    label: "ArrayBuffer",
    type: "Uint8Array",
    description: "Byte-level access",
  },
  {
    id: "dataurl",
    label: "Data URL",
    type: "Base64 string",
    description: "Embeddable format",
  },
  {
    id: "image",
    label: "Image",
    type: "HTMLImageElement",
    description: "Decoded pixels",
  },
  {
    id: "canvas",
    label: "Canvas",
    type: "RGBA bitmap",
    description: "Editable surface",
  },
  {
    id: "blob",
    label: "Blob",
    type: "Binary data",
    description: "Compressed output",
  },
  {
    id: "objecturl",
    label: "Object URL",
    type: "blob:// URL",
    description: "Memory reference",
  },
];

const STEPS = [
  {
    title: "Waiting for Input",
    description: "Select an image file to begin the conversion process.",
    dataFlow: null,
  },
  {
    title: "File Signature Validation",
    why: "File extensions can be easily renamed (photo.exe → photo.jpg). Reading the actual bytes ensures security and prevents processing corrupt or malicious files.",
    api: "FileReader.readAsArrayBuffer()",
    dataFlow: { from: "file", to: "arraybuffer" },
    code: `// WHY ArrayBuffer? Direct byte access without encoding overhead
const buffer = await file.slice(0, 12).arrayBuffer();
const bytes = new Uint8Array(buffer);

// Each format has unique "magic bytes" at the start
const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50; // ‰P`,
    pros: [
      "✅ Fast: Only reads first few bytes, not entire file",
      "✅ Secure: Detects spoofed extensions",
      "✅ Efficient: No encoding overhead (unlike Base64)",
    ],
    cons: ["⚠️ Low-level: Must manually interpret byte patterns"],
  },
  {
    title: "Read File as Data URL",
    why: "The Image element cannot read File objects directly. Data URLs embed the entire file as a Base64 string that can be assigned to img.src.",
    api: "FileReader.readAsDataURL()",
    dataFlow: { from: "file", to: "dataurl" },
    code: `// WHY Data URL? Only way to load local files into <img>
const reader = new FileReader();
reader.onload = (e) => {
  // Result: "data:image/jpeg;base64,/9j/4AAQ..."
  img.src = e.target.result;
};
reader.readAsDataURL(file);`,
    pros: [
      "✅ Self-contained: The string IS the data",
      "✅ Persistent: Works after original File is garbage collected",
      "✅ Serializable: Can store in state, localStorage, send to server",
    ],
    cons: [
      "⚠️ Size: Base64 adds ~33% overhead (10MB file → 13.3MB string)",
      "⚠️ Memory: Entire file duplicated as string",
    ],
    alternative:
      "URL.createObjectURL(file) is faster (instant, no encoding) and uses less memory (just a pointer), but requires manual cleanup with revokeObjectURL() and the URL becomes invalid after page refresh. Best for large files with short display needs.",
  },
  {
    title: "Decode Image",
    why: "The browser's native image decoder handles all format complexity (JPEG compression, PNG filtering, etc.). We get clean pixel data without implementing decoders ourselves.",
    api: "HTMLImageElement",
    dataFlow: { from: "dataurl", to: "image" },
    code: `// WHY Image element? Browser handles ALL format decoding
const img = new Image();
img.onload = () => {
  // Browser decoded JPEG/PNG/WebP → raw pixels
  console.log(\`Ready: \${img.width}x\${img.height}\`);
};
img.src = dataUrl;`,
    pros: [
      "✅ Zero code: Browser handles JPEG, PNG, WebP, GIF, BMP, SVG, AVIF",
      "✅ Hardware accelerated: GPU-assisted decoding",
      "✅ Error handling: Built-in onerror callback",
    ],
    cons: [
      "⚠️ Async: Must wait for onload event",
      "⚠️ CORS: Cross-origin images may be tainted",
    ],
  },
  {
    title: "Draw to Canvas",
    why: "Canvas is the ONLY browser API that lets us access raw pixels. It's the bridge between decoded images and re-encoded output. Also enables resizing, cropping, and filters.",
    api: "Canvas API",
    dataFlow: { from: "image", to: "canvas" },
    code: `// WHY Canvas? Only way to access/modify pixels in browser
const canvas = document.createElement('canvas');
canvas.width = targetWidth;   // Resize here!
canvas.height = targetHeight;

const ctx = canvas.getContext('2d');

// JPEG doesn't support transparency - fill white first
if (format === 'image/jpeg') {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw with automatic resize interpolation
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);`,
    pros: [
      "✅ Powerful: Resize, crop, rotate, filter in one step",
      "✅ Fast: Hardware-accelerated rendering",
      "✅ Flexible: Can combine multiple images",
    ],
    cons: [
      "⚠️ Memory: Uncompressed RGBA = 4 bytes/pixel (4000×3000 = 48MB!)",
      "⚠️ Limits: Browsers cap canvas at ~16384px or ~268M pixels",
    ],
  },
  {
    title: "Export to Blob",
    why: "toBlob() re-encodes raw canvas pixels into compressed formats. This is where format conversion actually happens - the browser's encoder compresses to JPEG/PNG/WebP.",
    api: "canvas.toBlob()",
    dataFlow: { from: "canvas", to: "blob" },
    code: `// WHY Blob? Efficient binary storage (not Base64 string)
canvas.toBlob(
  (blob) => {
    // blob.size = compressed file size in bytes
    // blob.type = 'image/jpeg'
  },
  'image/jpeg',  // Target format
  0.85           // Quality: 0.0 (tiny) to 1.0 (best)
);

// PNG ignores quality - always lossless
// WebP: best compression + quality control`,
    pros: [
      "✅ Efficient: Binary data, not bloated Base64",
      "✅ Quality control: Fine-tune JPEG/WebP compression",
      "✅ Native: Browser's optimized encoders",
    ],
    cons: [
      "⚠️ Limited formats: Only JPEG, PNG, WebP (browser-dependent)",
      "⚠️ Async: Uses callback, not return value",
    ],
  },
  {
    title: "Download",
    why: "Object URLs create a temporary pointer to in-memory Blob data. This avoids re-encoding to Base64 and enables efficient downloads of large files.",
    api: "URL.createObjectURL()",
    dataFlow: { from: "blob", to: "objecturl" },
    code: `// WHY Object URL? Memory-efficient reference to Blob
const url = URL.createObjectURL(blob);
// Returns: "blob:http://localhost:3000/a1b2c3d4..."

const a = document.createElement('a');
a.href = url;
a.download = 'converted.jpg';  // Suggested filename
a.click();

// CRITICAL: Free memory when done!
URL.revokeObjectURL(url);`,
    pros: [
      "✅ Efficient: No Base64 conversion needed",
      "✅ Fast: Direct memory reference",
      "✅ Large files: Works with any size",
    ],
    cons: [
      "⚠️ Memory leak risk: MUST call revokeObjectURL()",
      "⚠️ Temporary: Invalid after revoke or page unload",
    ],
  },
];

export default function TechExplanation({ currentStep }) {
  // Find active transformation in the data flow
  const activeStep = STEPS[currentStep];
  const activeFromId = activeStep?.dataFlow?.from;
  const activeToId = activeStep?.dataFlow?.to;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔧 How It Works</h2>
      <p className={styles.intro}>
        All processing happens in your browser using native APIs. No server
        uploads.
      </p>

      {/* Visual Data Flow Diagram */}
      <div className={styles.dataFlowSection}>
        <h3 className={styles.sectionTitle}>📊 Data Transformation Pipeline</h3>
        <div className={styles.dataFlow}>
          {DATA_FLOW.map((node, index) => {
            const isActive = node.id === activeFromId || node.id === activeToId;
            const isCompleted =
              DATA_FLOW.findIndex((n) => n.id === activeFromId) > index ||
              (currentStep === STEPS.length - 1 && index < DATA_FLOW.length);
            const isSource = node.id === activeFromId;
            const isTarget = node.id === activeToId;

            return (
              <div key={node.id} className={styles.flowItem}>
                <div
                  className={`${styles.flowNode} ${isActive ? styles.flowNodeActive : ""} ${isCompleted ? styles.flowNodeCompleted : ""} ${isSource ? styles.flowNodeSource : ""} ${isTarget ? styles.flowNodeTarget : ""}`}
                >
                  <div className={styles.flowLabel}>{node.label}</div>
                  <div className={styles.flowType}>{node.type}</div>
                  <div className={styles.flowDesc}>{node.description}</div>
                </div>
                {index < DATA_FLOW.length - 1 && (
                  <div
                    className={`${styles.flowArrow} ${isSource ? styles.flowArrowActive : ""} ${isCompleted ? styles.flowArrowCompleted : ""}`}
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.flowLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot + " " + styles.legendSource}
            ></span>
            Source
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot + " " + styles.legendTarget}
            ></span>
            Target
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot + " " + styles.legendCompleted}
            ></span>
            Completed
          </span>
        </div>
      </div>

      {/* Step-by-step breakdown */}
      <div className={styles.timeline}>
        {STEPS.map((step, index) => (
          <div
            key={index}
            className={`${styles.step} ${index === currentStep ? styles.active : ""} ${index < currentStep ? styles.completed : ""}`}
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

              {step.why && (
                <div className={styles.whyBox}>
                  <span className={styles.whyLabel}>Why?</span>
                  <p className={styles.whyText}>{step.why}</p>
                </div>
              )}

              {step.dataFlow && (
                <div className={styles.transformBadge}>
                  <span className={styles.transformFrom}>
                    {DATA_FLOW.find((d) => d.id === step.dataFlow.from)?.label}
                  </span>
                  <span className={styles.transformArrow}>→</span>
                  <span className={styles.transformTo}>
                    {DATA_FLOW.find((d) => d.id === step.dataFlow.to)?.label}
                  </span>
                </div>
              )}

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

              {(step.pros || step.cons) && (
                <div className={styles.prosConsContainer}>
                  {step.pros && (
                    <div className={styles.prosBox}>
                      <h4>Advantages</h4>
                      <ul>
                        {step.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.cons && (
                    <div className={styles.consBox}>
                      <h4>Trade-offs</h4>
                      <ul>
                        {step.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {step.alternative && (
                <div className={styles.alternativeNote}>
                  💡 {step.alternative}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reference Table */}
      <div className={styles.summary}>
        <h3>📋 Data Structure Comparison</h3>
        <table className={styles.referenceTable}>
          <thead>
            <tr>
              <th>Structure</th>
              <th>Why Use It?</th>
              <th>Trade-off</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>File</code>
              </td>
              <td>Browser&apos;s native file handle from input</td>
              <td>Can&apos;t read content directly</td>
            </tr>
            <tr>
              <td>
                <code>ArrayBuffer</code>
              </td>
              <td>Direct byte access for validation</td>
              <td>Low-level, manual parsing</td>
            </tr>
            <tr>
              <td>
                <code>Data URL</code>
              </td>
              <td>Only way to load File into Image</td>
              <td>+33% size from Base64</td>
            </tr>
            <tr>
              <td>
                <code>Image</code>
              </td>
              <td>Browser decodes all formats for free</td>
              <td>Async, CORS restrictions</td>
            </tr>
            <tr>
              <td>
                <code>Canvas</code>
              </td>
              <td>Only API for pixel manipulation</td>
              <td>High memory (4 bytes/pixel)</td>
            </tr>
            <tr>
              <td>
                <code>Blob</code>
              </td>
              <td>Efficient binary storage</td>
              <td>Limited export formats</td>
            </tr>
            <tr>
              <td>
                <code>Object URL</code>
              </td>
              <td>Fast memory reference for download</td>
              <td>Must revoke to free memory</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Key Insight */}
      <div className={styles.keyInsight}>
        <h3>🎯 Key Insight</h3>
        <p>
          Each transformation exists because{" "}
          <strong>browsers don&apos;t provide a direct path</strong> from File
          to downloadable output. We must traverse: File → decode → raw pixels →
          re-encode → download. Understanding these steps helps you optimize for
          speed (skip unnecessary conversions) or memory (process in chunks).
        </p>
      </div>
    </div>
  );
}
