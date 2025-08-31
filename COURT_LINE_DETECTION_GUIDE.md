# Padel Court Line Detection Technology Guide

## Overview

This document outlines the technology requirements for implementing accurate padel court line detection in your calibration feature. Currently, your app shows red guide lines that should turn green when aligned with actual court lines, but the detection isn't working.

## Current Implementation Status

- ✅ UI overlay with red guide lines
- ✅ Camera integration with expo-camera
- ✅ Basic frame processing setup
- ❌ **Actual computer vision line detection**
- ❌ **Real-time frame analysis**
- ❌ **Line alignment verification**

## Required Technologies

### 1. Computer Vision Framework

#### Option A: OpenCV (Recommended)

```bash
npm install react-native-opencv3
# or
npm install opencv4nodejs
```

**Pros:**

- Industry standard for computer vision
- Excellent line detection algorithms
- Well-documented and mature
- Cross-platform support

**Cons:**

- Larger bundle size
- More complex setup
- Requires native linking

#### Option B: TensorFlow.js

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
```

**Pros:**

- JavaScript-based, easier integration
- Good for ML-based approaches
- Smaller bundle size

**Cons:**

- Less specialized for line detection
- Higher computational overhead
- May be overkill for simple line detection

#### Option C: ML Kit (iOS) / ML Kit (Android)

```bash
npm install @react-native-ml-kit/text-recognition
# Extend for custom line detection
```

**Pros:**

- Native performance
- Optimized for mobile
- Good integration with React Native

**Cons:**

- Platform-specific
- Limited to supported ML models

### 2. Core Computer Vision Algorithms

#### A. Image Preprocessing

```typescript
// 1. Convert to grayscale
const grayscale = cv.cvtColor(frame, cv.COLOR_RGB2GRAY);

// 2. Apply Gaussian blur to reduce noise
const blurred = cv.GaussianBlur(grayscale, new cv.Size(5, 5), 0);

// 3. Apply thresholding to isolate lines
const thresholded = cv.threshold(
  blurred,
  0,
  255,
  cv.THRESH_BINARY + cv.THRESH_OTSU
);
```

#### B. Edge Detection

```typescript
// Canny edge detection
const edges = cv.Canny(blurred, 50, 150);
```

#### C. Line Detection (Hough Transform)

```typescript
// Hough line transform
const lines = cv.HoughLinesP(edges, 1, Math.PI / 180, 50, 50, 10);

// Filter lines by angle and length
const horizontalLines = lines.filter((line) => {
  const angle = Math.abs(
    (Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180) / Math.PI
  );
  return (angle < 10 || angle > 170) && line.length > minLineLength;
});
```

### 3. Real-time Frame Processing

#### A. Frame Processor Setup

```typescript
import { CameraView, useFrameProcessor } from 'expo-camera';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  // Process frame data here
  const detectedLines = detectCourtLines(frame);
  runOnJS(setDetectedLines)(detectedLines);
}, []);
```

#### B. Performance Optimization

```typescript
// Process every 3rd frame (10 FPS instead of 30 FPS)
let frameCount = 0;
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  frameCount++;
  if (frameCount % 3 !== 0) return;

  const detectedLines = detectCourtLines(frame);
  runOnJS(setDetectedLines)(detectedLines);
}, []);
```

### 4. Line Detection Implementation

#### A. Basic Implementation (Current)

Your current `BasicCourtLineDetector` class provides a foundation but needs real computer vision:

```typescript
// Replace placeholder methods with real implementations
private hasStrongHorizontalEdge(frame: any, y: number): boolean {
  // 1. Extract horizontal slice of pixels at y-coordinate
  const horizontalSlice = this.extractHorizontalSlice(frame, y);

  // 2. Calculate gradient (rate of intensity change)
  const gradient = this.calculateGradient(horizontalSlice);

  // 3. Find peaks in gradient (strong edges)
  const peaks = this.findPeaks(gradient);

  // 4. Return true if strong edge detected
  return peaks.some(peak => peak.strength > this.EDGE_THRESHOLD);
}
```

#### B. Advanced Implementation

```typescript
export class AdvancedCourtLineDetector implements CourtLineDetector {
  private cv: any; // OpenCV instance

  async initialize() {
    // Load OpenCV
    this.cv = await cv();
  }

