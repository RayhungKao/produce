/**
 * Component tests for SampleImages
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SampleImages from "@/components/features/image-converter/components/sample-images";

// Mock fetch
global.fetch = jest.fn();

describe("SampleImages Component", () => {
  const mockOnImageSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  const renderSampleImages = (props = {}) => {
    return render(
      <SampleImages onImageSelect={mockOnImageSelect} {...props} />,
    );
  };

  describe("Initial Render", () => {
    it("should render the title", () => {
      renderSampleImages();

      expect(screen.getByText(/Try Sample Images/i)).toBeInTheDocument();
    });

    it("should render all sample cards", () => {
      renderSampleImages();

      expect(screen.getByText("Photo")).toBeInTheDocument();
      expect(screen.getByText("Illustration")).toBeInTheDocument();
      expect(screen.getByText("Transparent")).toBeInTheDocument();
      expect(screen.getByText("Landscape")).toBeInTheDocument();
    });

    it("should display expected file sizes", () => {
      renderSampleImages();

      expect(screen.getByText("~150KB")).toBeInTheDocument();
      expect(screen.getByText("~80KB")).toBeInTheDocument();
      expect(screen.getByText("~60KB")).toBeInTheDocument();
      expect(screen.getByText("~200KB")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when fetching image", async () => {
      // Mock fetch to not resolve immediately
      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });
  });

  describe("Successful Image Load", () => {
    it("should call onImageSelect when image loads successfully", async () => {
      // Mock successful fetch
      const mockBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalled();
      });

      // Check the file was created correctly
      const [file, metadata] = mockOnImageSelect.mock.calls[0];
      expect(file).toBeInstanceOf(File);
      expect(metadata.isSample).toBe(true);
      expect(metadata.sampleId).toBe("photo");
    });
  });

  describe("Error Handling", () => {
    it("should show error when fetch fails", async () => {
      // Mock failed fetch
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      });
    });

    it("should show error when image is not found (404)", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(screen.getByText(/Image Not Found/i)).toBeInTheDocument();
      });
    });

    it("should allow retry after error", async () => {
      // First call fails
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      });

      // Mock successful retry
      const mockBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      // Click retry
      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalled();
      });
    });

    it("should allow dismissing error", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      await waitFor(() => {
        expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
      });

      // Click dismiss
      const dismissButton = screen.getByText("Dismiss");
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Something Went Wrong/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Disabled State", () => {
    it("should not load image when disabled", async () => {
      renderSampleImages({ disabled: true });

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.click(photoCard);

      // Should not call fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria labels", () => {
      renderSampleImages();

      const photoCard = screen.getByLabelText(/Load Photo sample image/i);
      expect(photoCard).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      // Mock successful fetch
      const mockBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      renderSampleImages();

      const photoCard = screen.getByText("Photo").closest('[role="button"]');
      fireEvent.keyDown(photoCard, { key: "Enter" });

      // Should trigger fetch
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
