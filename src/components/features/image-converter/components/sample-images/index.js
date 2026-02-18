/**
 * SampleImages Component
 *
 * Provides pre-loaded sample images for users to test the converter
 * without needing to upload their own files.
 *
 * Features:
 * - Grid of clickable sample images
 * - Loading states for each image
 * - Error handling with retry capability
 * - Educational descriptions for each sample
 */

import { useState, useCallback } from "react";
import styles from "./index.module.scss";

// Sample image configurations
// These demonstrate different use cases and conversion scenarios
const SAMPLE_IMAGES = [
  {
    id: "photo",
    name: "Photo",
    filename: "sample-photo.jpg",
    description: "High-quality photograph - great for testing JPEG compression",
    expectedSize: "~150KB",
    icon: "📷",
    characteristics: ["Rich colors", "Fine details", "Best for JPEG/WebP"],
  },
  {
    id: "illustration",
    name: "Illustration",
    filename: "sample-illustration.png",
    description: "Vector-style art - shows PNG vs JPEG quality differences",
    expectedSize: "~80KB",
    icon: "🎨",
    characteristics: ["Solid colors", "Sharp edges", "Best for PNG"],
  },
  {
    id: "transparent",
    name: "Transparent",
    filename: "sample-transparent.png",
    description:
      "Image with transparency - demonstrates alpha channel handling",
    expectedSize: "~60KB",
    icon: "🔲",
    characteristics: ["Alpha channel", "Transparency", "PNG/WebP only"],
  },
  {
    id: "landscape",
    name: "Landscape",
    filename: "sample-landscape.jpg",
    description:
      "Wide landscape photo - good for dimension/aspect ratio testing",
    expectedSize: "~200KB",
    icon: "🏞️",
    characteristics: ["Wide aspect", "Gradients", "Compression test"],
  },
];

// Error types for specific handling
const ERROR_TYPES = {
  NETWORK: "network",
  NOT_FOUND: "not_found",
  INVALID_IMAGE: "invalid_image",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown",
};

// Error messages for user display
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: "Network Error",
    message:
      "Unable to load sample image. Please check your internet connection.",
    action: "Retry",
    icon: "🌐",
  },
  [ERROR_TYPES.NOT_FOUND]: {
    title: "Image Not Found",
    message: "This sample image is currently unavailable.",
    action: "Try Another",
    icon: "🔍",
  },
  [ERROR_TYPES.INVALID_IMAGE]: {
    title: "Invalid Image",
    message: "The image file appears to be corrupted.",
    action: "Report Issue",
    icon: "⚠️",
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: "Loading Timeout",
    message: "The image is taking too long to load.",
    action: "Retry",
    icon: "⏱️",
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred while loading the image.",
    action: "Retry",
    icon: "❌",
  },
};

/**
 * Determine error type from error object
 */
