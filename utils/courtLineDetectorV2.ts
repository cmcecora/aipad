import type { FrameData, GrayscaleFrame, DetectedLine, CourtLine, ProcessingParams, DeviceMetrics } from '../types/computerVision';
import { ImageProcessor } from './imageProcessing';
import { EdgeDetector } from './edgeDetection';
import { HoughLineDetector } from './houghTransform';
import { LineClassifier } from './lineClassifier';
import { AdaptiveProcessor } from './adaptiveProcessor';
import { ErrorHandler } from './errorHandler';
import { CalibrationCache } from './calibrationCache';

/**
 * Advanced Court Line Detector - Phase 2 Implementation
 * 
 * Integrates all Phase 2 components:
 * - Image preprocessing
 * - Edge detection
 * - Hough line transform
 * - Line classification and filtering
 */
export class AdvancedCourtLineDetector {
  
  /**
   * Main detection method for court lines
   * @param frame - Input camera frame
   * @param params - Processing parameters (optional)
   * @returns Array of detected court lines
   */
  static detectCourtLines(
    frame: FrameData,
    params?: Partial<ProcessingParams>
  ): CourtLine[] {
    try {
      // Step 1: Image preprocessing
      const grayscaleFrame = ImageProcessor.convertToGrayscale(frame);
      
      // Check image quality
      if (!ImageProcessor.isImageQualitySufficient(grayscaleFrame)) {
        console.warn('Image quality insufficient for line detection');
        return [];
      }
      
      // Apply Gaussian blur for noise reduction
      const blurredFrame = ImageProcessor.applyGaussianBlur(grayscaleFrame);
      
      // Step 2: Edge detection
      const edgeDetectionParams = params ? {
        lowThreshold: params.cannyLowThreshold || 50,
        highThreshold: params.cannyHighThreshold || 150
      } : EdgeDetector.optimizeThresholds(grayscaleFrame);
      
      const edgeFrame = EdgeDetector.cannyEdgeDetection(
        blurredFrame,
        edgeDetectionParams.lowThreshold,
        edgeDetectionParams.highThreshold
      );
      
      // Step 3: Line detection using Hough transform
      const houghParams = params ? {
        rhoResolution: params.houghRhoResolution || 1,
        thetaResolution: params.houghThetaResolution || Math.PI / 180,
        threshold: params.houghThreshold || 50
      } : HoughLineDetector.optimizeParameters(edgeFrame);
      
      const detectedLines = HoughLineDetector.detectLines(
        edgeFrame,
        houghParams.rhoResolution,
        houghParams.thetaResolution,
        houghParams.threshold
      );
      
      // Step 4: Line filtering and classification
      const filteredLines = LineClassifier.filterCourtLines(
        detectedLines,
        frame.width,
        frame.height
      );
      
      // Merge similar lines to reduce redundancy
      const mergedLines = LineClassifier.mergeSimilarLines(filteredLines, 15);
      
      // Filter by quality for performance
      const qualityLines = LineClassifier.filterByQuality(mergedLines, 30);
      
      // Step 5: Identify specific court lines
      const courtLines = LineClassifier.identifyCourtLines(
        qualityLines,
        frame.width,
        frame.height
      );
      
      return courtLines;
      
    } catch (error) {
      console.error('Error in court line detection:', error);
      return [];
    }
  }
  
  /**
   * Fast detection method for performance-critical scenarios
   * @param frame - Input camera frame
   * @returns Array of detected court lines
   */
  static fastDetectCourtLines(frame: FrameData): CourtLine[] {
    try {
      // Simplified preprocessing
      const grayscaleFrame = ImageProcessor.convertToGrayscale(frame);
      const blurredFrame = ImageProcessor.applyGaussianBlur(grayscaleFrame);
      
      // Fast edge detection
      const edgeFrame = EdgeDetector.simpleSobelEdgeDetection(blurredFrame, 60);
      
      // Fast line detection
      const detectedLines = HoughLineDetector.fastLineDetection(edgeFrame, 15);
      
      // Basic filtering
      const filteredLines = LineClassifier.filterCourtLines(
        detectedLines,
        frame.width,
        frame.height
      );
      
      // Identify court lines
      const courtLines = LineClassifier.identifyCourtLines(
        filteredLines,
        frame.width,
        frame.height
      );
      
      return courtLines;
      
    } catch (error) {
      console.error('Error in fast court line detection:', error);
      return [];
    }
  }
  
