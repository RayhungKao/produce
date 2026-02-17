import { useCallback, useRef, useState } from "react";
import styles from "./index.module.scss";
import {
  validateFileWithSignature,
  getAcceptedInputTypes,
  formatFileSize,
} from "../../utils/image-utils";

export default function FileUpload({
  onFileSelect,
  currentFile,
  onReset,
  error,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationWarning, setValidationWarning] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [detectedType, setDetectedType] = useState(null);

  const handleFile = useCallback(
    async (file) => {
      setValidationError(null);
      setValidationWarning(null);
      setDetectedType(null);
      setIsValidating(true);

      try {
        // Use file signature validation for deep file inspection
        const validation = await validateFileWithSignature(file);

        if (!validation.valid) {
          setValidationError(validation.error);
          setIsValidating(false);
          return;
        }

        // Set warning if file type was mismatched
        if (validation.warning) {
          setValidationWarning(validation.warning);
        }

        // Store the detected type for display
        if (validation.actualType) {
          setDetectedType(validation.actualType);
        }

        onFileSelect(file, validation);
      } catch (err) {
        setValidationError("Error reading file. Please try again.");
      } finally {
        setIsValidating(false);
      }
    },
    [onFileSelect],
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleReset = useCallback(() => {
    setValidationWarning(null);
    setDetectedType(null);
    onReset();
  }, [onReset]);

  const displayError = validationError || error;

  return (
    <div className={styles.uploadContainer}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepNumber}>1</span>
        Upload Image
      </h3>

      {!currentFile ? (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ""} ${isValidating ? styles.validating : ""}`}
          onClick={!isValidating ? handleClick : undefined}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept={getAcceptedInputTypes()}
            onChange={handleChange}
            className={styles.hiddenInput}
            disabled={isValidating}
          />
          <div className={styles.dropContent}>
            {isValidating ? (
              <>
                <div className={styles.uploadIcon}>🔍</div>
                <p className={styles.dropText}>
                  <strong>Analyzing file...</strong>
                </p>
                <p className={styles.dropHint}>Verifying file signature</p>
              </>
            ) : (
              <>
                <div className={styles.uploadIcon}>📁</div>
                <p className={styles.dropText}>
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p className={styles.dropHint}>
                  Supports: JPEG, PNG, WebP, GIF, BMP, SVG, AVIF
                </p>
                <p className={styles.dropHint}>Max file size: 50MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{currentFile.name}</div>
            <div className={styles.fileMeta}>
              {detectedType ? (
                <>
                  <span className={styles.detectedType}>
                    {detectedType.name}
                  </span>
                  <span>•</span>
                </>
              ) : (
                <>
                  <span>{currentFile.type || "Unknown type"}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatFileSize(currentFile.size)}</span>
            </div>
            {detectedType && detectedType.mimeType !== currentFile.type && (
              <div className={styles.typeCorrection}>
                <span className={styles.correctionIcon}>🔍</span>
                Format verified via file signature
              </div>
            )}
          </div>
          <button className={styles.resetButton} onClick={handleReset}>
            ✕
          </button>
        </div>
      )}

      {validationWarning && (
        <div className={styles.warningMessage}>
          <span className={styles.warningIcon}>⚠️</span>
          {validationWarning}
        </div>
      )}

      {displayError && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>❌</span>
          {displayError}
        </div>
      )}

      <div className={styles.techNote}>
        <strong>📖 How it works:</strong> When you select a file, we read the
        file header using <code>FileReader API</code> to verify the actual
        format via <code>file signature</code> (unique byte sequence). This
        prevents spoofed extensions and ensures we know the true format.
        Everything happens in your browser - no server upload!
      </div>
    </div>
  );
}
