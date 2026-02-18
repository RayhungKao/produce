# Testing & Performance Guide for Image Converter

## 🧪 Testing Setup

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── test-utils.js              # Mock file creators, helpers
├── image-utils.test.js        # Unit tests for utilities
└── components/
    ├── FileUpload.test.js     # Component tests
    ├── ConversionOptions.test.js
    ├── ImageConverter.test.js # Integration tests
    └── SampleImages.test.js   # Sample image loading tests
```

---

## 📊 Coverage Target: 80%

### What's Covered

| Module              | Coverage Focus                                |
| ------------------- | --------------------------------------------- |
| `image-utils.js`    | File signatures, validation, conversion       |
| `FileUpload`        | File selection, drag/drop, validation display |
| `ConversionOptions` | Format selection, quality, dimensions         |
| `ImageConverter`    | Integration flow, state management            |
| `SampleImages`      | Sample image loading, error handling          |

### What's NOT Covered (and why)

- **Canvas rendering**: Browser-dependent, hard to mock accurately
- **Actual image encoding**: Native browser functionality
- **Visual output**: Would require snapshot or visual regression testing

---

## ⚡ Performance Testing & Optimization

### 1. Measuring Performance

#### Browser DevTools

```javascript
// Add timing markers in your code
performance.mark("conversion-start");

// ... conversion code ...

performance.mark("conversion-end");
performance.measure("conversion", "conversion-start", "conversion-end");

const measure = performance.getEntriesByName("conversion")[0];
console.log(`Conversion took: ${measure.duration}ms`);
```

#### Add to `image-utils.js`

```javascript
export async function convertImageWithTiming(image, settings) {
  const start = performance.now();

  const blob = await convertImage(image, settings);

  const end = performance.now();
  console.log(`[Performance] Conversion: ${(end - start).toFixed(2)}ms`);
  console.log(`[Performance] Output size: ${formatFileSize(blob.size)}`);

  return blob;
}
```

### 2. Key Performance Metrics

| Metric           | Target   | How to Measure                                    |
| ---------------- | -------- | ------------------------------------------------- |
| File validation  | < 10ms   | `performance.now()` around `detectActualFileType` |
| Image loading    | < 500ms  | Time from `img.src =` to `onload`                 |
| Canvas draw      | < 100ms  | Time for `drawImage`                              |
| Blob encoding    | < 1000ms | Time for `toBlob` callback                        |
| Total conversion | < 2000ms | End-to-end time                                   |

### 3. Performance Bottlenecks

#### Memory Usage

```javascript
// Check memory usage (Chrome only)
if (performance.memory) {
  console.log(
    `Heap used: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
  );
}
```

#### Canvas Size Limits

- Max canvas: ~16,384px per dimension
- Max pixels: ~268 million (16384 × 16384)
- Memory: 4 bytes per pixel (RGBA)
- **4000×3000 image = 48MB in canvas memory!**

### 4. Optimization Strategies

#### A. Use Web Workers for Heavy Processing

```javascript
// worker.js
self.onmessage = async (e) => {
  const { imageData, settings } = e.data;

  // Create OffscreenCanvas (available in workers)
  const canvas = new OffscreenCanvas(settings.width, settings.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(imageData, 0, 0, settings.width, settings.height);

  const blob = await canvas.convertToBlob({
    type: settings.format,
    quality: settings.quality,
  });

  self.postMessage({ blob });
};
```

#### B. Use Object URL Instead of Data URL (for large files)

```javascript
// Faster for large files
const url = URL.createObjectURL(file);
img.src = url;
img.onload = () => {
  URL.revokeObjectURL(url); // Clean up immediately
  // Continue processing...
};
```

#### C. Resize Before Heavy Processing

```javascript
// If user wants 800x600, resize first before any processing
// Don't process at full resolution then resize
const scaleFactor = Math.min(
  targetWidth / image.width,
  targetHeight / image.height,
);
```

#### D. Lazy Load the Tech Explanation

```javascript
import dynamic from "next/dynamic";

const TechExplanation = dynamic(() => import("./components/tech-explanation"), {
  ssr: false,
  loading: () => <div>Loading docs...</div>,
});
```

### 5. Performance Test Checklist

```
□ Test with 1MB image (typical photo)
□ Test with 10MB image (high-res photo)
□ Test with 50MB image (max allowed)
□ Test rapid consecutive conversions
□ Test format switching (JPEG → PNG → WebP)
□ Test extreme resize (4000px → 100px)
□ Monitor memory in DevTools during tests
□ Check for memory leaks (convert multiple times)
```

### 6. Add Performance Tests

```javascript
// In your test file
describe("Performance", () => {
  it("should convert 1MB image in under 2 seconds", async () => {
    const start = performance.now();

    const file = createMockFile({ size: 1024 * 1024 });
    const result = await validateFileWithSignature(file);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  it("should validate file signature in under 10ms", async () => {
    const start = performance.now();

    const file = createMockFile({ signature: "jpeg" });
    await detectActualFileType(file);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });
});
```

---

## 🔧 Debugging Performance Issues

### Chrome DevTools Performance Tab

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record**
4. Perform image conversion
5. Click **Stop**
6. Analyze:
   - **Main thread** blocks
   - **Memory** spikes
   - **Long tasks** (> 50ms)

### Memory Profiling

1. Go to **Memory** tab
2. Take **Heap snapshot** before conversion
3. Convert an image
4. Take another snapshot
5. Compare to find memory leaks

---

## 📈 Benchmarking Different Approaches

```javascript
// Benchmark utility
async function benchmark(name, fn, iterations = 10) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(
    `[${name}] Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`,
  );
}

// Usage
await benchmark("JPEG 90%", () =>
  convertImage(img, { format: "image/jpeg", quality: 0.9 }),
);
await benchmark("JPEG 50%", () =>
  convertImage(img, { format: "image/jpeg", quality: 0.5 }),
);
await benchmark("PNG", () => convertImage(img, { format: "image/png" }));
await benchmark("WebP 90%", () =>
  convertImage(img, { format: "image/webp", quality: 0.9 }),
);
```

---

## Summary

### Testing Commands

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (target: 80%)
```

### Performance Checklist

1. ✅ Add timing markers to critical paths
2. ✅ Test with various file sizes
3. ✅ Monitor memory usage
4. ✅ Consider Web Workers for heavy processing
5. ✅ Use Object URLs for large files
6. ✅ Profile in DevTools before optimizing
