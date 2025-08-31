import type { GrayscaleFrame, EdgeFrame } from '../types/computerVision';

/**
 * Edge Detection Implementation for Court Line Detection
 * Phase 2: Core computer vision algorithms
 * 
 * Implements Canny edge detection algorithm:
 * 1. Apply Sobel operators for gradients
 * 2. Non-maximum suppression
 * 3. Double thresholding
 * 4. Edge tracking by hysteresis
 */
export class EdgeDetector {
  
  /**
   * Main Canny edge detection method
   * @param frame - Input grayscale frame
   * @param lowThreshold - Lower threshold for edge detection (default: 50)
   * @param highThreshold - Upper threshold for edge detection (default: 150)
   * @returns Edge frame with detected edges
   */
  static cannyEdgeDetection(
    frame: GrayscaleFrame,
    lowThreshold: number = 50,
    highThreshold: number = 150
  ): EdgeFrame {
    const { width, height, data } = frame;
    
    // Step 1: Apply Gaussian blur to reduce noise
    const blurredData = this.applyGaussianBlur(data, width, height);
    
    // Step 2: Calculate gradients using Sobel operators
    const { magnitude, direction } = this.calculateGradients(blurredData, width, height);
    
    // Step 3: Non-maximum suppression
    const suppressedData = this.nonMaximumSuppression(magnitude, direction, width, height);
    
    // Step 4: Double thresholding and edge tracking
    const edgeData = this.doubleThresholding(suppressedData, width, height, lowThreshold, highThreshold);
    
    return {
      width,
      height,
      data: edgeData,
      timestamp: frame.timestamp,
      edgeThreshold: highThreshold
    };
  }
  
