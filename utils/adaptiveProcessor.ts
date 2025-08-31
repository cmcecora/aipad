import type { ProcessingParams, DeviceMetrics } from '../types/computerVision';

/**
 * Adaptive Processor for Performance Optimization
 * Phase 4: Mobile performance and battery life optimization
 * 
 * Features:
 * - Device performance assessment
 * - Adaptive quality adjustment
 * - Frame rate optimization
 * - Memory management
 * - Battery usage optimization
 */
export class AdaptiveProcessor {
  
  /**
   * Device performance tiers
   */
  private static readonly PERFORMANCE_TIERS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  } as const;
  
  /**
   * Performance profiles for different device tiers
   */
  private static readonly PERFORMANCE_PROFILES = {
    [this.PERFORMANCE_TIERS.LOW]: {
      frameRate: 5,        // 5 FPS for low-end devices
      cannyLowThreshold: 80,
      cannyHighThreshold: 200,
      houghRhoResolution: 3,
      houghThetaResolution: Math.PI / 90,
      houghThreshold: 30,
      minLineLength: 50,
      maxLineGap: 20,
      useFastMode: true,
      skipFrames: 3        // Process every 3rd frame
    },
    [this.PERFORMANCE_TIERS.MEDIUM]: {
      frameRate: 10,       // 10 FPS for mid-range devices
      cannyLowThreshold: 60,
      cannyHighThreshold: 180,
      houghRhoResolution: 2,
      houghThetaResolution: Math.PI / 120,
      houghThreshold: 40,
      minLineLength: 40,
      maxLineGap: 15,
      useFastMode: false,
      skipFrames: 2        // Process every 2nd frame
    },
    [this.PERFORMANCE_TIERS.HIGH]: {
      frameRate: 15,       // 15 FPS for high-end devices
      cannyLowThreshold: 50,
      cannyHighThreshold: 150,
      houghRhoResolution: 1,
      houghThetaResolution: Math.PI / 180,
      houghThreshold: 50,
      minLineLength: 30,
      maxLineGap: 10,
      useFastMode: false,
      skipFrames: 1        // Process every frame
    }
  };
  
  /**
   * Assess device performance and return appropriate tier
   * @returns Device performance tier
   */
  static assessDevicePerformance(): DeviceMetrics['performanceTier'] {
    try {
      // Get device information
      const deviceInfo = this.getDeviceInfo();
      
      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore(deviceInfo);
      
      // Determine tier based on score
      if (performanceScore >= 80) {
        return this.PERFORMANCE_TIERS.HIGH;
      } else if (performanceScore >= 50) {
        return this.PERFORMANCE_TIERS.MEDIUM;
      } else {
        return this.PERFORMANCE_TIERS.LOW;
      }
    } catch (error) {
      console.warn('Could not assess device performance, using medium tier:', error);
      return this.PERFORMANCE_TIERS.MEDIUM;
    }
  }
  
  /**
   * Get device information for performance assessment
   */
  private static getDeviceInfo(): Partial<DeviceMetrics> {
    const deviceInfo: Partial<DeviceMetrics> = {};
    
    try {
      // Try to get CPU information
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        deviceInfo.cpuCores = navigator.hardwareConcurrency;
      }
      
      // Try to get memory information
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        deviceInfo.memoryGB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
      }
      
      // Try to get device platform information
      if (typeof navigator !== 'undefined' && navigator.platform) {
        // Basic platform detection
        const platform = navigator.platform.toLowerCase();
        if (platform.includes('iphone') || platform.includes('ipad')) {
          deviceInfo.gpuType = 'Apple GPU';
        } else if (platform.includes('android')) {
          deviceInfo.gpuType = 'Adreno/Mali';
        } else {
          deviceInfo.gpuType = 'Unknown';
        }
      }
      
    } catch (error) {
      console.warn('Error getting device info:', error);
    }
    
    return deviceInfo;
  }
  
  /**
   * Calculate performance score based on device metrics
   */
  private static calculatePerformanceScore(deviceInfo: Partial<DeviceMetrics>): number {
    let score = 50; // Base score
    
    // CPU cores factor (0-20 points)
    if (deviceInfo.cpuCores) {
      if (deviceInfo.cpuCores >= 8) score += 20;
      else if (deviceInfo.cpuCores >= 6) score += 15;
      else if (deviceInfo.cpuCores >= 4) score += 10;
      else if (deviceInfo.cpuCores >= 2) score += 5;
    }
    
    // Memory factor (0-20 points)
    if (deviceInfo.memoryGB) {
      if (deviceInfo.memoryGB >= 8) score += 20;
      else if (deviceInfo.memoryGB >= 6) score += 15;
      else if (deviceInfo.memoryGB >= 4) score += 10;
      else if (deviceInfo.memoryGB >= 2) score += 5;
    }
    
    // GPU factor (0-10 points)
    if (deviceInfo.gpuType) {
      if (deviceInfo.gpuType.includes('Apple')) score += 10;
      else if (deviceInfo.gpuType.includes('Adreno')) score += 8;
      else if (deviceInfo.gpuType.includes('Mali')) score += 6;
      else score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Get optimized processing parameters for current device
   * @param performanceTier - Device performance tier
   * @returns Optimized processing parameters
   */
  static getOptimizedParameters(
    performanceTier: DeviceMetrics['performanceTier'] = 'medium'
  ): ProcessingParams {
    const profile = this.PERFORMANCE_PROFILES[performanceTier];
    
    return {
      cannyLowThreshold: profile.cannyLowThreshold,
      cannyHighThreshold: profile.cannyHighThreshold,
      houghRhoResolution: profile.houghRhoResolution,
      houghThetaResolution: profile.houghThetaResolution,
      houghThreshold: profile.houghThreshold,
      minLineLength: profile.minLineLength,
      maxLineGap: profile.maxLineGap
    };
  }
  
  /**
   * Get frame processing strategy for current device
   * @param performanceTier - Device performance tier
   * @returns Frame processing configuration
   */
  static getFrameProcessingStrategy(
    performanceTier: DeviceMetrics['performanceTier'] = 'medium'
  ): {
    frameRate: number;
    skipFrames: number;
    useFastMode: boolean;
    maxProcessingTime: number;
  } {
    const profile = this.PERFORMANCE_PROFILES[performanceTier];
    
    return {
      frameRate: profile.frameRate,
      skipFrames: profile.skipFrames,
      useFastMode: profile.useFastMode,
      maxProcessingTime: 1000 / profile.frameRate // Max time per frame
    };
  }
  
  /**
   * Adaptive frame skipping based on performance
   */
  static shouldProcessFrame(
    frameCount: number,
    performanceTier: DeviceMetrics['performanceTier'] = 'medium'
  ): boolean {
    const profile = this.PERFORMANCE_PROFILES[performanceTier];
    return frameCount % profile.skipFrames === 0;
  }
  
  /**
   * Dynamic quality adjustment based on real-time performance
   */
  static adjustQualityDynamically(
    currentParams: ProcessingParams,
    performanceMetrics: {
      processingTime: number;
      frameRate: number;
      memoryUsage: number;
      errorRate: number;
    },
    targetFrameRate: number = 10
  ): ProcessingParams {
    const adjustedParams = { ...currentParams };
    
    // Adjust based on processing time
    if (performanceMetrics.processingTime > (1000 / targetFrameRate)) {
      // Processing too slow, reduce quality
      adjustedParams.cannyLowThreshold = Math.min(200, adjustedParams.cannyLowThreshold + 10);
      adjustedParams.cannyHighThreshold = Math.min(250, adjustedParams.cannyHighThreshold + 15);
      adjustedParams.houghThreshold = Math.max(20, adjustedParams.houghThreshold - 5);
      adjustedParams.houghRhoResolution = Math.min(5, adjustedParams.houghRhoResolution + 0.5);
    } else if (performanceMetrics.processingTime < (1000 / targetFrameRate) * 0.5) {
      // Processing too fast, can increase quality
      adjustedParams.cannyLowThreshold = Math.max(30, adjustedParams.cannyLowThreshold - 5);
      adjustedParams.cannyHighThreshold = Math.max(100, adjustedParams.cannyHighThreshold - 10);
      adjustedParams.houghThreshold = Math.min(80, adjustedParams.houghThreshold + 5);
      adjustedParams.houghRhoResolution = Math.max(1, adjustedParams.houghRhoResolution - 0.2);
    }
    
    // Adjust based on error rate
    if (performanceMetrics.errorRate > 0.1) {
      // High error rate, reduce complexity
      adjustedParams.houghThreshold = Math.max(20, adjustedParams.houghThreshold - 10);
      adjustedParams.minLineLength = Math.max(20, adjustedParams.minLineLength + 10);
    }
    
    return adjustedParams;
  }
  
  /**
   * Memory management and optimization
   */
  static optimizeMemoryUsage(
    currentMemoryUsage: number,
    maxMemoryUsage: number = 100 * 1024 * 1024 // 100MB
  ): {
    shouldReduceQuality: boolean;
    shouldSkipFrames: boolean;
    shouldClearCache: boolean;
  } {
    const memoryUsagePercent = (currentMemoryUsage / maxMemoryUsage) * 100;
    
    return {
      shouldReduceQuality: memoryUsagePercent > 70,
      shouldSkipFrames: memoryUsagePercent > 85,
      shouldClearCache: memoryUsagePercent > 90
    };
  }
  
  /**
   * Battery usage optimization
   */
  static getBatteryOptimizationSettings(
    batteryLevel: number | null,
    isCharging: boolean = false
  ): {
    frameRate: number;
    qualityLevel: 'low' | 'medium' | 'high';
    processingMode: 'conservative' | 'balanced' | 'aggressive';
  } {
    if (batteryLevel === null) {
      return { frameRate: 10, qualityLevel: 'medium', processingMode: 'balanced' };
    }
    
    if (isCharging) {
      // Full performance when charging
      return { frameRate: 15, qualityLevel: 'high', processingMode: 'aggressive' };
    }
    
    if (batteryLevel < 20) {
      // Very low battery, conservative mode
      return { frameRate: 5, qualityLevel: 'low', processingMode: 'conservative' };
    } else if (batteryLevel < 50) {
      // Low battery, balanced mode
      return { frameRate: 8, qualityLevel: 'medium', processingMode: 'balanced' };
    } else {
      // Good battery, normal mode
      return { frameRate: 12, qualityLevel: 'medium', processingMode: 'balanced' };
    }
  }
  
  /**
   * Performance monitoring and reporting
   */
  static createPerformanceMonitor() {
    let frameCount = 0;
    let totalProcessingTime = 0;
    let errorCount = 0;
    let lastReportTime = Date.now();
    
    const recordFrame = (processingTime: number, hadError: boolean = false) => {
      frameCount++;
      totalProcessingTime += processingTime;
      if (hadError) errorCount++;
      
      // Report every 30 frames
      if (frameCount % 30 === 0) {
        const currentTime = Date.now();
        const timeSpan = (currentTime - lastReportTime) / 1000;
        const avgProcessingTime = totalProcessingTime / frameCount;
        const fps = frameCount / timeSpan;
        const errorRate = errorCount / frameCount;
        
        console.log(`Performance Monitor: ${fps.toFixed(1)} FPS, Avg: ${avgProcessingTime.toFixed(1)}ms, Errors: ${(errorRate * 100).toFixed(1)}%`);
        
        // Reset counters
        frameCount = 0;
        totalProcessingTime = 0;
        errorCount = 0;
        lastReportTime = currentTime;
      }
    };
    
    return { recordFrame };
  }
}