  /**
   * Get detection statistics and quality metrics
   * @param frame - Input camera frame
   * @returns Detection statistics
   */
  static getDetectionStats(frame: FrameData): {
    imageQuality: {
      brightness: number;
      contrast: number;
      isSufficient: boolean;
    };
    edgeDensity: number;
    lineCount: number;
    courtLineCount: number;
    confidence: number;
    processingTime: number;
  } {
    const startTime = performance.now();
    
    // Image quality assessment
    const grayscaleFrame = ImageProcessor.convertToGrayscale(frame);
    const imageStats = ImageProcessor.calculateImageStats(grayscaleFrame);
    const isQualitySufficient = ImageProcessor.isImageQualitySufficient(grayscaleFrame);
    
    // Edge detection
    const blurredFrame = ImageProcessor.applyGaussianBlur(grayscaleFrame);
    const edgeFrame = EdgeDetector.cannyEdgeDetection(blurredFrame);
    const edgeDensity = EdgeDetector.calculateEdgeDensity(edgeFrame);
    
    // Line detection
    const detectedLines = HoughLineDetector.detectLines(edgeFrame);
    const courtLines = this.detectCourtLines(frame);
    
    const processingTime = performance.now() - startTime;
    
    return {
      imageQuality: {
        brightness: imageStats.brightness,
        contrast: imageStats.contrast,
        isSufficient: isQualitySufficient
      },
      edgeDensity,
      lineCount: detectedLines.length,
      courtLineCount: courtLines.length,
      confidence: LineClassifier.calculateCourtDetectionConfidence(courtLines),
      processingTime
    };
  }
  
  /**
   * Validate detection results and provide feedback
   * @param courtLines - Detected court lines
   * @param frameWidth - Frame width
   * @param frameHeight - Frame height
   * @returns Validation result with suggestions
   */
  static validateDetection(
    courtLines: CourtLine[],
    frameWidth: number,
    frameHeight: number
  ): {
    isValid: boolean;
    feedback: string;
    suggestions: string[];
    issues: string[];
  } {
    const validation = LineClassifier.validateCourtLines(courtLines, frameWidth, frameHeight);
    const suggestions: string[] = [];
    
    // Generate suggestions based on issues
    if (courtLines.length === 0) {
      suggestions.push('Try adjusting camera position for better line visibility');
      suggestions.push('Ensure adequate lighting conditions');
      suggestions.push('Check if court lines are clearly visible in frame');
    } else if (courtLines.length < 3) {
      suggestions.push('Move camera to capture more court lines');
      suggestions.push('Adjust angle to see horizontal and vertical lines');
      suggestions.push('Ensure camera is parallel to court surface');
    }
    
    // Check for specific issues and provide targeted suggestions
    if (validation.issues.includes('Horizontal line spacing appears incorrect')) {
      suggestions.push('Verify camera is positioned at correct height');
      suggestions.push('Check if camera is tilted or rotated');
    }
    
    if (validation.issues.includes('Center line appears off-center')) {
      suggestions.push('Center the camera horizontally on the court');
      suggestions.push('Ensure camera is not rotated');
    }
    
    return {
      ...validation,
      suggestions
    };
  }
  
