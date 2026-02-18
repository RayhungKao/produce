/**
 * Integration tests for ImageConverter main component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageConverter from "@/components/features/image-converter";
import { createMockFile, flushPromises } from "../test-utils";

// Mock the child components to isolate integration testing
jest.mock(
  "@/components/features/image-converter/components/tech-explanation",
  () => {
    return function MockTechExplanation({ currentStep }) {
      return <div data-testid="tech-explanation">Step: {currentStep}</div>;
    };
  },
);

describe("ImageConverter Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render the main container", () => {
      render(<ImageConverter />);

      expect(screen.getByText(/Image Converter/i)).toBeInTheDocument();
    });

    it("should render file upload component", () => {
      render(<ImageConverter />);

      expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
    });

    it("should show step 0 in tech explanation", () => {
      render(<ImageConverter />);

      expect(screen.getByTestId("tech-explanation")).toHaveTextContent(
        "Step: 0",
      );
    });

    it("should render empty state for preview", () => {
      render(<ImageConverter />);

      // Should show empty state message for preview area
      expect(screen.getByText(/upload an image/i)).toBeInTheDocument();
    });
  });

  describe("File Upload Flow", () => {
    it("should update step after file selection", async () => {
      render(<ImageConverter />);

      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(
        () => {
          expect(screen.getByTestId("tech-explanation")).not.toHaveTextContent(
            "Step: 0",
          );
        },
        { timeout: 1000 },
      );
    });

    it("should have file input for image selection", () => {
      render(<ImageConverter />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept");
    });
  });

  describe("Privacy Message", () => {
    it("should display privacy/local processing message", () => {
      render(<ImageConverter />);

      // Use getAllByText since "browser" appears multiple times
      const browserTexts = screen.getAllByText(/browser/i);
      expect(browserTexts.length).toBeGreaterThan(0);
    });

    it("should mention no server upload", () => {
      render(<ImageConverter />);

      // Use getAllByText since "no server" appears multiple times
      const noServerTexts = screen.getAllByText(/no server/i);
      expect(noServerTexts.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should not display error initially", () => {
      render(<ImageConverter />);

      // The component should not show error messages initially
      const errorElements = document.querySelectorAll('[class*="error"]');
      // Either no error elements or they should be empty/hidden
      expect(
        errorElements.length === 0 || !screen.queryByText(/error/i),
      ).toBeTruthy();
    });
  });

  describe("Reset Functionality", () => {
    it("should display file name after selection", async () => {
      render(<ImageConverter />);

      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("test.jpg")).toBeInTheDocument();
      });
    });

    it("should have reset functionality after file selection", async () => {
      render(<ImageConverter />);

      const file = createMockFile({
        name: "test.jpg",
        type: "image/jpeg",
        signature: "jpeg",
      });

      const input = document.querySelector('input[type="file"]');
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText("test.jpg")).toBeInTheDocument();
      });

      // Multiple buttons exist (tabs + reset), so check for reset button specifically
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // Find the reset button (has "✕" text)
      const resetButton = buttons.find((btn) => btn.textContent === "✕");
      expect(resetButton).toBeTruthy();
    });
  });

  describe("Tech Note", () => {
    it("should display educational information", () => {
      render(<ImageConverter />);

      expect(screen.getByText(/FileReader API/i)).toBeInTheDocument();
    });
  });
});
