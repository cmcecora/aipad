import type { Frame } from 'react-native-vision-camera';
import type { DetectedLine, CourtLine, FrameData } from '../types/computerVision';

/**
 * Worklet-based Frame Processor for Off-Main-Thread Processing
 * Phase 5: Real-time camera integration with worklets
 * 
 * Features:
 * - Off-main-thread frame processing
 * - Real-time performance optimization
 * - Memory-efficient processing
 * - Worklet error handling
 * - Performance monitoring
 */
export class WorkletFrameProcessor {
  
  /**
   * Main worklet function for frame processing
   * This will run in a separate thread for optimal performance
   */
  static processFrameWorklet = (frame: Frame) => {
    'worklet';
    
    try {
      // Extract frame dimensions and properties
      const width = frame.width;
      const height = frame.height;
      const pixelFormat = frame.pixelFormat;
      const timestamp = frame.timestamp;
      
      // Validate frame
      if (!frame.isValid) {
        return {
          success: false,
          courtLines: [],
          detectedLines: [],
          processingTime: 0,
          frameQuality: 0,
          error: 'Frame is not valid'
        };
      }
      
      // Create frame data from real camera frame
      const frameData = this.createFrameDataFromVisionCamera(frame);
      
      // Process frame with computer vision algorithms
      const result = this.processFrameWithCV(frameData);
      
      // Return processed result
      return {
        success: true,
        courtLines: result.courtLines,
        detectedLines: result.detectedLines,
        performanceMetrics: {
          processingTime: result.processingTime,
          qualityLevel: result.frameQuality > 0.8 ? 'high' : 'medium',
          frameTimestamp: timestamp
        },
        error: null
      };
      
    } catch (error) {
      // Handle worklet errors
      return {
        success: false,
        courtLines: [],
        detectedLines: [],
        performanceMetrics: {
          processingTime: 0,
          qualityLevel: 'low',
          frameTimestamp: 0
        },
        error: error instanceof Error ? error.message : 'Unknown worklet error'
      };
    }
  };
  
  /**
   * Create frame data from Vision Camera frame
   * This extracts real pixel data from the camera frame
   */
  private static createFrameDataFromVisionCamera(frame: Frame): FrameData {
    'worklet';
    
    const width = frame.width;
    const height = frame.height;
    const pixelFormat = frame.pixelFormat;
    
    // Get the actual pixel data from the frame
    let data: Uint8Array;
    
    try {
      // Extract real pixel data from the frame
      const arrayBuffer = frame.toArrayBuffer();
      data = new Uint8Array(arrayBuffer);
      
      // Validate data size
      if (data.length === 0) {
        throw new Error('Empty frame data');
      }
      
      // Convert different pixel formats to RGB if needed
      if (pixelFormat === 'yuv') {
        // Convert YUV to RGB (simplified conversion)
        data = this.convertYUVtoRGB(data, width, height);
      } else if (pixelFormat === 'rgb') {
        // Data is already in RGB format
        // Note: Vision Camera might return RGBA, so we need to handle that
        if (data.length === width * height * 4) {
          // RGBA format - extract RGB channels
          data = this.extractRGBFromRGBA(data);
        }
      } else {
        // Unknown format - create fallback data
        console.warn('Unknown pixel format:', pixelFormat);
        data = new Uint8Array(width * height * 3);
      }
      
    } catch (error) {
      console.error('Error extracting frame data:', error);
      // Fallback to empty data
      data = new Uint8Array(width * height * 3);
    }
    
    return {
      width,
      height,
      data,
      format: 'rgb',
      timestamp: frame.timestamp
    };
  }
  