  /**
   * Get recommended processing parameters for current conditions
   * @param frame - Input camera frame
   * @returns Optimized processing parameters
   */
  static getOptimizedParameters(frame: FrameData): ProcessingParams {
    const grayscaleFrame = ImageProcessor.convertToGrayscale(frame);
    const imageStats = ImageProcessor.calculateImageStats(grayscaleFrame);
    
    // Optimize edge detection thresholds based on image contrast
    const edgeThresholds = EdgeDetector.optimizeThresholds(grayscaleFrame);
    
    // Optimize Hough transform parameters
    const blurredFrame = ImageProcessor.applyGaussianBlur(grayscaleFrame);
    const edgeFrame = EdgeDetector.cannyEdgeDetection(blurredFrame);
    const houghParams = HoughLineDetector.optimizeParameters(edgeFrame);
    
    return {
      cannyLowThreshold: edgeThresholds.lowThreshold,
      cannyHighThreshold: edgeThresholds.highThreshold,
      houghRhoResolution: houghParams.rhoResolution,
      houghThetaResolution: houghParams.thetaResolution,
      houghThreshold: houghParams.threshold,
      minLineLength: Math.min(frame.width, frame.height) * 0.1,
      maxLineGap: Math.min(frame.width, frame.height) * 0.05
    };
  }
  
  /**
   * Process frame with adaptive quality based on device performance
   * @param frame - Input camera frame
   * @param isPerformanceMode - Whether to use performance-optimized mode
   * @returns Detected court lines
   */
  static detectWithAdaptiveQuality(
    frame: FrameData,
    isPerformanceMode: boolean = false
  ): CourtLine[] {
    if (isPerformanceMode) {
      return this.fastDetectCourtLines(frame);
    } else {
      return this.detectCourtLines(frame);
    }
  }

