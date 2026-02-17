import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./index.module.scss";
import FileUpload from "./components/file-upload";
import CanvasPreview from "./components/canvas-preview";
import ConversionOptions from "./components/conversion-options";
import TechExplanation from "./components/tech-explanation";
import { getSupportedFormats, convertImage } from "./utils/image-utils";

export default function ImageConverter() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [conversionSettings, setConversionSettings] = useState({
    format: "image/jpeg",
    quality: 0.9,
    width: null,
    height: null,
    maintainAspectRatio: true,
  });
  const [supportedFormats, setSupportedFormats] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Detect supported formats on mount
  useEffect(() => {
    const formats = getSupportedFormats();
    setSupportedFormats(formats);
    if (formats.length > 0) {
      setConversionSettings((prev) => ({
        ...prev,
        format: formats[0].mimeType,
      }));
    }
  }, []);

  // Handle file selection (receives validation result from FileUpload)
  const handleFileSelect = useCallback(async (file) => {
    setError(null);
    setOriginalFile(file);
    setConvertedBlob(null);
    setCurrentStep(1);

    try {
      // Create image from file using FileReader
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImage(dataUrl);
      setOriginalImage(img);
      setConversionSettings((prev) => ({
        ...prev,
        width: img.width,
        height: img.height,
      }));
      setCurrentStep(2);
    } catch (err) {
      setError("Failed to load image: " + err.message);
      setCurrentStep(0);
    }
  }, []);

  // Read file as DataURL using FileReader API
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  // Load image from DataURL
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = src;
    });
  };

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (!originalImage) return;

    setIsConverting(true);
    setError(null);
    setCurrentStep(3);

    try {
      const blob = await convertImage(originalImage, conversionSettings);
      setConvertedBlob(blob);
      setCurrentStep(4);
    } catch (err) {
      setError("Conversion failed: " + err.message);
    } finally {
      setIsConverting(false);
    }
  }, [originalImage, conversionSettings]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!convertedBlob) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement("a");
    const extension = conversionSettings.format.split("/")[1];
    const originalName = originalFile?.name?.split(".")[0] || "converted";
    a.href = url;
    a.download = `${originalName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCurrentStep(5);
  }, [convertedBlob, conversionSettings.format, originalFile]);

  // Reset everything
  const handleReset = useCallback(() => {
    setOriginalFile(null);
    setOriginalImage(null);
    setConvertedBlob(null);
    setError(null);
    setCurrentStep(0);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Image Converter</h1>
        <p className={styles.subtitle}>
          Convert images between formats directly in your browser. No server
          upload required - all processing happens locally on your device.
        </p>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <FileUpload
            onFileSelect={handleFileSelect}
            currentFile={originalFile}
            onReset={handleReset}
            error={error}
          />

          {originalImage && (
            <ConversionOptions
              settings={conversionSettings}
              onSettingsChange={setConversionSettings}
              supportedFormats={supportedFormats}
              originalWidth={originalImage.width}
              originalHeight={originalImage.height}
              onConvert={handleConvert}
              onDownload={handleDownload}
              isConverting={isConverting}
              hasConvertedFile={!!convertedBlob}
              convertedSize={convertedBlob?.size}
              originalSize={originalFile?.size}
            />
          )}
        </div>

        <div className={styles.centerPanel}>
          <CanvasPreview
            originalImage={originalImage}
            convertedBlob={convertedBlob}
            settings={conversionSettings}
          />
        </div>
      </div>

      <TechExplanation currentStep={currentStep} />
    </div>
  );
}