  /**
   * Apply Gaussian blur to reduce noise before edge detection
   */
  private static applyGaussianBlur(
    data: Uint8Array,
    width: number,
    height: number,
    kernelSize: number = 3
  ): Uint8Array {
    const blurredData = new Uint8Array(data.length);
    
    // 3x3 Gaussian kernel
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let validPixels = 0;
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const pixelValue = data[py * width + px];
              const kernelValue = kernel[ky + 1][kx + 1];
              sum += pixelValue * kernelValue;
              validPixels += kernelValue;
            }
          }
        }
        
        const blurredValue = Math.round(sum / validPixels);
        blurredData[y * width + x] = Math.max(0, Math.min(255, blurredValue));
      }
    }
    
    return blurredData;
  }
  
  /**
   * Calculate gradients using Sobel operators
   */
  private static calculateGradients(
    data: Uint8Array,
    width: number,
    height: number
  ): { magnitude: Float32Array; direction: Float32Array } {
    const magnitude = new Float32Array(data.length);
    const direction = new Float32Array(data.length);
    
    // Sobel operators
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        // Apply Sobel operators
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelValue = data[(y + ky) * width + (x + kx)];
            gx += pixelValue * sobelX[ky + 1][kx + 1];
            gy += pixelValue * sobelY[ky + 1][kx + 1];
          }
        }
        
        // Calculate magnitude and direction
        const mag = Math.sqrt(gx * gx + gy * gy);
        const dir = Math.atan2(gy, gx);
        
        magnitude[y * width + x] = mag;
        direction[y * width + x] = dir;
      }
    }
    
    return { magnitude, direction };
  }
  
  /**
   * Non-maximum suppression to thin edges
   */
  private static nonMaximumSuppression(
    magnitude: Float32Array,
    direction: Float32Array,
    width: number,
    height: number
  ): Uint8Array {
    const suppressedData = new Uint8Array(magnitude.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const mag = magnitude[idx];
        const dir = direction[idx];
        
        // Normalize direction to 0-180 degrees
        let normalizedDir = ((dir * 180 / Math.PI) + 180) % 180;
        
        // Determine neighbors to compare
        let neighbor1: number, neighbor2: number;
        
        if (normalizedDir < 22.5 || normalizedDir >= 157.5) {
          // Horizontal edge: compare with left and right pixels
          neighbor1 = magnitude[idx - 1];
          neighbor2 = magnitude[idx + 1];
        } else if (normalizedDir < 67.5) {
          // Diagonal edge (top-right to bottom-left)
          neighbor1 = magnitude[idx - width - 1];
          neighbor2 = magnitude[idx + width + 1];
        } else if (normalizedDir < 112.5) {
          // Vertical edge: compare with top and bottom pixels
          neighbor1 = magnitude[idx - width];
          neighbor2 = magnitude[idx + width];
        } else {
          // Diagonal edge (top-left to bottom-right)
          neighbor1 = magnitude[idx - width + 1];
          neighbor2 = magnitude[idx + width - 1];
        }
        
        // Suppress if current pixel is not a local maximum
        if (mag >= neighbor1 && mag >= neighbor2) {
          suppressedData[idx] = Math.round(mag);
        } else {
          suppressedData[idx] = 0;
        }
      }
    }
    
    return suppressedData;
  }
  
  /**
   * Double thresholding and edge tracking by hysteresis
   */
  private static doubleThresholding(
    data: Uint8Array,
    width: number,
    height: number,
    lowThreshold: number,
    highThreshold: number
  ): Uint8Array {
    const result = new Uint8Array(data.length);
    
    // First pass: mark strong and weak edges
    for (let i = 0; i < data.length; i++) {
      if (data[i] >= highThreshold) {
        result[i] = 255; // Strong edge
      } else if (data[i] >= lowThreshold) {
        result[i] = 128; // Weak edge
      } else {
        result[i] = 0; // No edge
      }
    }
    
    // Second pass: edge tracking by hysteresis
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        if (result[idx] === 128) { // Weak edge
          // Check if any of the 8 neighbors is a strong edge
          let hasStrongNeighbor = false;
          
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              if (kx === 0 && ky === 0) continue;
              
              const neighborIdx = (y + ky) * width + (x + kx);
              if (neighborIdx >= 0 && neighborIdx < result.length && result[neighborIdx] === 255) {
                hasStrongNeighbor = true;
                break;
              }
            }
            if (hasStrongNeighbor) break;
          }
          
          // Convert weak edge to strong edge if connected to strong edge
          if (hasStrongNeighbor) {
            result[idx] = 255;
          } else {
            result[idx] = 0; // Remove weak edge
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Alternative: Simple Sobel edge detection for performance-critical scenarios
   */
  static simpleSobelEdgeDetection(
    frame: GrayscaleFrame,
    threshold: number = 50
  ): EdgeFrame {
    const { width, height, data } = frame;
    const edgeData = new Uint8Array(data.length);
    
    // Simple Sobel edge detection without non-maximum suppression
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Calculate gradients using simple difference operators
        const gx = data[idx + 1] - data[idx - 1];
        const gy = data[idx + width] - data[idx - width];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // Apply threshold
        edgeData[idx] = magnitude > threshold ? 255 : 0;
      }
    }
    
    return {
      width,
      height,
      data: edgeData,
      timestamp: frame.timestamp,
      edgeThreshold: threshold
    };
  }
  
  /**
   * Calculate edge density for quality assessment
   */
  static calculateEdgeDensity(edgeFrame: EdgeFrame): number {
    const { data } = edgeFrame;
    let edgePixels = 0;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 0) {
        edgePixels++;
      }
    }
    
    return edgePixels / data.length; // Edge density as percentage
  }
  
  /**
   * Optimize edge detection parameters based on image characteristics
   */
  static optimizeThresholds(
    frame: GrayscaleFrame,
    targetEdgeDensity: number = 0.1 // Target 10% edge pixels
  ): { lowThreshold: number; highThreshold: number } {
    // Simple adaptive thresholding based on image statistics
    const stats = this.calculateImageStats(frame);
    
    // Adjust thresholds based on image contrast
    const baseThreshold = Math.max(30, Math.min(200, stats.stdDev));
    const lowThreshold = Math.round(baseThreshold * 0.5);
    const highThreshold = Math.round(baseThreshold * 1.5);
    
    return { lowThreshold, highThreshold };
  }
  
  /**
   * Calculate basic image statistics for threshold optimization
   */
  private static calculateImageStats(frame: GrayscaleFrame): {
    mean: number;
    stdDev: number;
    contrast: number;
  } {
    const { data } = frame;
    let sum = 0;
    let sumSquares = 0;
    
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
      sumSquares += data[i] * data[i];
    }
    
    const mean = sum / data.length;
    const variance = (sumSquares / data.length) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    
    return { mean, stdDev, contrast: stdDev };
  }
}
