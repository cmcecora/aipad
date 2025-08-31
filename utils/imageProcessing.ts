import type { 
  FrameData, 
  GrayscaleFrame, 
  BlurredFrame 
} from '../types/computerVision';

/**
 * Image processing utilities for court line detection
 * Phase 1: Basic preprocessing operations
 */
export class ImageProcessor {
  
  /**
   * Convert RGB/RGBA frame to grayscale
   * Uses luminance formula: Y = 0.299R + 0.587G + 0.114B
   */
  static convertToGrayscale(frame: FrameData): GrayscaleFrame {
    if (frame.format === 'grayscale') {
      // Already grayscale, just return with proper typing
      return {
        width: frame.width,
        height: frame.height,
        data: frame.data as Uint8Array,
        timestamp: frame.timestamp
      };
    }
    
    const { width, height, data } = frame;
    const grayscaleData = new Uint8Array(width * height);
    
    if (frame.format === 'rgb') {
      // RGB format: 3 bytes per pixel
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to grayscale using luminance formula
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscaleData[i / 3] = gray;
      }
    } else if (frame.format === 'rgba') {
      // RGBA format: 4 bytes per pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Note: We ignore alpha channel for grayscale conversion
        
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscaleData[i / 4] = gray;
      }
    }
    
    return {
      width,
      height,
      data: grayscaleData,
      timestamp: frame.timestamp
    };
  }
  
  /**
   * Apply Gaussian blur to reduce noise
   * Uses a simple 3x3 Gaussian kernel for performance
   */
  static applyGaussianBlur(
    frame: GrayscaleFrame, 
    blurRadius: number = 1
  ): BlurredFrame {
    const { width, height, data } = frame;
    const blurredData = new Uint8Array(data.length);
    
    // Simple 3x3 Gaussian kernel (normalized)
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16; // Sum of all kernel values
    
    // Apply convolution with border handling
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let validPixels = 0;
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            
            // Check bounds
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const pixelValue = data[py * width + px];
              const kernelValue = kernel[ky + 1][kx + 1];
              sum += pixelValue * kernelValue;
              validPixels += kernelValue;
            }
          }
        }
        
        // Normalize and store result
        const blurredValue = Math.round(sum / validPixels);
        blurredData[y * width + x] = Math.max(0, Math.min(255, blurredValue));
      }
    }
    
    return {
      width,
      height,
      data: blurredData,
      timestamp: frame.timestamp,
      blurRadius
    };
  }
  
  /**
   * Normalize image data to improve contrast
   * Stretches histogram to use full 0-255 range
   */
  static normalizeContrast(frame: GrayscaleFrame): GrayscaleFrame {
    const { width, height, data } = frame;
    const normalizedData = new Uint8Array(data.length);
    
    // Find min and max values
    let min = 255;
    let max = 0;
    
    for (let i = 0; i < data.length; i++) {
      min = Math.min(min, data[i]);
      max = Math.max(max, data[i]);
    }
    
    // Avoid division by zero
    if (max === min) {
      return frame;
    }
    
    // Normalize to 0-255 range
    const range = max - min;
    for (let i = 0; i < data.length; i++) {
      const normalized = Math.round(((data[i] - min) / range) * 255);
      normalizedData[i] = normalized;
    }
    
    return {
      width,
      height,
      data: normalizedData,
      timestamp: frame.timestamp
    };
  }
  
  /**
   * Calculate image statistics for quality assessment
   */
  static calculateImageStats(frame: GrayscaleFrame): {
    mean: number;
    stdDev: number;
    contrast: number;
    brightness: number;
  } {
    const { data } = frame;
    let sum = 0;
    let sumSquares = 0;
    
    // Calculate mean and sum of squares
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
      sumSquares += data[i] * data[i];
    }
    
    const mean = sum / data.length;
    const variance = (sumSquares / data.length) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    
    // Estimate contrast as standard deviation
    const contrast = stdDev;
    
    // Brightness is the mean value
    const brightness = mean;
    
    return { mean, stdDev, contrast, brightness };
  }
  
  /**
   * Check if image quality is sufficient for line detection
   */
  static isImageQualitySufficient(frame: GrayscaleFrame): boolean {
    const stats = this.calculateImageStats(frame);
    
    // Quality thresholds (can be adjusted based on testing)
    const minContrast = 20;    // Minimum contrast for edge detection
    const minBrightness = 30;  // Minimum brightness
    const maxBrightness = 225; // Maximum brightness (avoid overexposure)
    
    return (
      stats.contrast >= minContrast &&
      stats.brightness >= minBrightness &&
      stats.brightness <= maxBrightness
    );
  }
}