  /**
   * Detect court lines with full performance optimization
   * @param frame - Input camera frame
   * @param options - Performance optimization options
   * @returns Detected court lines with performance metrics
   */
  static detectWithPerformanceOptimization(
    frame: FrameData,
    options: {
      enableCaching?: boolean;
      enableAdaptiveQuality?: boolean;
      enableErrorHandling?: boolean;
      targetFrameRate?: number;
    } = {}
  ): {
    courtLines: CourtLine[];
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
    let cacheHit = false;
    let errorInfo: any = undefined;
    
    try {
      // Assess device performance
      const performanceTier = AdaptiveProcessor.assessDevicePerformance();
      
      // Try to load cached processing parameters
      let processingParams: ProcessingParams;
      if (options.enableCaching !== false) {
        const cachedParams = CalibrationCache.loadProcessingParams({
          performanceTier,
          deviceModel: 'unknown',
          osVersion: 'unknown'
        });
        
        if (cachedParams) {
          processingParams = cachedParams;
          cacheHit = true;
        } else {
          processingParams = AdaptiveProcessor.getOptimizedParameters(performanceTier);
        }
      } else {
        processingParams = AdaptiveProcessor.getOptimizedParameters(performanceTier);
      }
      
      // Get frame processing strategy
      const strategy = AdaptiveProcessor.getFrameProcessingStrategy(performanceTier);
      
      // Check if we should process this frame
      const frameCount = Math.floor(startTime / (1000 / strategy.frameRate));
      if (!AdaptiveProcessor.shouldProcessFrame(frameCount, performanceTier)) {
        // Skip frame for performance
        return {
          courtLines: [],
          performanceMetrics: {
            processingTime: 0,
            frameRate: strategy.frameRate,
            memoryUsage: 0,
            errorRate: 0,
            qualityLevel: 'skipped'
          },
          cacheHit: false
        };
      }
      
      // Process frame with optimized parameters
      const courtLines = this.detectCourtLines(frame, processingParams);
      
      // Calculate performance metrics
      const processingTime = performance.now() - startTime;
      const frameRate = 1000 / processingTime;
      
      // Estimate memory usage (rough calculation)
      const memoryUsage = frame.width * frame.height * 4; // RGBA bytes
      
      // Save performance metrics for future optimization
      if (options.enableCaching !== false) {
        CalibrationCache.saveDevicePerformance({
          averageProcessingTime: processingTime,
          frameRate,
          errorRate: 0,
          memoryUsage,
          batteryImpact: processingTime / 100 // Rough battery impact estimate
        });
      }
      
      // Save successful processing parameters
      if (options.enableCaching !== false && courtLines.length > 0) {
        CalibrationCache.saveProcessingParams(processingParams, {
          performanceTier,
          deviceModel: 'unknown',
          osVersion: 'unknown'
        });
      }
      
      return {
        courtLines,
        performanceMetrics: {
          processingTime,
          frameRate,
          memoryUsage,
          errorRate: 0,
          qualityLevel: performanceTier
        },
        cacheHit
      };
      
    } catch (error) {
      // Handle errors with enhanced error handling
      if (options.enableErrorHandling !== false) {
        const errorContext = {
          currentParams: this.getOptimizedParameters(frame),
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
        errorInfo = errorHandling;
        
        // Try to recover with fallback parameters
        if (errorHandling.shouldAutoRecover && errorHandling.newParams) {
          try {
            const fallbackLines = this.detectCourtLines(frame, errorHandling.newParams);
            return {
              courtLines: fallbackLines,
              performanceMetrics: {
                processingTime: performance.now() - startTime,
                frameRate: 0,
                memoryUsage: 0,
                errorRate: 1,
                qualityLevel: 'fallback'
              },
              cacheHit: false,
              errorInfo
            };
          } catch (fallbackError) {
            console.error('Fallback detection also failed:', fallbackError);
          }
        }
      }
      
      // Return empty result on error
      return {
        courtLines: [],
        performanceMetrics: {
          processingTime: performance.now() - startTime,
          frameRate: 0,
          memoryUsage: 0,
          errorRate: 1,
          qualityLevel: 'error'
        },
        cacheHit: false,
        errorInfo
      };
    }
  }

  /**
   * Get comprehensive performance report
   * @param frame - Input camera frame
   * @returns Detailed performance analysis
   */
  static getPerformanceReport(frame: FrameData): {
    deviceInfo: DeviceMetrics;
    processingParams: ProcessingParams;
    frameStrategy: any;
    cacheStats: any;
    recommendations: string[];
  } {
    // Get device performance assessment
    const performanceTier = AdaptiveProcessor.assessDevicePerformance();
    const deviceInfo: DeviceMetrics = {
      performanceTier,
      cpuCores: navigator?.hardwareConcurrency || 4,
      memoryGB: 4, // Default estimate
      gpuType: 'Unknown'
    };
    
    // Get optimized parameters
    const processingParams = AdaptiveProcessor.getOptimizedParameters(performanceTier);
    
    // Get frame processing strategy
    const frameStrategy = AdaptiveProcessor.getFrameProcessingStrategy(performanceTier);
    
    // Get cache statistics
    const cacheStats = CalibrationCache.getCacheStats();
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (performanceTier === 'low') {
      recommendations.push('Consider using performance mode for better battery life');
      recommendations.push('Close other apps to free up memory');
      recommendations.push('Ensure good lighting conditions for faster processing');
    } else if (performanceTier === 'high') {
      recommendations.push('Device can handle high-quality processing');
      recommendations.push('Consider enabling aggressive mode for best results');
      recommendations.push('Monitor battery usage during extended use');
    }
    
    if (cacheStats.expiredItems > 0) {
      recommendations.push('Clear expired cache items to free up storage');
    }
    
    return {
      deviceInfo,
      processingParams,
      frameStrategy,
      cacheStats,
      recommendations
    };
  }

  /**
   * Clear all cached data for fresh start
   */
  static clearAllCache(): void {
    CalibrationCache.clearAllCalibrationCache();
  }

  /**
   * Get user preferences for calibration
   */
  static getUserPreferences(): any {
    return CalibrationCache.loadUserPreferences();
  }

  /**
   * Save user preferences
   */
  static saveUserPreferences(preferences: any): void {
    CalibrationCache.saveUserPreferences(preferences);
  }
}
