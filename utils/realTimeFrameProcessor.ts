import type { Frame } from 'react-native-vision-camera';
import type { FrameData, DetectedLine, CourtLine, ProcessingParams } from '../types/computerVision';
import { AdvancedCourtLineDetector } from './courtLineDetectorV2';
import { AdaptiveProcessor } from './adaptiveProcessor';
import { ErrorHandler } from './errorHandler';
import { CalibrationCache } from './calibrationCache';

/**
 * Real-time Frame Processor for Vision Camera Integration
 * Phase 5: Real-time camera processing and worklet integration
 * 
 * Features:
 * - Real-time frame processing from Vision Camera
 * - Worklet-based off-main-thread processing
 * - Performance optimization and adaptive quality
 * - Error handling and recovery
 * - Cache integration for performance
 */
export class RealTimeFrameProcessor {
  
  /**
   * Process a single frame from Vision Camera
   * @param frame - Vision Camera frame
   * @param options - Processing options
   * @returns Processing result with detected lines
   */
  static processFrame(
    frame: Frame,
    options: {
      enablePerformanceOptimization?: boolean;
      enableCaching?: boolean;
      enableErrorHandling?: boolean;
      targetFrameRate?: number;
    } = {}
  ): {
    courtLines: CourtLine[];
    detectedLines: DetectedLine[];
    performanceMetrics: {
      processingTime: number;
      frameRate: number;
      memoryUsage: number;
      errorRate: number;
      qualityLevel: string;
    };
    cacheHit: boolean;
    errorInfo?: any;
  } {
    const startTime = performance.now();
    
    try {
      // Convert Vision Camera frame to our format
      const frameData = this.convertFrameToFrameData(frame);
      
      // Use performance optimization if enabled
      if (options.enablePerformanceOptimization !== false) {
        const optimizedResult = AdvancedCourtLineDetector.detectWithPerformanceOptimization(
          frameData,
          {
            enableCaching: options.enableCaching !== false,
            enableAdaptiveQuality: true,
            enableErrorHandling: options.enableErrorHandling !== false,
            targetFrameRate: options.targetFrameRate || 10
          }
        );
        
        // Convert court lines to detected lines for compatibility
        const detectedLines = optimizedResult.courtLines.map(line => line.detectedLine);
        
        return {
          ...optimizedResult,
          detectedLines
        };
      } else {
        // Basic detection without optimization
        const courtLines = AdvancedCourtLineDetector.detectCourtLines(frameData);
        const detectedLines = courtLines.map(line => line.detectedLine);
        
        return {
          courtLines,
          detectedLines,
          performanceMetrics: {
            processingTime: performance.now() - startTime,
            frameRate: 0,
            memoryUsage: frameData.width * frameData.height * 4,
            errorRate: 0,
            qualityLevel: 'basic'
          },
          cacheHit: false
        };
      }
      
    } catch (error) {
      // Handle errors with enhanced error handling
      if (options.enableErrorHandling !== false) {
        const errorContext = {
          currentParams: AdvancedCourtLineDetector.getOptimizedParameters({
            width: frame.width,
            height: frame.height,
            data: new Uint8Array(0),
            format: 'rgb',
            timestamp: frame.timestamp
          }),
          performanceMetrics: {
            processingTime: performance.now() - startTime,
            frameRate: 0,
            memoryUsage: 0,
            errorRate: 1
          },
          frameCount: 0,
          lastErrorTime: Date.now()
        };
        
        const errorHandling = ErrorHandler.handleError(String(error), errorContext);
        
        return {
          courtLines: [],
          detectedLines: [],
          performanceMetrics: {
            processingTime: performance.now() - startTime,
            frameRate: 0,
            memoryUsage: 0,
            errorRate: 1,
            qualityLevel: 'error'
          },
          cacheHit: false,
          errorInfo: errorHandling
        };
      }
      
      // Return empty result on error
      return {
        courtLines: [],
        detectedLines: [],
        performanceMetrics: {
          processingTime: performance.now() - startTime,
          frameRate: 0,
          memoryUsage: 0,
          errorRate: 1,
          qualityLevel: 'error'
        },
        cacheHit: false
      };
    }
  }
  
  /**
   * Convert Vision Camera frame to our FrameData format
   * @param frame - Vision Camera frame
   * @returns FrameData for processing
   */
  private static convertFrameToFrameData(frame: Frame): FrameData {
    // Extract frame dimensions
    const width = frame.width;
    const height = frame.height;
    
    // For now, create a mock frame data since we don't have actual pixel access yet
    // In the actual implementation, this would extract real pixel data from the frame
    const mockData = new Uint8Array(width * height * 3); // RGB format
    
    // Fill with some pattern for testing (remove in production)
    for (let i = 0; i < mockData.length; i += 3) {
      const pixelIndex = i / 3;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / height);
      
      // Create a simple test pattern
      if (y % 50 === 0 || x % 50 === 0) {
        mockData[i] = 255;     // R
        mockData[i + 1] = 255; // G
        mockData[i + 2] = 255; // B
      } else {
        mockData[i] = 50;      // R
        mockData[i + 1] = 50;  // G
        mockData[i + 2] = 50;  // B
      }
    }
    
