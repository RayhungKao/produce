import { useCallback } from "react";
import styles from "./index.module.scss";
import { formatFileSize, getFormatInfo } from "../../utils/image-utils";

export default function ConversionOptions({
  settings,
  onSettingsChange,
  supportedFormats,
  originalWidth,
  originalHeight,
  onConvert,
  onDownload,
  isConverting,
  hasConvertedFile,
  convertedSize,
  originalSize,
}) {
  const handleFormatChange = useCallback(
    (e) => {
      onSettingsChange((prev) => ({
        ...prev,
        format: e.target.value,
      }));
    },
    [onSettingsChange],
  );

  const handleQualityChange = useCallback(
    (e) => {
      onSettingsChange((prev) => ({
        ...prev,
        quality: parseFloat(e.target.value),
      }));
    },
    [onSettingsChange],
  );

  const handleWidthChange = useCallback(
    (e) => {
      const newWidth = parseInt(e.target.value) || originalWidth;
      onSettingsChange((prev) => {
        if (prev.maintainAspectRatio) {
          const ratio = originalHeight / originalWidth;
          return {
            ...prev,
            width: newWidth,
            height: Math.round(newWidth * ratio),
          };
        }
        return { ...prev, width: newWidth };
      });
    },
    [onSettingsChange, originalWidth, originalHeight],
  );

  const handleHeightChange = useCallback(
    (e) => {
      const newHeight = parseInt(e.target.value) || originalHeight;
      onSettingsChange((prev) => {
        if (prev.maintainAspectRatio) {
          const ratio = originalWidth / originalHeight;
          return {
            ...prev,
            height: newHeight,
            width: Math.round(newHeight * ratio),
          };
        }
        return { ...prev, height: newHeight };
      });
    },
    [onSettingsChange, originalWidth, originalHeight],
  );

  const handleAspectRatioToggle = useCallback(
    (e) => {
      onSettingsChange((prev) => ({
        ...prev,
        maintainAspectRatio: e.target.checked,
      }));
    },
    [onSettingsChange],
  );

  const handleResetSize = useCallback(() => {
    onSettingsChange((prev) => ({
      ...prev,
      width: originalWidth,
      height: originalHeight,
    }));
  }, [onSettingsChange, originalWidth, originalHeight]);

  const formatInfo = getFormatInfo(settings.format);
  const showQuality = formatInfo?.supportsQuality;

  const compressionRatio =
    hasConvertedFile && originalSize
      ? (((originalSize - convertedSize) / originalSize) * 100).toFixed(1)
      : null;

  return (
    <div className={styles.optionsContainer}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepNumber}>2</span>
        Conversion Settings
      </h3>

      {/* Format Selection */}
      <div className={styles.optionGroup}>
        <label className={styles.label}>Output Format</label>
        <select
          value={settings.format}
          onChange={handleFormatChange}
          className={styles.select}
        >
          {supportedFormats.map((format) => (
            <option key={format.mimeType} value={format.mimeType}>
              {format.name} ({format.mimeType})
            </option>
          ))}
        </select>
        <p className={styles.hint}>
          {supportedFormats.length} formats supported by your browser
        </p>
      </div>

      {/* Quality Slider */}
      {showQuality && (
        <div className={styles.optionGroup}>
          <label className={styles.label}>
            Quality: {Math.round(settings.quality * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings.quality}
            onChange={handleQualityChange}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>Lower quality / Smaller file</span>
            <span>Higher quality / Larger file</span>
          </div>
        </div>
      )}

      {/* Dimensions */}
      <div className={styles.optionGroup}>
        <label className={styles.label}>Output Dimensions</label>
        <div className={styles.dimensionInputs}>
          <div className={styles.dimensionField}>
            <span>W</span>
            <input
              type="number"
              value={settings.width || ""}
              onChange={handleWidthChange}
              className={styles.dimensionInput}
              min="1"
              max="10000"
            />
            <span>px</span>
          </div>
          <div className={styles.dimensionField}>
            <span>H</span>
            <input
              type="number"
              value={settings.height || ""}
              onChange={handleHeightChange}
              className={styles.dimensionInput}
              min="1"
              max="10000"
            />
            <span>px</span>
          </div>
          <button
            onClick={handleResetSize}
            className={styles.resetSizeButton}
            title="Reset to original size"
          >
            ↺
          </button>
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.maintainAspectRatio}
            onChange={handleAspectRatioToggle}
          />
          <span>Maintain aspect ratio</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={onConvert}
          disabled={isConverting}
          className={styles.convertButton}
        >
          {isConverting ? "Converting..." : "🔄 Convert Image"}
        </button>

        {hasConvertedFile && (
          <button onClick={onDownload} className={styles.downloadButton}>
            💾 Download
          </button>
        )}
      </div>

      {/* Conversion Result */}
      {hasConvertedFile && (
        <div className={styles.result}>
          <div className={styles.resultTitle}>✅ Conversion Complete</div>
          <div className={styles.resultStats}>
            <div className={styles.stat}>
              <span>Original:</span>
              <strong>{formatFileSize(originalSize)}</strong>
            </div>
            <div className={styles.stat}>
              <span>Converted:</span>
              <strong>{formatFileSize(convertedSize)}</strong>
            </div>
            {compressionRatio && (
              <div
                className={`${styles.stat} ${
                  parseFloat(compressionRatio) > 0
                    ? styles.positive
                    : styles.negative
                }`}
              >
                <span>Change:</span>
                <strong>
                  {parseFloat(compressionRatio) > 0 ? "-" : "+"}
                  {Math.abs(parseFloat(compressionRatio))}%
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.techNote}>
        <strong>📖 Conversion:</strong> We use <code>canvas.toBlob()</code> to
        export the image. The format and quality parameters determine the
        output. The browser&apos;s built-in encoders handle the actual
        compression.
      </div>
    </div>
  );
}
