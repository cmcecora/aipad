import type { ProcessingParams } from '../types/computerVision';

/**
 * Enhanced Error Handling and Quality Management
 * Phase 4: Performance optimization and error handling
 * 
 * Features:
 * - Comprehensive error handling
 * - Quality degradation strategies
 * - Error recovery mechanisms
 * - User feedback and guidance
 * - Performance fallback options
 */
export class ErrorHandler {
  
  /**
   * Error types for computer vision processing
   */
  static readonly ERROR_TYPES = {
    PROCESSING_TIMEOUT: 'processing_timeout',
    MEMORY_OVERFLOW: 'memory_overflow',
    DETECTION_FAILURE: 'detection_failure',
    QUALITY_DEGRADATION: 'quality_degradation',
    CAMERA_ERROR: 'camera_error',
    UNKNOWN_ERROR: 'unknown_error'
  } as const;
  
  /**
   * Error severity levels
   */
  static readonly ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  } as const;
  
  /**
   * Error recovery strategies
   */
  private static readonly RECOVERY_STRATEGIES = {
    [this.ERROR_TYPES.PROCESSING_TIMEOUT]: {
      severity: this.ERROR_SEVERITY.MEDIUM,
      action: 'reduce_quality',
      fallback: 'fast_mode',
      userMessage: 'Processing is taking longer than expected. Reducing quality for better performance.',
      autoRecover: true
    },
    [this.ERROR_TYPES.MEMORY_OVERFLOW]: {
      severity: this.ERROR_SEVERITY.HIGH,
      action: 'clear_cache',
      fallback: 'low_quality',
      userMessage: 'Memory usage is high. Clearing cache and reducing quality.',
      autoRecover: true
    },
    [this.ERROR_TYPES.DETECTION_FAILURE]: {
      severity: this.ERROR_SEVERITY.MEDIUM,
      action: 'adjust_parameters',
      fallback: 'retry',
      userMessage: 'Line detection failed. Adjusting parameters and retrying.',
      autoRecover: true
    },
    [this.ERROR_TYPES.QUALITY_DEGRADATION]: {
      severity: this.ERROR_SEVERITY.LOW,
      action: 'monitor',
      fallback: 'none',
      userMessage: 'Image quality is low. Consider adjusting camera position or lighting.',
      autoRecover: false
    },
    [this.ERROR_TYPES.CAMERA_ERROR]: {
      severity: this.ERROR_SEVERITY.CRITICAL,
      action: 'restart_camera',
      fallback: 'manual_mode',
      userMessage: 'Camera error detected. Please restart the camera or use manual mode.',
      autoRecover: false
    },
    [this.ERROR_TYPES.UNKNOWN_ERROR]: {
      severity: this.ERROR_SEVERITY.MEDIUM,
      action: 'reset',
      fallback: 'safe_mode',
      userMessage: 'An unexpected error occurred. Resetting to safe mode.',
      autoRecover: true
    }
  };
  
  /**
   * Handle processing errors and implement recovery strategies
   * @param error - Error object or string
   * @param context - Processing context information
   * @returns Recovery action and user feedback
   */
  static handleError(
    error: Error | string,
    context: {
      currentParams: ProcessingParams;
      performanceMetrics: any;
      frameCount: number;
      lastErrorTime: number;
    }
  ): {
    action: string;
    fallback: string;
    userMessage: string;
    shouldAutoRecover: boolean;
    newParams?: Partial<ProcessingParams>;
  } {
    const errorType = this.classifyError(error);
    const strategy = this.RECOVERY_STRATEGIES[errorType as keyof typeof this.RECOVERY_STRATEGIES] || this.RECOVERY_STRATEGIES.processing_timeout;
    
    // Log error for debugging
    this.logError(error, errorType, context);
    
    // Check if we should implement exponential backoff
    const shouldBackoff = this.shouldImplementBackoff(context.lastErrorTime);
    
    // Generate recovery action
    const recoveryAction = this.generateRecoveryAction(
      strategy,
      context,
      shouldBackoff
    );
    
    return {
      action: recoveryAction.action,
      fallback: recoveryAction.fallback,
      userMessage: strategy.userMessage,
      shouldAutoRecover: strategy.autoRecover && !shouldBackoff,
      newParams: recoveryAction.newParams
    };
  }
  
  /**
   * Classify error type based on error content
   */
  private static classifyError(error: Error | string): keyof typeof this.ERROR_TYPES {
    const errorMessage = error instanceof Error ? error.message : error;
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
      return 'PROCESSING_TIMEOUT';
    }
    
    if (lowerMessage.includes('memory') || lowerMessage.includes('overflow')) {
      return 'MEMORY_OVERFLOW';
    }
    
    if (lowerMessage.includes('detection') || lowerMessage.includes('no lines')) {
      return 'DETECTION_FAILURE';
    }
    
    if (lowerMessage.includes('quality') || lowerMessage.includes('blur')) {
      return 'QUALITY_DEGRADATION';
    }
    
    if (lowerMessage.includes('camera') || lowerMessage.includes('permission')) {
      return 'CAMERA_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  /**
   * Generate recovery action based on error strategy and context
   */
  private static generateRecoveryAction(
    strategy: any,
    context: any,
    shouldBackoff: boolean
  ): {
    action: string;
    fallback: string;
    newParams?: Partial<ProcessingParams>;
  } {
    const { action, fallback } = strategy;
    
    switch (action) {
      case 'reduce_quality':
        return {
          action: 'reduce_quality',
          fallback,
          newParams: this.generateReducedQualityParams(context.currentParams)
        };
        
      case 'clear_cache':
        return {
          action: 'clear_cache',
          fallback,
          newParams: context.currentParams // Keep current params
        };
        
      case 'adjust_parameters':
        return {
          action: 'adjust_parameters',
          fallback,
          newParams: this.generateAdjustedParams(context.currentParams, context.performanceMetrics)
        };
        
      case 'restart_camera':
        return {
          action: 'restart_camera',
          fallback,
          newParams: context.currentParams
        };
        
      case 'reset':
        return {
          action: 'reset',
          fallback,
          newParams: this.generateSafeModeParams()
        };
        
      default:
        return {
          action: 'monitor',
          fallback,
          newParams: context.currentParams
        };
    }
  }
  
  /**
   * Generate reduced quality parameters for performance issues
   */
  private static generateReducedQualityParams(currentParams: ProcessingParams): Partial<ProcessingParams> {
    return {
      cannyLowThreshold: Math.min(200, currentParams.cannyLowThreshold + 20),
      cannyHighThreshold: Math.min(250, currentParams.cannyHighThreshold + 30),
      houghThreshold: Math.max(20, currentParams.houghThreshold - 10),
      houghRhoResolution: Math.min(5, currentParams.houghRhoResolution + 1),
      houghThetaResolution: Math.min(Math.PI / 60, currentParams.houghThetaResolution * 2),
      minLineLength: Math.max(50, currentParams.minLineLength + 20),
      maxLineGap: Math.max(25, currentParams.maxLineGap + 10)
    };
  }
  
  /**
   * Generate adjusted parameters based on performance metrics
   */
  private static generateAdjustedParams(
    currentParams: ProcessingParams,
    performanceMetrics: any
  ): Partial<ProcessingParams> {
    const adjustedParams = { ...currentParams };
    
    // Adjust based on processing time
    if (performanceMetrics.processingTime > 200) {
      adjustedParams.houghThreshold = Math.max(20, adjustedParams.houghThreshold - 15);
      adjustedParams.minLineLength = Math.max(40, adjustedParams.minLineLength + 15);
    }
    
    // Adjust based on error rate
    if (performanceMetrics.errorRate > 0.15) {
      adjustedParams.cannyLowThreshold = Math.min(200, adjustedParams.cannyLowThreshold + 15);
      adjustedParams.cannyHighThreshold = Math.min(250, adjustedParams.cannyHighThreshold + 25);
    }
    
    return adjustedParams;
  }
  
  /**
   * Generate safe mode parameters for critical errors
   */
  private static generateSafeModeParams(): ProcessingParams {
    return {
      cannyLowThreshold: 100,
      cannyHighThreshold: 220,
      houghRhoResolution: 3,
      houghThetaResolution: Math.PI / 60,
      houghThreshold: 25,
      minLineLength: 60,
      maxLineGap: 30
    };
  }
  
  /**
   * Check if we should implement exponential backoff
   */
  private static shouldImplementBackoff(lastErrorTime: number): boolean {
    const timeSinceLastError = Date.now() - lastErrorTime;
    const backoffThreshold = 5000; // 5 seconds
    
    return timeSinceLastError < backoffThreshold;
  }
  
  /**
   * Log error for debugging and monitoring
   */
  private static logError(
    error: Error | string,
    errorType: string,
    context: any
  ): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage: error instanceof Error ? error.message : error,
      stackTrace: error instanceof Error ? error.stack : undefined,
      context: {
        frameCount: context.frameCount,
        performanceMetrics: context.performanceMetrics,
        currentParams: context.currentParams
      }
    };
    
    console.error('Computer Vision Error:', errorInfo);
    
    // In production, this could send to analytics service
    // this.sendErrorToAnalytics(errorInfo);
  }
  
  /**
   * Get user-friendly error messages
   */
  static getUserFriendlyMessage(errorType: string): string {
    const messages = {
      [this.ERROR_TYPES.PROCESSING_TIMEOUT]: 'Processing is taking longer than expected. Please wait or try adjusting your position.',
      [this.ERROR_TYPES.MEMORY_OVERFLOW]: 'System is using a lot of memory. The app will automatically optimize performance.',
      [this.ERROR_TYPES.DETECTION_FAILURE]: 'Having trouble detecting court lines. Try moving the camera or improving lighting.',
      [this.ERROR_TYPES.QUALITY_DEGRADATION]: 'Image quality is low. Try holding the camera steady and ensuring good lighting.',
      [this.ERROR_TYPES.CAMERA_ERROR]: 'Camera issue detected. Please check camera permissions and try again.',
      [this.ERROR_TYPES.UNKNOWN_ERROR]: 'Something unexpected happened. The app will try to recover automatically.'
    };
    
    return messages[errorType as keyof typeof messages] || messages[this.ERROR_TYPES.UNKNOWN_ERROR];
  }
  
  /**
   * Get recovery suggestions for users
   */
  static getRecoverySuggestions(errorType: string): string[] {
    const suggestions = {
      [this.ERROR_TYPES.PROCESSING_TIMEOUT]: [
        'Hold the camera steady',
        'Reduce camera movement',
        'Wait a few seconds for processing'
      ],
      [this.ERROR_TYPES.MEMORY_OVERFLOW]: [
        'Close other apps to free memory',
        'Restart the app if issues persist'
      ],
      [this.ERROR_TYPES.DETECTION_FAILURE]: [
        'Ensure court lines are clearly visible',
        'Improve lighting conditions',
        'Hold camera parallel to court surface',
        'Try different camera angles'
      ],
      [this.ERROR_TYPES.QUALITY_DEGRADATION]: [
        'Clean camera lens',
        'Improve lighting',
        'Hold camera steady',
        'Reduce camera shake'
      ],
      [this.ERROR_TYPES.CAMERA_ERROR]: [
        'Check camera permissions in settings',
        'Restart the app',
        'Ensure camera is not used by other apps'
      ],
      [this.ERROR_TYPES.UNKNOWN_ERROR]: [
        'Try restarting the app',
        'Check for app updates',
        'Contact support if issues persist'
      ]
    };
    
    return suggestions[errorType as keyof typeof suggestions] || suggestions[this.ERROR_TYPES.UNKNOWN_ERROR];
  }
  
  /**
   * Monitor error patterns for proactive optimization
   */
  static createErrorMonitor() {
    let errorCounts: Record<string, number> = {};
    let errorTimestamps: Record<string, number[]> = {};
    
    const recordError = (errorType: string) => {
      // Increment error count
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      
      // Record timestamp
      if (!errorTimestamps[errorType]) {
        errorTimestamps[errorType] = [];
      }
      errorTimestamps[errorType].push(Date.now());
      
      // Keep only recent timestamps (last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      errorTimestamps[errorType] = errorTimestamps[errorType].filter(
        timestamp => timestamp > fiveMinutesAgo
      );
    };
    
    const getErrorStats = () => {
      const stats: Record<string, any> = {};
      
      Object.keys(errorCounts).forEach(errorType => {
        const recentErrors = errorTimestamps[errorType].length;
        const totalErrors = errorCounts[errorType];
        
        stats[errorType] = {
          total: totalErrors,
          recent: recentErrors,
          rate: recentErrors / 5 // errors per minute
        };
      });
      
      return stats;
    };
    
    const shouldEscalate = (errorType: string): boolean => {
      const stats = getErrorStats();
      const errorStat = stats[errorType];
      
      if (!errorStat) return false;
      
      // Escalate if more than 10 errors in 5 minutes
      return errorStat.recent > 10;
    };
    
    return {
      recordError,
      getErrorStats,
      shouldEscalate
    };
  }
}