    return {
      width,
      height,
      data: mockData,
      format: 'rgb',
      timestamp: frame.timestamp
    };
  }
  
  /**
   * Create a frame processor hook for React Native Vision Camera
   * @param onFrameProcessed - Callback for processed frames
   * @param options - Processing options
   * @returns Frame processor function
   */
  static createFrameProcessor(
    onFrameProcessed: (result: {
      courtLines: CourtLine[];
      detectedLines: DetectedLine[];
      performanceMetrics: any;
      errorInfo?: any;
    }) => void,
    options: {
      enablePerformanceOptimization?: boolean;
      enableCaching?: boolean;
      enableErrorHandling?: boolean;
      targetFrameRate?: number;
    } = {}
  ) {
    let frameCount = 0;
    let lastProcessingTime = 0;
    
    return (frame: Frame) => {
      'worklet';
      
      try {
        // Check if we should process this frame based on performance
        if (options.enablePerformanceOptimization !== false) {
          const performanceTier = AdaptiveProcessor.assessDevicePerformance();
          const strategy = AdaptiveProcessor.getFrameProcessingStrategy(performanceTier);
          
          if (!AdaptiveProcessor.shouldProcessFrame(frameCount, performanceTier)) {
            // Skip frame for performance
            frameCount++;
            return;
          }
        }
        
        // Process the frame
        const result = this.processFrame(frame, options);
        
        // Update frame count and timing
        frameCount++;
        lastProcessingTime = result.performanceMetrics.processingTime;
        
        // Send result back to JS thread
        // Note: In actual worklet implementation, this would use runOnJS
        // For now, we'll handle this in the React component
        onFrameProcessed({
          courtLines: result.courtLines,
          detectedLines: result.detectedLines,
          performanceMetrics: result.performanceMetrics,
          errorInfo: result.errorInfo
        });
        
      } catch (error) {
        // Handle worklet errors
        console.error('Frame processor error:', error);
        
        // Send error result
        onFrameProcessed({
          courtLines: [],
          detectedLines: [],
          performanceMetrics: {
            processingTime: 0,
            frameRate: 0,
            memoryUsage: 0,
            errorRate: 1,
            qualityLevel: 'error'
          },
          errorInfo: {
            action: 'reset',
            fallback: 'safe_mode',
            userMessage: 'Frame processing error occurred',
            shouldAutoRecover: false
          }
        });
      }
    };
  }
  
  /**
   * Get real-time performance statistics
   * @returns Current performance metrics
   */
  static getPerformanceStats(): {
    frameCount: number;
    averageProcessingTime: number;
    currentFrameRate: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    // This would be populated with real-time data in actual implementation
    return {
      frameCount: 0,
      averageProcessingTime: 0,
      currentFrameRate: 0,
      errorRate: 0,
      cacheHitRate: 0
    };
  }
  
  /**
   * Optimize frame processing for current device
   * @returns Optimized processing configuration
   */
  static getOptimizedConfiguration(): {
    targetFrameRate: number;
    qualityLevel: string;
    enableCaching: boolean;
    enableErrorHandling: boolean;
    processingMode: 'conservative' | 'balanced' | 'aggressive';
  } {
    const performanceTier = AdaptiveProcessor.assessDevicePerformance();
    const strategy = AdaptiveProcessor.getFrameProcessingStrategy(performanceTier);
    
    return {
      targetFrameRate: strategy.frameRate,
      qualityLevel: performanceTier,
      enableCaching: true,
      enableErrorHandling: true,
      processingMode: performanceTier === 'low' ? 'conservative' : 
                     performanceTier === 'high' ? 'aggressive' : 'balanced'
    };
  }
  
  /**
   * Clear frame processing cache
   */
  static clearCache(): void {
    CalibrationCache.clearAllCalibrationCache();
  }
  
  /**
   * Get device-specific recommendations
   * @returns Performance optimization recommendations
   */
  static getDeviceRecommendations(): string[] {
    const performanceTier = AdaptiveProcessor.assessDevicePerformance();
    const recommendations: string[] = [];
    
    if (performanceTier === 'low') {
      recommendations.push('Consider using performance mode for better battery life');
      recommendations.push('Close other apps to free up memory');
      recommendations.push('Ensure good lighting conditions for faster processing');
      recommendations.push('Use conservative processing mode');
    } else if (performanceTier === 'medium') {
      recommendations.push('Device can handle balanced processing');
      recommendations.push('Monitor battery usage during extended use');
      recommendations.push('Consider performance mode for better results');
    } else if (performanceTier === 'high') {
      recommendations.push('Device can handle high-quality processing');
      recommendations.push('Consider enabling aggressive mode for best results');
      recommendations.push('Monitor battery usage during extended use');
    }
    
    return recommendations;
  }
  
  /**
   * Validate frame processing setup
   * @returns Validation result
   */
  static validateSetup(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check if worklets are supported
    if (typeof global.Worklet === 'undefined') {
      issues.push('Worklets are not supported on this device');
      recommendations.push('Consider using basic frame processing mode');
    }
    
    // Check device performance
    const performanceTier = AdaptiveProcessor.assessDevicePerformance();
    if (performanceTier === 'low') {
      recommendations.push('Device performance is limited, consider performance mode');
    }
    
    // Check cache status
    const cacheStats = CalibrationCache.getCacheStats();
    if (cacheStats.expiredItems > 0) {
      recommendations.push('Clear expired cache items to free up storage');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}