  detectLines(frame: any): DetectedLine[] {
    // 1. Preprocess frame
    const processed = this.preprocessFrame(frame);

    // 2. Detect edges
    const edges = this.detectEdges(processed);

    // 3. Find lines
    const lines = this.findLines(edges);

    // 4. Filter and classify lines
    return this.classifyLines(lines);
  }

  private preprocessFrame(frame: any) {
    // Convert to grayscale
    const gray = this.cv.cvtColor(frame, this.cv.COLOR_RGB2GRAY);

    // Apply Gaussian blur
    const blurred = this.cv.GaussianBlur(gray, new this.cv.Size(5, 5), 0);

    // Apply adaptive thresholding
    const thresholded = this.cv.adaptiveThreshold(
      blurred,
      255,
      this.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      this.cv.THRESH_BINARY,
      11,
      2
    );

    return thresholded;
  }
}
```

### 5. Integration Steps

#### Step 1: Install Dependencies

```bash
npm install react-native-vision-camera
npm install react-native-opencv3  # or alternative
npm install react-native-reanimated
```

#### Step 2: Update Camera Component

```typescript
import { CameraView, useFrameProcessor } from 'expo-camera';

<CameraView
  ref={cameraRef}
  style={styles.camera}
  facing="back"
  onCameraReady={() => setCameraReady(true)}
  frameProcessor={frameProcessor}
  frameProcessorFps={10}
/>;
```

#### Step 3: Implement Frame Processing

```typescript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  try {
    const detectedLines = detectCourtLines(frame);
    runOnJS(setDetectedLines)(detectedLines);
  } catch (error) {
    console.error('Frame processing error:', error);
  }
}, []);
```

#### Step 4: Real-time Alignment Checking

```typescript
useEffect(() => {
  if (detectedLines.length > 0) {
    const aligned = checkLineAlignment(detectedLines);
    setIsAligned(aligned);
  }
}, [detectedLines, checkLineAlignment]);
```

### 6. Testing and Debugging

#### A. Visual Debug Overlay

```typescript
// Show detected lines on screen for debugging
const renderDetectedLines = () =>
  detectedLines.map((line, index) => (
    <View
      key={index}
      style={[
        styles.detectedLine,
        {
          left: line.x1,
          top: line.y1,
          width: line.x2 - line.x1,
          height: line.y2 - line.y1,
        },
      ]}
    />
  ));
```

#### B. Confidence Metrics

```typescript
// Log detection confidence
console.log('Line detection confidence:', {
  totalLines: detectedLines.length,
  averageConfidence:
    detectedLines.reduce((sum, line) => sum + line.confidence, 0) /
    detectedLines.length,
  strongLines: detectedLines.filter((line) => line.confidence > 0.8).length,
});
```

### 7. Performance Considerations

#### A. Frame Rate Management

- Process frames at 10-15 FPS (not 30 FPS)
- Use frame skipping for heavy processing
- Implement frame buffering for smooth UI updates

#### B. Memory Management

- Release frame data after processing
- Use WebAssembly for heavy computations
- Implement garbage collection for large frame buffers

#### C. Battery Optimization

- Reduce processing when app is backgrounded
- Use adaptive quality based on device performance
- Implement power-aware frame processing

### 8. Next Steps

1. **Choose Computer Vision Framework**: Start with OpenCV for best results
2. **Implement Real Frame Processing**: Replace placeholder detection with actual algorithms
3. **Add Visual Debugging**: Show detected lines on screen for testing
4. **Optimize Performance**: Ensure smooth 60 FPS UI with 10-15 FPS processing
5. **Test on Real Devices**: Validate detection accuracy across different lighting conditions

### 9. Alternative Approaches

If computer vision proves too complex, consider:

#### A. Manual Calibration

- Let users manually position guides
- Save positions for future use
- Provide visual feedback for manual alignment

#### B. Template Matching

- Use pre-defined court templates
- Match camera view to templates
- Less accurate but simpler implementation

#### C. AR Foundation

- Use ARKit (iOS) or ARCore (Android)
- Leverage device sensors for positioning
- More complex but potentially more accurate

## Conclusion

The key missing piece is **real computer vision line detection**. Your current implementation has the UI and logic structure correct, but needs:

1. **OpenCV or similar CV library** for line detection
2. **Real-time frame processing** instead of simulated detection
3. **Proper edge detection algorithms** (Canny + Hough Transform)
4. **Performance optimization** for mobile devices

Start with the basic OpenCV implementation and gradually improve the detection accuracy based on real-world testing.