function getErrorType(error) {
  if (!navigator.onLine) return ERROR_TYPES.NETWORK;
  if (error?.status === 404) return ERROR_TYPES.NOT_FOUND;
  if (error?.name === "AbortError") return ERROR_TYPES.TIMEOUT;
  if (
    error?.message?.includes("invalid") ||
    error?.message?.includes("corrupt")
  ) {
    return ERROR_TYPES.INVALID_IMAGE;
  }
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Individual Sample Card Component
 */
function SampleCard({
  sample,
  onSelect,
  isLoading,
  error,
  onRetry,
  onDismissError,
}) {
  const errorInfo = error
    ? ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
    : null;

  return (
    <div
      className={`${styles.sampleCard} ${isLoading ? styles.loading : ""} ${error ? styles.hasError : ""}`}
      onClick={() => !isLoading && !error && onSelect(sample)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && !isLoading && !error && onSelect(sample)
      }
      aria-label={`Load ${sample.name} sample image`}
      aria-busy={isLoading}
      aria-disabled={isLoading || !!error}
    >
      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorOverlay}>
          <span className={styles.errorIcon}>{errorInfo.icon}</span>
          <span className={styles.errorTitle}>{errorInfo.title}</span>
          <span className={styles.errorMessage}>{errorInfo.message}</span>
          <div className={styles.errorActions}>
            <button
              className={styles.retryButton}
              onClick={(e) => {
                e.stopPropagation();
                onRetry(sample);
              }}
            >
              {errorInfo.action}
            </button>
            <button
              className={styles.dismissButton}
              onClick={(e) => {
                e.stopPropagation();
                onDismissError(sample.id);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Normal State */}
      {!isLoading && !error && (
        <>
          <div className={styles.cardIcon}>{sample.icon}</div>
          <div className={styles.cardContent}>
            <h4 className={styles.cardTitle}>{sample.name}</h4>
            <span className={styles.fileSize}>{sample.expectedSize}</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Global Error Banner Component
 */
function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const errorInfo =
    ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

  return (
    <div className={styles.errorBanner} role="alert">
      <div className={styles.bannerContent}>
        <span className={styles.bannerIcon}>{errorInfo.icon}</span>
        <div className={styles.bannerText}>
          <strong>{errorInfo.title}</strong>
          <p>{error.message || errorInfo.message}</p>
        </div>
      </div>
      <div className={styles.bannerActions}>
        {onRetry && (
          <button className={styles.bannerRetry} onClick={onRetry}>
            {errorInfo.action}
          </button>
        )}
        <button className={styles.bannerDismiss} onClick={onDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Main SampleImages Component
 */
export default function SampleImages({ onImageSelect, disabled = false }) {
  const [loadingId, setLoadingId] = useState(null);
  const [errors, setErrors] = useState({}); // { [sampleId]: errorObject }
  const [globalError, setGlobalError] = useState(null);

  /**
   * Fetch and load a sample image
   */
  const loadSampleImage = useCallback(
    async (sample) => {
      if (disabled || loadingId) return;

      setLoadingId(sample.id);
      setErrors((prev) => ({ ...prev, [sample.id]: null }));
      setGlobalError(null);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        // Fetch the image
        const response = await fetch(`/samples/${sample.filename}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw { status: response.status, message: `HTTP ${response.status}` };
        }

        // Get the blob
        const blob = await response.blob();

        // Validate it's actually an image
        if (!blob.type.startsWith("image/")) {
          throw { message: "Invalid image format" };
        }

        // Create a File object from the blob
        const file = new File([blob], sample.filename, {
          type: blob.type,
          lastModified: Date.now(),
        });

        // Success! Pass to parent
        onImageSelect(file, {
          isSample: true,
          sampleId: sample.id,
          sampleName: sample.name,
        });
      } catch (error) {
        console.error(`Failed to load sample image: ${sample.id}`, error);

        const errorType = getErrorType(error);
        const errorObj = {
          type: errorType,
          message: error.message,
          sampleId: sample.id,
          timestamp: Date.now(),
        };

        setErrors((prev) => ({
          ...prev,
          [sample.id]: errorObj,
        }));

        // Show global error for network issues
        if (errorType === ERROR_TYPES.NETWORK) {
          setGlobalError(errorObj);
        }
      } finally {
        setLoadingId(null);
        clearTimeout(timeoutId);
      }
    },
    [disabled, loadingId, onImageSelect],
  );

  /**
   * Retry loading a specific sample
   */
  const handleRetry = useCallback(
    (sample) => {
      setErrors((prev) => ({ ...prev, [sample.id]: null }));
      loadSampleImage(sample);
    },
    [loadSampleImage],
  );

  /**
   * Dismiss error for a specific sample
   */
  const handleDismissError = useCallback((sampleId) => {
    setErrors((prev) => ({ ...prev, [sampleId]: null }));
  }, []);

  /**
   * Dismiss global error banner
   */
  const handleDismissGlobalError = useCallback(() => {
    setGlobalError(null);
  }, []);

  /**
   * Retry all failed samples
   */
  const handleRetryAll = useCallback(() => {
    const failedSamples = SAMPLE_IMAGES.filter((s) => errors[s.id]);
    if (failedSamples.length > 0) {
      handleRetry(failedSamples[0]);
    }
  }, [errors, handleRetry]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.icon}>🧪</span>
          Try Sample Images
        </h3>
        <p className={styles.subtitle}>
          Click any sample below to test the converter without uploading your
          own files
        </p>
      </div>

      {/* Global Error Banner */}
      <ErrorBanner
        error={globalError}
        onDismiss={handleDismissGlobalError}
        onRetry={handleRetryAll}
      />

      {/* Sample Cards Grid */}
      <div className={styles.grid}>
        {SAMPLE_IMAGES.map((sample) => (
          <SampleCard
            key={sample.id}
            sample={sample}
            onSelect={loadSampleImage}
            isLoading={loadingId === sample.id}
            error={errors[sample.id]}
            onRetry={handleRetry}
            onDismissError={handleDismissError}
          />
        ))}
      </div>

      {/* Offline Warning */}
      {!navigator.onLine && (
        <div className={styles.offlineWarning} role="alert">
          <span className={styles.offlineIcon}>📡</span>
          <span>
            You appear to be offline. Sample images require an internet
            connection.
          </span>
        </div>
      )}
    </div>
  );
}