  /**
   * Convert YUV data to RGB
   * This is a simplified YUV to RGB conversion
   */
  private static convertYUVtoRGB(yuvData: Uint8Array, width: number, height: number): Uint8Array {
    'worklet';
    
    const rgbData = new Uint8Array(width * height * 3);
    
    // Simplified YUV to RGB conversion
    // In production, you'd use a more accurate conversion algorithm
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const yIndex = i * width + j;
        const uIndex = width * height + (i / 2) * (width / 2) + (j / 2);
        const vIndex = width * height + (width * height) / 4 + (i / 2) * (width / 2) + (j / 2);
        
        const y = yuvData[yIndex];
        const u = yuvData[uIndex];
        const v = yuvData[vIndex];
        
        // YUV to RGB conversion (simplified)
        let r = y + 1.402 * (v - 128);
        let g = y - 0.344136 * (u - 128) - 0.714136 * (v - 128);
        let b = y + 1.772 * (u - 128);
        
        // Clamp values
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        const rgbIndex = (i * width + j) * 3;
        rgbData[rgbIndex] = Math.round(r);
        rgbData[rgbIndex + 1] = Math.round(g);
        rgbData[rgbIndex + 2] = Math.round(b);
      }
    }
    
    return rgbData;
  }
  
  /**
   * Extract RGB channels from RGBA data
   */
  private static extractRGBFromRGBA(rgbaData: Uint8Array): Uint8Array {
    'worklet';
    
    const rgbData = new Uint8Array((rgbaData.length / 4) * 3);
    
    for (let i = 0; i < rgbaData.length; i += 4) {
      const rgbIndex = (i / 4) * 3;
      rgbData[rgbIndex] = rgbaData[i];     // R
      rgbData[rgbIndex + 1] = rgbaData[i + 1]; // G
      rgbData[rgbIndex + 2] = rgbaData[i + 2]; // B
      // Skip A channel
    }
    
    return rgbData;
  }
  
  /**
   * Process frame with computer vision algorithms
   * This runs entirely within the worklet
   */
  private static processFrameWithCV(frameData: FrameData) {
    'worklet';
    
    const startTime = performance.now();
    
    try {
      // Simulate computer vision processing
      // In production, this would call the actual CV algorithms
      const courtLines = this.simulateCourtLineDetection(frameData);
      const detectedLines = courtLines.map((line: any) => line.detectedLine);
      
      // Calculate frame quality based on detected lines
      const frameQuality = this.calculateFrameQuality(frameData, courtLines);
      
      const processingTime = performance.now() - startTime;
      
      return {
        courtLines,
        detectedLines,
        processingTime,
        frameQuality
      };
      
    } catch (error) {
      // Return empty result on error
      return {
        courtLines: [],
        detectedLines: [],
        processingTime: performance.now() - startTime,
        frameQuality: 0
      };
    }
  }
  
  /**
   * Simulate court line detection (replace with real CV in production)
   */
  private static simulateCourtLineDetection(frameData: FrameData) {
    'worklet';
    
    const { width, height } = frameData;
    
    // Simulate detection of three court lines
    const courtLines = [];
    
    // Top back wall line (horizontal)
    if (this.detectHorizontalLine(frameData, height * 0.15, 20)) {
      courtLines.push({
        id: 'topBackWall',
        detectedLine: {
          x1: 0,
          y1: height * 0.15,
          x2: width,
          y2: height * 0.15,
          angle: 0,
          type: 'horizontal',
          confidence: 0.85,
          length: width
        },
        alignmentScore: 0.85
      });
    }
    
    // Baseline/service line (horizontal)
    if (this.detectHorizontalLine(frameData, height * 0.75, 20)) {
      courtLines.push({
        id: 'baseline',
        detectedLine: {
          x1: 0,
          y1: height * 0.75,
          x2: width,
          y2: height * 0.75,
          angle: 0,
          type: 'horizontal',
          confidence: 0.80,
          length: width
        },
        alignmentScore: 0.80
      });
    }
    
    // Center line (vertical)
    if (this.detectVerticalLine(frameData, width * 0.5, 20)) {
      courtLines.push({
        id: 'verticalCenter',
        detectedLine: {
          x1: width * 0.5,
          y1: 0,
          x2: width * 0.5,
          y2: height,
          angle: 90,
          type: 'vertical',
          confidence: 0.75,
          length: height
        },
        alignmentScore: 0.75
      });
    }
    
    return courtLines;
  }
  
  /**
   * Detect horizontal line at specific y-position
   */
  private static detectHorizontalLine(frameData: FrameData, targetY: number, tolerance: number) {
    'worklet';
    
    const { width, height, data } = frameData;
    const y = Math.round(targetY);
    
    if (y < 0 || y >= height) return false;
    
    // Check if there's a bright line at this y-position
    let brightPixels = 0;
    const samplePoints = 10;
    
    for (let i = 0; i < samplePoints; i++) {
      const x = Math.floor((i / (samplePoints - 1)) * width);
      const pixelIndex = (y * width + x) * 3;
      
      if (pixelIndex < data.length - 2) {
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Check if pixel is bright (white line)
        if (r > 200 && g > 200 && b > 200) {
          brightPixels++;
        }
      }
    }
    
    // Line is detected if majority of sample points are bright
    return brightPixels > samplePoints * 0.6;
  }
  
  /**
   * Detect vertical line at specific x-position
   */
  private static detectVerticalLine(frameData: FrameData, targetX: number, tolerance: number) {
    'worklet';
    
    const { width, height, data } = frameData;
    const x = Math.round(targetX);
    
    if (x < 0 || x >= width) return false;
    
    // Check if there's a bright line at this x-position
    let brightPixels = 0;
    const samplePoints = 10;
    
    for (let i = 0; i < samplePoints; i++) {
      const y = Math.floor((i / (samplePoints - 1)) * height);
      const pixelIndex = (y * width + x) * 3;
      
      if (pixelIndex < data.length - 2) {
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Check if pixel is bright (white line)
        if (r > 200 && g > 200 && b > 200) {
          brightPixels++;
        }
      }
    }
    
    // Line is detected if majority of sample points are bright
    return brightPixels > samplePoints * 0.6;
  }
  
  /**
   * Calculate frame quality based on detected lines and image characteristics
   */
  private static calculateFrameQuality(frameData: FrameData, courtLines: any[]) {
    'worklet';
    
    const { width, height, data } = frameData;
    
    // Base quality score
    let quality = 0.5;
    
    // Bonus for detected court lines
    quality += courtLines.length * 0.15;
    
    // Bonus for good contrast (bright lines on dark background)
    let highContrastPixels = 0;
    let totalPixels = Math.min(data.length / 3, 1000); // Sample subset for performance
    
    for (let i = 0; i < totalPixels; i++) {
      const pixelIndex = i * 3;
      if (pixelIndex < data.length - 2) {
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Check for high contrast (very bright or very dark)
        if ((r > 200 && g > 200 && b > 200) || (r < 50 && g < 50 && b < 50)) {
          highContrastPixels++;
        }
      }
    }
    
    const contrastRatio = highContrastPixels / totalPixels;
    quality += contrastRatio * 0.2;
    
    // Cap quality at 1.0
    return Math.min(1.0, Math.max(0.0, quality));
  }
  
  /**
   * Performance monitoring within worklet
   */
  static createPerformanceMonitor() {
    'worklet';
    
    let frameCount = 0;
    let totalProcessingTime = 0;
    let lastReportTime = performance.now();
    
    const recordFrame = (processingTime: number) => {
      frameCount++;
      totalProcessingTime += processingTime;
      
      // Report performance every 30 frames
      if (frameCount % 30 === 0) {
        const currentTime = performance.now();
        const timeSpan = (currentTime - lastReportTime) / 1000;
        const avgProcessingTime = totalProcessingTime / frameCount;
        const fps = frameCount / timeSpan;
        
        // Log performance metrics (will appear in worklet console)
        console.log(`Worklet Performance: ${fps.toFixed(1)} FPS, Avg: ${avgProcessingTime.toFixed(1)}ms`);
        
        // Reset counters
        frameCount = 0;
        totalProcessingTime = 0;
        lastReportTime = currentTime;
      }
    };
    
    return { recordFrame };
  }
  
  /**
   * Get worklet configuration for current device
   */
  static getWorkletConfig() {
    'worklet';
    
    // Check if we're running in a worklet
    if (typeof global.Worklet === 'undefined') {
      return {
        isWorklet: false,
        canOptimize: false,
        message: 'Not running in worklet context'
      };
    }
    
    return {
      isWorklet: true,
      canOptimize: true,
      message: 'Running in optimized worklet context'
    };
  }
  
  /**
   * Validate worklet environment
   */
  static validateWorkletEnvironment() {
    'worklet';
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check worklet support
    if (typeof global.Worklet === 'undefined') {
      issues.push('Worklets not supported');
    }
    
    // Check performance API
    if (typeof performance === 'undefined') {
      warnings.push('Performance API not available');
    }
    
    // Check console support
    if (typeof console === 'undefined') {
      warnings.push('Console not available in worklet');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }
}
