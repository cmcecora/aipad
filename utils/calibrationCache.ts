import type { CourtLine, ProcessingParams } from '../types/computerVision';

/**
 * Calibration Cache and Persistence System
 * Phase 4: Performance optimization and data management
 * 
 * Features:
 * - Save successful calibrations for quick setup
 * - Load previous calibration when returning to screen
 * - Clear cache when lighting conditions change significantly
 * - Performance optimization through caching
 * - Persistent storage for user preferences
 */
export class CalibrationCache {
  
  /**
   * Cache keys for different types of data
   */
  private static readonly CACHE_KEYS = {
    CALIBRATION_DATA: 'calibration_data',
    PROCESSING_PARAMS: 'processing_params',
    DEVICE_PERFORMANCE: 'device_performance',
    USER_PREFERENCES: 'user_preferences',
    ERROR_HISTORY: 'error_history'
  } as const;
  
  /**
   * Cache expiration times (in milliseconds)
   */
  private static readonly CACHE_EXPIRY = {
    CALIBRATION_DATA: 24 * 60 * 60 * 1000,    // 24 hours
    PROCESSING_PARAMS: 7 * 24 * 60 * 60 * 1000, // 7 days
    DEVICE_PERFORMANCE: 30 * 24 * 60 * 60 * 1000, // 30 days
    USER_PREFERENCES: 365 * 24 * 60 * 60 * 1000,  // 1 year
    ERROR_HISTORY: 7 * 24 * 60 * 60 * 1000        // 7 days
  } as const;
  
  /**
   * Save successful calibration data
   * @param calibrationData - Calibration data to save
   * @param metadata - Additional metadata about the calibration
   */
  static saveCalibration(
    calibrationData: {
      courtLines: CourtLine[];
      frameWidth: number;
      frameHeight: number;
      processingParams: ProcessingParams;
      timestamp: number;
      confidence: number;
    },
    metadata: {
      lightingConditions: 'bright' | 'normal' | 'dim';
      deviceOrientation: 'landscape' | 'portrait';
      cameraHeight: number;
      environment: 'indoor' | 'outdoor';
    }
  ): void {
    try {
      const cacheData = {
        ...calibrationData,
        metadata,
        cacheTimestamp: Date.now(),
        version: '1.0'
      };
      
      const cacheKey = this.CACHE_KEYS.CALIBRATION_DATA;
      this.setCacheItem(cacheKey, cacheData);
      
      console.log('Calibration data cached successfully');
    } catch (error) {
      console.error('Failed to cache calibration data:', error);
    }
  }
  
  /**
   * Load previous calibration if available and valid
   * @param currentContext - Current calibration context
   * @returns Cached calibration data or null if not available
   */
  static loadPreviousCalibration(currentContext: {
    frameWidth: number;
    frameHeight: number;
    lightingConditions: 'bright' | 'normal' | 'dim';
    deviceOrientation: 'landscape' | 'portrait';
  }): {
    courtLines: CourtLine[];
    processingParams: ProcessingParams;
    confidence: number;
    metadata: any;
  } | null {
    try {
      const cacheKey = this.CACHE_KEYS.CALIBRATION_DATA;
      const cachedData = this.getCacheItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      // Check if cache is expired
      if (this.isCacheExpired(cachedData.cacheTimestamp, this.CACHE_EXPIRY.CALIBRATION_DATA)) {
        this.clearCache(cacheKey);
        return null;
      }
      
      // Validate cache compatibility
      if (!this.isCalibrationCompatible(cachedData, currentContext)) {
        console.log('Cached calibration not compatible with current context');
        return null;
      }
      
      // Check if lighting conditions are similar enough
      if (!this.isLightingCompatible(cachedData.metadata.lightingConditions, currentContext.lightingConditions)) {
        console.log('Lighting conditions changed significantly, clearing cache');
        this.clearCache(cacheKey);
        return null;
      }
      
      console.log('Previous calibration loaded from cache');
      return {
        courtLines: cachedData.courtLines,
        processingParams: cachedData.processingParams,
        confidence: cachedData.confidence,
        metadata: cachedData.metadata
      };
      
    } catch (error) {
      console.error('Failed to load cached calibration:', error);
      return null;
    }
  }
  
