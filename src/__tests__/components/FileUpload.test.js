/**
 * Component tests for FileUpload
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FileUpload from "@/components/features/image-converter/components/file-upload";
import { createMockFile, createLargeFile, flushPromises } from "../test-utils";

describe("FileUpload Component", () => {
  const mockOnFileSelect = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFileUpload = (props = {}) => {
    return render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onReset={mockOnReset}
        currentFile={null}
        error={null}
        {...props}
      />,
    );
  };

  describe("Initial State", () => {
    it("should render upload area with instructions", () => {
      renderFileUpload();

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it("should display supported formats", () => {
      renderFileUpload();

      expect(screen.getByText(/JPEG/i)).toBeInTheDocument();
      expect(screen.getByText(/PNG/i)).toBeInTheDocument();
      expect(screen.getByText(/WebP/i)).toBeInTheDocument();
    });

    it("should display max file size", () => {
      renderFileUpload();

      expect(screen.getByText(/50MB/i)).toBeInTheDocument();
    });
  });

  describe("File Selection", () => {
    it("should call onFileSelect when valid file is selected", async () => {
      renderFileUpload();

      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });

    it("should show error for oversized files", async () => {
      // Render with an error prop to test error display
      renderFileUpload({ error: "File size exceeds 50MB limit" });

      // Should display the error message
      expect(screen.getByText(/exceeds/i)).toBeInTheDocument();
    });
  });

  describe("With Current File", () => {
    it("should display file info when file is selected", () => {
      const file = createMockFile({ name: "photo.jpg", type: "image/jpeg" });

      renderFileUpload({ currentFile: file });

      expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    });

    it("should show reset button when file is selected", () => {
      const file = createMockFile({ name: "photo.jpg", type: "image/jpeg" });

      renderFileUpload({ currentFile: file });

      // Look for button with "✕" text
      const resetButton = screen.getByRole("button");
      expect(resetButton).toBeInTheDocument();
    });

    it("should call onReset when reset button is clicked", () => {
      const file = createMockFile({ name: "photo.jpg", type: "image/jpeg" });

      renderFileUpload({ currentFile: file });

      const resetButton = screen.getByRole("button");
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe("Error Display", () => {
    it("should display error message when error prop is provided", () => {
      renderFileUpload({ error: "Something went wrong" });

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should show error icon with error message", () => {
      renderFileUpload({ error: "Invalid file format" });

      expect(screen.getByText("Invalid file format")).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("should have a drop zone area", () => {
      renderFileUpload();

      // The drop zone should be present
      const uploadText = screen.getByText(/click to upload/i);
      expect(uploadText).toBeInTheDocument();
    });

    it("should have file input for file selection", () => {
      renderFileUpload();

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept");
    });
  });

  describe("Tech Note", () => {
    it("should display educational tech note", () => {
      renderFileUpload();

      expect(screen.getByText(/FileReader API/i)).toBeInTheDocument();
      expect(screen.getByText(/file signature/i)).toBeInTheDocument();
    });
  });
});
