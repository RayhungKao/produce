import { useRef, useEffect, useState } from "react";
import styles from "./index.module.scss";

export default function CanvasPreview({
  originalImage,
  convertedBlob,
  settings,
}) {
  const canvasRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showConverted, setShowConverted] = useState(false);
  const [convertedDimensions, setConvertedDimensions] = useState(null);

  // Draw original image on canvas when it changes
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas to original image dimensions
    // CSS will handle the display scaling with object-fit
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image at full size
    ctx.drawImage(originalImage, 0, 0);
  }, [originalImage]);

  // Create preview URL for converted image and get actual dimensions
  useEffect(() => {
    if (convertedBlob) {
      const url = URL.createObjectURL(convertedBlob);
      setPreviewUrl(url);

      // Load the converted image to get actual dimensions
      const img = new Image();
      img.onload = () => {
        setConvertedDimensions({ width: img.width, height: img.height });
        // Auto-switch to converted tab when conversion is complete
        setShowConverted(true);
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setShowConverted(false);
      setConvertedDimensions(null);
    }
  }, [convertedBlob]);

  if (!originalImage) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🖼️</div>
        <p className={styles.emptyText}>Upload an image to see preview</p>
        <p className={styles.emptyHint}>
          The Canvas API will render your image here
        </p>
      </div>
    );
  }

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>Preview</h3>
        {convertedBlob && (
          <div className={styles.toggleContainer}>
            <button
              className={`${styles.toggleButton} ${!showConverted ? styles.active : ""}`}
              onClick={() => setShowConverted(false)}
            >
              Original
            </button>
            <button
              className={`${styles.toggleButton} ${showConverted ? styles.active : ""}`}
              onClick={() => setShowConverted(true)}
            >
              Converted
            </button>
          </div>
        )}
      </div>

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${showConverted ? styles.hidden : ""}`}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Converted preview"
            className={`${styles.convertedImage} ${!showConverted ? styles.hidden : ""}`}
          />
        )}
      </div>

      <div className={styles.dimensions}>
        <span>
          Original: {originalImage.width} × {originalImage.height}px
        </span>
        {convertedDimensions && (
          <span>
            Converted: {convertedDimensions.width} ×{" "}
            {convertedDimensions.height}px
          </span>
        )}
      </div>

      <div className={styles.techNote}>
        <strong>📖 Canvas API:</strong> The image is rendered using{" "}
        <code>canvas.getContext(&apos;2d&apos;)</code> and{" "}
        <code>ctx.drawImage()</code>. This decodes the image pixels and allows
        us to manipulate or export them in different formats.
      </div>
    </div>
  );
}