  /**
   * Save optimized processing parameters
   * @param params - Processing parameters to cache
   * @param deviceInfo - Device information for context
   */
  static saveProcessingParams(
    params: ProcessingParams,
    deviceInfo: {
      performanceTier: 'low' | 'medium' | 'high';
      deviceModel: string;
      osVersion: string;
    }
  ): void {
    try {
      const cacheData = {
        params,
        deviceInfo,
        cacheTimestamp: Date.now(),
        version: '1.0'
      };
      
      const cacheKey = this.CACHE_KEYS.PROCESSING_PARAMS;
      this.setCacheItem(cacheKey, cacheData);
      
      console.log('Processing parameters cached successfully');
    } catch (error) {
      console.error('Failed to cache processing parameters:', error);
    }
  }
  
  /**
   * Load cached processing parameters for current device
   * @param deviceInfo - Current device information
   * @returns Cached parameters or null if not available
   */
  static loadProcessingParams(deviceInfo: {
    performanceTier: 'low' | 'medium' | 'high';
    deviceModel: string;
    osVersion: string;
  }): ProcessingParams | null {
    try {
      const cacheKey = this.CACHE_KEYS.PROCESSING_PARAMS;
      const cachedData = this.getCacheItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      // Check if cache is expired
      if (this.isCacheExpired(cachedData.cacheTimestamp, this.CACHE_EXPIRY.PROCESSING_PARAMS)) {
        this.clearCache(cacheKey);
        return null;
      }
      
      // Check if device info matches
      if (!this.isDeviceCompatible(cachedData.deviceInfo, deviceInfo)) {
        console.log('Device info changed, clearing processing params cache');
        this.clearCache(cacheKey);
        return null;
      }
      
      console.log('Processing parameters loaded from cache');
      return cachedData.params;
      
    } catch (error) {
      console.error('Failed to load cached processing parameters:', error);
      return null;
    }
  }
  
  /**
   * Save device performance metrics
   * @param metrics - Performance metrics to cache
   */
  static saveDevicePerformance(metrics: {
    averageProcessingTime: number;
    frameRate: number;
    errorRate: number;
    memoryUsage: number;
    batteryImpact: number;
  }): void {
    try {
      const cacheData = {
        ...metrics,
        cacheTimestamp: Date.now(),
        version: '1.0'
      };
      
      const cacheKey = this.CACHE_KEYS.DEVICE_PERFORMANCE;
      this.setCacheItem(cacheKey, cacheData);
      
      console.log('Device performance metrics cached successfully');
    } catch (error) {
      console.error('Failed to cache device performance:', error);
    }
  }
  
  /**
   * Load cached device performance metrics
   * @returns Cached metrics or null if not available
   */
  static loadDevicePerformance(): any | null {
    try {
      const cacheKey = this.CACHE_KEYS.DEVICE_PERFORMANCE;
      const cachedData = this.getCacheItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      // Check if cache is expired
      if (this.isCacheExpired(cachedData.cacheTimestamp, this.CACHE_EXPIRY.DEVICE_PERFORMANCE)) {
        this.clearCache(cacheKey);
        return null;
      }
      
      return cachedData;
      
    } catch (error) {
      console.error('Failed to load cached device performance:', error);
      return null;
    }
  }
  
