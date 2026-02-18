/**
 * Component tests for ConversionOptions
 */

import { render, screen, fireEvent } from "@testing-library/react";
import ConversionOptions from "@/components/features/image-converter/components/conversion-options";
import {
  MOCK_SUPPORTED_FORMATS,
  createConversionSettings,
} from "../test-utils";

describe("ConversionOptions Component", () => {
  const mockOnSettingsChange = jest.fn();
  const mockOnConvert = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    settings: createConversionSettings(),
    onSettingsChange: mockOnSettingsChange,
    supportedFormats: MOCK_SUPPORTED_FORMATS,
    originalWidth: 800,
    originalHeight: 600,
    onConvert: mockOnConvert,
    onDownload: mockOnDownload,
    isConverting: false,
    hasConvertedFile: false,
    convertedSize: null,
    originalSize: 1000000,
  };

  const renderOptions = (props = {}) => {
    return render(<ConversionOptions {...defaultProps} {...props} />);
  };

  describe("Format Selection", () => {
    it("should display format dropdown", () => {
      renderOptions();

      // Use getByRole for select element
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should list all supported formats", () => {
      renderOptions();

      expect(screen.getByText(/JPEG/i)).toBeInTheDocument();
      expect(screen.getByText(/PNG/i)).toBeInTheDocument();
      expect(screen.getByText(/WebP/i)).toBeInTheDocument();
    });

    it("should call onSettingsChange when format changes", () => {
      renderOptions();

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "image/png" } });

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });
  });

  describe("Quality Slider", () => {
    it("should show quality slider for JPEG", () => {
      renderOptions({
        settings: createConversionSettings({ format: "image/jpeg" }),
      });

      // Look for the range input (slider)
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("should show quality slider for WebP", () => {
      renderOptions({
        settings: createConversionSettings({ format: "image/webp" }),
      });

      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("should update quality when slider changes", () => {
      renderOptions();

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "0.5" } });

      expect(mockOnSettingsChange).toHaveBeenCalled();
    });

    it("should display quality percentage", () => {
      renderOptions({
        settings: createConversionSettings({ quality: 0.9 }),
      });

      expect(screen.getByText(/90/)).toBeInTheDocument();
    });
  });

  describe("Dimensions", () => {
    it("should display width and height inputs", () => {
      renderOptions();

      // Look for number inputs using getAllByRole
      const numberInputs = screen.getAllByRole("spinbutton");
      expect(numberInputs.length).toBeGreaterThanOrEqual(2);
    });

    it("should show current dimensions", () => {
      renderOptions();

      expect(screen.getByDisplayValue("800")).toBeInTheDocument();
      expect(screen.getByDisplayValue("600")).toBeInTheDocument();
    });

    it("should have aspect ratio checkbox", () => {
      renderOptions();

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should display dimension labels", () => {
      renderOptions();

      expect(screen.getByText("W")).toBeInTheDocument();
      expect(screen.getByText("H")).toBeInTheDocument();
    });
  });

  describe("Convert Button", () => {
    it("should render convert button", () => {
      renderOptions();

      expect(
        screen.getByRole("button", { name: /convert/i }),
      ).toBeInTheDocument();
    });

    it("should call onConvert when clicked", () => {
      renderOptions();

      fireEvent.click(screen.getByRole("button", { name: /convert/i }));

      expect(mockOnConvert).toHaveBeenCalled();
    });

    it("should show loading state when converting", () => {
      renderOptions({ isConverting: true });

      expect(screen.getByText(/converting/i)).toBeInTheDocument();
    });

    it("should be disabled when converting", () => {
      renderOptions({ isConverting: true });

      const button = screen.getByRole("button", { name: /converting/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Download Button", () => {
    it("should show download button when conversion is complete", () => {
      renderOptions({
        hasConvertedFile: true,
        convertedSize: 50000,
      });

      expect(
        screen.getByRole("button", { name: /download/i }),
      ).toBeInTheDocument();
    });

    it("should call onDownload when clicked", () => {
      renderOptions({
        hasConvertedFile: true,
        convertedSize: 50000,
      });

      fireEvent.click(screen.getByRole("button", { name: /download/i }));

      expect(mockOnDownload).toHaveBeenCalled();
    });

    it("should not show download button before conversion", () => {
      renderOptions({ hasConvertedFile: false });

      expect(
        screen.queryByRole("button", { name: /download/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Size Comparison", () => {
    it("should show size comparison after conversion", () => {
      renderOptions({
        hasConvertedFile: true,
        originalSize: 1000000, // 1MB
        convertedSize: 500000, // 500KB
      });

      // Should show some size information - use getAllByText since there are multiple KB/MB elements
      const sizeTexts = screen.getAllByText(/KB|MB/i);
      expect(sizeTexts.length).toBeGreaterThan(0);
    });

    it("should show conversion complete message", () => {
      renderOptions({
        hasConvertedFile: true,
        originalSize: 1000000,
        convertedSize: 500000,
      });

      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });
  });
});