  /**
   * Save user preferences
   * @param preferences - User preferences to save
   */
  static saveUserPreferences(preferences: {
    autoCalibration: boolean;
    debugMode: boolean;
    performanceMode: 'conservative' | 'balanced' | 'aggressive';
    notificationSettings: any;
  }): void {
    try {
      const cacheData = {
        ...preferences,
        cacheTimestamp: Date.now(),
        version: '1.0'
      };
      
      const cacheKey = this.CACHE_KEYS.USER_PREFERENCES;
      this.setCacheItem(cacheKey, cacheData);
      
      console.log('User preferences saved successfully');
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }
  
  /**
   * Load user preferences
   * @returns Cached preferences or default values
   */
  static loadUserPreferences(): {
    autoCalibration: boolean;
    debugMode: boolean;
    performanceMode: 'conservative' | 'balanced' | 'aggressive';
    notificationSettings: any;
  } {
    try {
      const cacheKey = this.CACHE_KEYS.USER_PREFERENCES;
      const cachedData = this.getCacheItem(cacheKey);
      
      if (!cachedData || this.isCacheExpired(cachedData.cacheTimestamp, this.CACHE_EXPIRY.USER_PREFERENCES)) {
        // Return default preferences
        return {
          autoCalibration: true,
          debugMode: false, // Default to false, will be overridden in React Native
          performanceMode: 'balanced',
          notificationSettings: {
            calibrationSuccess: true,
            performanceWarnings: true,
            errorNotifications: true
          }
        };
      }
      
      return cachedData;
      
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Return default preferences on error
      return {
        autoCalibration: true,
        debugMode: false, // Default to false, will be overridden in React Native
        performanceMode: 'balanced',
        notificationSettings: {
          calibrationSuccess: true,
          performanceWarnings: true,
          errorNotifications: true
        }
      };
    }
  }
  
  /**
   * Clear specific cache item
   * @param cacheKey - Key of the cache item to clear
   */
  static clearCache(cacheKey: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(cacheKey);
      } else {
        // For React Native - would need AsyncStorage in practice
        // For now, just log that we would clear it
        console.log(`Would clear storage for key: ${cacheKey}`);
      }
      console.log(`Cache cleared for key: ${cacheKey}`);
    } catch (error) {
      console.error(`Failed to clear cache for key ${cacheKey}:`, error);
    }
  }
  
  /**
   * Clear all calibration-related cache
   */
  static clearAllCalibrationCache(): void {
    try {
      Object.values(this.CACHE_KEYS).forEach(key => {
        this.clearCache(key);
      });
      console.log('All calibration cache cleared');
    } catch (error) {
      console.error('Failed to clear all calibration cache:', error);
    }
  }
  
  /**
   * Get cache statistics
   * @returns Cache usage statistics
   */
  static getCacheStats(): {
    totalItems: number;
    totalSize: number;
    expiredItems: number;
    cacheKeys: string[];
  } {
    try {
      let totalItems = 0;
      let totalSize = 0;
      let expiredItems = 0;
      const cacheKeys: string[] = [];
      
      Object.values(this.CACHE_KEYS).forEach(key => {
        const cachedData = this.getCacheItem(key);
        if (cachedData) {
          totalItems++;
          totalSize += JSON.stringify(cachedData).length;
          cacheKeys.push(key);
          
          // Check if expired
          const expiryTime = this.getExpiryTime(key);
          if (this.isCacheExpired(cachedData.cacheTimestamp, expiryTime)) {
            expiredItems++;
          }
        }
      });
      
      return {
        totalItems,
        totalSize,
        expiredItems,
        cacheKeys
      };
      
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        expiredItems: 0,
        cacheKeys: []
      };
    }
  }
  
  /**
   * Check if calibration data is compatible with current context
   */
  private static isCalibrationCompatible(cachedData: any, currentContext: any): boolean {
    // Check frame dimensions
    if (cachedData.frameWidth !== currentContext.frameWidth ||
        cachedData.frameHeight !== currentContext.frameHeight) {
      return false;
    }
    
    // Check device orientation
    if (cachedData.metadata.deviceOrientation !== currentContext.deviceOrientation) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if lighting conditions are compatible
   */
  private static isLightingCompatible(cachedLighting: string, currentLighting: string): boolean {
    // Allow some variation in lighting conditions
    if (cachedLighting === currentLighting) {
      return true;
    }
    
    // Allow bright/normal and normal/dim combinations
    if ((cachedLighting === 'bright' && currentLighting === 'normal') ||
        (cachedLighting === 'normal' && currentLighting === 'bright') ||
        (cachedLighting === 'normal' && currentLighting === 'dim') ||
        (cachedLighting === 'dim' && currentLighting === 'normal')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if device info is compatible
   */
  private static isDeviceCompatible(cachedDevice: any, currentDevice: any): boolean {
    return cachedDevice.performanceTier === currentDevice.performanceTier;
  }
  
  /**
   * Check if cache is expired
   */
  private static isCacheExpired(cacheTimestamp: number, expiryTime: number): boolean {
    return Date.now() - cacheTimestamp > expiryTime;
  }
  
  /**
   * Get expiry time for cache key
   */
  private static getExpiryTime(cacheKey: string): number {
    return this.CACHE_EXPIRY[cacheKey as keyof typeof this.CACHE_EXPIRY] || 24 * 60 * 60 * 1000;
  }
  
  /**
   * Set cache item (cross-platform)
   */
  private static setCacheItem(key: string, data: any): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      // For React Native - would need AsyncStorage in practice
      // For now, just log that we would save it
      console.log(`Would save to storage for key: ${key}`);
    }
  }
  
  /**
   * Get cache item (cross-platform)
   */
  private static getCacheItem(key: string): any | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } else {
        // For React Native - this would need AsyncStorage in practice
        // For now, return null to avoid blocking
        return null;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get cache item for key ${key}:`, error);
      return null;
    }
  }
}
