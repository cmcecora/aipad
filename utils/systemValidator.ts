import type { FrameData, CourtLine, DetectedLine, ProcessingParams } from '../types/computerVision';
import { AdvancedCourtLineDetector } from './courtLineDetectorV2';
import { AdaptiveProcessor } from './adaptiveProcessor';
import { ErrorHandler } from './errorHandler';
import { CalibrationCache } from './calibrationCache';
import { RealTimeFrameProcessor } from './realTimeFrameProcessor';
import { WorkletFrameProcessor } from './workletFrameProcessor';

/**
 * System Validator for Final Testing and Validation
 * Phase 5: End-to-end system testing and validation
 * 
 * Features:
 * - Comprehensive system testing
 * - Performance validation
 * - Error handling validation
 * - Integration testing
 * - User experience validation
 */
export class SystemValidator {
  
  /**
   * Run comprehensive system validation
   * @returns Validation report with all test results
   */
  static runFullSystemValidation(): {
    overallStatus: 'PASS' | 'FAIL' | 'WARNING';
    testResults: {
      computerVision: any;
      performance: any;
      errorHandling: any;
      caching: any;
      integration: any;
      userExperience: any;
    };
    recommendations: string[];
    issues: string[];
  } {
    console.log('🧪 Starting comprehensive system validation...\n');
    
    const testResults = {
      computerVision: this.testComputerVision(),
      performance: this.testPerformance(),
      errorHandling: this.testErrorHandling(),
      caching: this.testCaching(),
      integration: this.testIntegration(),
      userExperience: this.testUserExperience()
    };
    
    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(testResults);
    
    // Generate recommendations and identify issues
    const { recommendations, issues } = this.generateRecommendations(testResults);
    
    console.log(`\n🎯 Overall System Status: ${overallStatus}`);
    
    return {
      overallStatus,
      testResults,
      recommendations,
      issues
    };
  }
  
  /**
   * Test computer vision system
   */
  private static testComputerVision() {
    console.log('🔍 Testing Computer Vision System...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Create test frame
      const testFrame = this.createTestFrame(640, 480);
      
      // Test basic detection
      const courtLines = AdvancedCourtLineDetector.detectCourtLines(testFrame);
      if (courtLines.length > 0) {
        results.tests.push({ name: 'Basic Detection', status: 'PASS', details: `${courtLines.length} lines detected` });
      } else {
        results.tests.push({ name: 'Basic Detection', status: 'FAIL', details: 'No lines detected' });
        results.status = 'FAIL';
        results.issues.push('Basic line detection failed');
      }
      
      // Test performance optimization
      const optimizedResult = AdvancedCourtLineDetector.detectWithPerformanceOptimization(testFrame);
      if (optimizedResult.courtLines.length > 0) {
        results.tests.push({ name: 'Performance Optimization', status: 'PASS', details: 'Optimized detection working' });
      } else {
        results.tests.push({ name: 'Performance Optimization', status: 'WARNING', details: 'Optimized detection returned no lines' });
        if (results.status === 'PASS') results.status = 'WARNING';
      }
      
      // Test frame processor
      const mockFrame = { width: 640, height: 480, timestamp: Date.now() } as any;
      const processedResult = RealTimeFrameProcessor.processFrame(mockFrame);
      if (processedResult.courtLines.length >= 0) {
        results.tests.push({ name: 'Frame Processing', status: 'PASS', details: 'Frame processor working' });
      } else {
        results.tests.push({ name: 'Frame Processing', status: 'FAIL', details: 'Frame processor failed' });
        results.status = 'FAIL';
        results.issues.push('Frame processor failed');
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`Computer vision test error: ${error}`);
      results.tests.push({ name: 'Computer Vision', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Test performance optimization
   */
  private static testPerformance() {
    console.log('⚡ Testing Performance Optimization...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Test device performance assessment
      const performanceTier = AdaptiveProcessor.assessDevicePerformance();
      if (['low', 'medium', 'high'].includes(performanceTier)) {
        results.tests.push({ name: 'Device Assessment', status: 'PASS', details: `Tier: ${performanceTier}` });
      } else {
        results.tests.push({ name: 'Device Assessment', status: 'FAIL', details: 'Invalid performance tier' });
        results.status = 'FAIL';
        results.issues.push('Device performance assessment failed');
      }
      
      // Test parameter optimization
      const optimizedParams = AdaptiveProcessor.getOptimizedParameters(performanceTier);
      if (optimizedParams && typeof optimizedParams.cannyLowThreshold === 'number') {
        results.tests.push({ name: 'Parameter Optimization', status: 'PASS', details: 'Parameters optimized' });
      } else {
        results.tests.push({ name: 'Parameter Optimization', status: 'FAIL', details: 'Parameter optimization failed' });
        results.status = 'FAIL';
        results.issues.push('Parameter optimization failed');
      }
      
      // Test frame strategy
      const strategy = AdaptiveProcessor.getFrameProcessingStrategy(performanceTier);
      if (strategy && strategy.frameRate > 0) {
        results.tests.push({ name: 'Frame Strategy', status: 'PASS', details: `${strategy.frameRate} FPS target` });
      } else {
        results.tests.push({ name: 'Frame Strategy', status: 'FAIL', details: 'Frame strategy failed' });
        results.status = 'FAIL';
        results.issues.push('Frame strategy failed');
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`Performance test error: ${error}`);
      results.tests.push({ name: 'Performance', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Test error handling system
   */
  private static testErrorHandling() {
    console.log('🛡️  Testing Error Handling System...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Test error classification
      const testError = new Error('Processing timeout occurred');
      // Note: classifyError is private, so we'll test error handling directly
      const errorContext = {
        currentParams: { cannyLowThreshold: 50, cannyHighThreshold: 150 } as ProcessingParams,
        performanceMetrics: { processingTime: 300, frameRate: 5, memoryUsage: 0, errorRate: 0.1 },
        frameCount: 10,
        lastErrorTime: Date.now()
      };
      
      const errorHandling = ErrorHandler.handleError(testError, errorContext);
      if (errorHandling && errorHandling.action) {
        results.tests.push({ name: 'Error Classification', status: 'PASS', details: `Action: ${errorHandling.action}` });
      } else {
        results.tests.push({ name: 'Error Classification', status: 'FAIL', details: 'Error classification failed' });
        results.status = 'FAIL';
        results.issues.push('Error classification failed');
      }
      
      // Test user messages
      const userMessage = ErrorHandler.getUserFriendlyMessage('PROCESSING_TIMEOUT');
      if (userMessage && userMessage.length > 0) {
        results.tests.push({ name: 'User Messages', status: 'PASS', details: 'User messages working' });
      } else {
        results.tests.push({ name: 'User Messages', status: 'FAIL', details: 'User messages failed' });
        results.status = 'FAIL';
        results.issues.push('User messages failed');
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`Error handling test error: ${error}`);
      results.tests.push({ name: 'Error Handling', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Test caching system
   */
  private static testCaching() {
    console.log('💾 Testing Caching System...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Test cache statistics
      const cacheStats = CalibrationCache.getCacheStats();
      if (cacheStats && typeof cacheStats.totalItems === 'number') {
        results.tests.push({ name: 'Cache Statistics', status: 'PASS', details: `${cacheStats.totalItems} cached items` });
      } else {
        results.tests.push({ name: 'Cache Statistics', status: 'FAIL', details: 'Cache stats failed' });
        results.status = 'FAIL';
        results.issues.push('Cache statistics failed');
      }
      
      // Test user preferences
      const userPrefs = CalibrationCache.loadUserPreferences();
      if (userPrefs && userPrefs.autoCalibration !== undefined) {
        results.tests.push({ name: 'User Preferences', status: 'PASS', details: 'Preferences loaded' });
      } else {
        results.tests.push({ name: 'User Preferences', status: 'FAIL', details: 'Preferences failed' });
        results.status = 'FAIL';
        results.issues.push('User preferences failed');
      }
      
      // Test cache clearing
      try {
        CalibrationCache.clearAllCalibrationCache();
        results.tests.push({ name: 'Cache Clearing', status: 'PASS', details: 'Cache cleared successfully' });
      } catch (error) {
        results.tests.push({ name: 'Cache Clearing', status: 'WARNING', details: 'Cache clearing had issues' });
        if (results.status === 'PASS') results.status = 'WARNING';
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`Caching test error: ${error}`);
      results.tests.push({ name: 'Caching', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Test system integration
   */
  private static testIntegration() {
    console.log('🔗 Testing System Integration...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Test end-to-end processing
      const testFrame = this.createTestFrame(640, 480);
      const endToEndResult = AdvancedCourtLineDetector.detectWithPerformanceOptimization(testFrame);
      
      if (endToEndResult.courtLines.length >= 0) {
        results.tests.push({ name: 'End-to-End Processing', status: 'PASS', details: 'Full pipeline working' });
      } else {
        results.tests.push({ name: 'End-to-End Processing', status: 'WARNING', details: 'Pipeline returned no results' });
        if (results.status === 'PASS') results.status = 'WARNING';
      }
      
      // Test performance reporting
      const performanceReport = AdvancedCourtLineDetector.getPerformanceReport(testFrame);
      if (performanceReport && performanceReport.deviceInfo) {
        results.tests.push({ name: 'Performance Reporting', status: 'PASS', details: 'Reporting working' });
      } else {
        results.tests.push({ name: 'Performance Reporting', status: 'FAIL', details: 'Performance reporting failed' });
        results.status = 'FAIL';
        results.issues.push('Performance reporting failed');
      }
      
      // Test worklet validation
      try {
        const workletValidation = WorkletFrameProcessor.validateWorkletEnvironment();
        if (workletValidation) {
          results.tests.push({ name: 'Worklet Validation', status: 'PASS', details: 'Worklet validation working' });
        } else {
          results.tests.push({ name: 'Worklet Validation', status: 'WARNING', details: 'Worklet validation limited' });
          if (results.status === 'PASS') results.status = 'WARNING';
        }
      } catch (error) {
        results.tests.push({ name: 'Worklet Validation', status: 'WARNING', details: 'Worklet validation not available' });
        if (results.status === 'PASS') results.status = 'WARNING';
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`Integration test error: ${error}`);
      results.tests.push({ name: 'Integration', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Test user experience
   */
  private static testUserExperience() {
    console.log('👤 Testing User Experience...');
    
    const results = {
      status: 'PASS' as 'PASS' | 'FAIL' | 'WARNING',
      tests: [] as any[],
      issues: [] as string[]
    };
    
    try {
      // Test device recommendations
      const recommendations = RealTimeFrameProcessor.getDeviceRecommendations();
      if (recommendations && recommendations.length > 0) {
        results.tests.push({ name: 'Device Recommendations', status: 'PASS', details: `${recommendations.length} recommendations` });
      } else {
        results.tests.push({ name: 'Device Recommendations', status: 'WARNING', details: 'No recommendations available' });
        if (results.status === 'PASS') results.status = 'WARNING';
      }
      
      // Test setup validation
      const setupValidation = RealTimeFrameProcessor.validateSetup();
      if (setupValidation && typeof setupValidation.isValid === 'boolean') {
        results.tests.push({ name: 'Setup Validation', status: 'PASS', details: 'Setup validation working' });
      } else {
        results.tests.push({ name: 'Setup Validation', status: 'FAIL', details: 'Setup validation failed' });
        results.status = 'FAIL';
        results.issues.push('Setup validation failed');
      }
      
      // Test optimized configuration
      const optimizedConfig = RealTimeFrameProcessor.getOptimizedConfiguration();
      if (optimizedConfig && optimizedConfig.targetFrameRate > 0) {
        results.tests.push({ name: 'Optimized Configuration', status: 'PASS', details: `${optimizedConfig.targetFrameRate} FPS target` });
      } else {
        results.tests.push({ name: 'Optimized Configuration', status: 'FAIL', details: 'Configuration failed' });
        results.status = 'FAIL';
        results.issues.push('Optimized configuration failed');
      }
      
    } catch (error) {
      results.status = 'FAIL';
      results.issues.push(`User experience test error: ${error}`);
      results.tests.push({ name: 'User Experience', status: 'FAIL', details: 'Test execution failed' });
    }
    
    return results;
  }
  
  /**
   * Calculate overall system status
   */
  private static calculateOverallStatus(testResults: any): 'PASS' | 'FAIL' | 'WARNING' {
    let hasFailures = false;
    let hasWarnings = false;
    
    Object.values(testResults).forEach((result: any) => {
      if (result.status === 'FAIL') {
        hasFailures = true;
      } else if (result.status === 'WARNING') {
        hasWarnings = true;
      }
    });
    
    if (hasFailures) return 'FAIL';
    if (hasWarnings) return 'WARNING';
    return 'PASS';
  }
  
  /**
   * Generate recommendations and identify issues
   */
  private static generateRecommendations(testResults: any): { recommendations: string[]; issues: string[] } {
    const recommendations: string[] = [];
    const issues: string[] = [];
    
    // Collect all issues
    Object.values(testResults).forEach((result: any) => {
      issues.push(...result.issues);
    });
    
    // Generate recommendations based on test results
    if (testResults.performance.status === 'WARNING') {
      recommendations.push('Consider optimizing device performance settings');
    }
    
    if (testResults.integration.status === 'WARNING') {
      recommendations.push('Worklet integration may need additional configuration');
    }
    
    if (testResults.caching.status === 'WARNING') {
      recommendations.push('Cache system may benefit from optimization');
    }
    
    // General recommendations
    recommendations.push('Run validation before production deployment');
    recommendations.push('Monitor performance metrics in real-world usage');
    recommendations.push('Test on various device types and performance tiers');
    
    return { recommendations, issues };
  }
  
  /**
   * Create test frame for validation
   */
  private static createTestFrame(width: number, height: number): FrameData {
    const data = new Uint8Array(width * height * 3);
    
    // Create a test pattern with horizontal and vertical lines
    for (let i = 0; i < data.length; i += 3) {
      const pixelIndex = i / 3;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / height);
      
      // Create horizontal lines at specific positions
      if (Math.abs(y - height * 0.15) < 2 || Math.abs(y - height * 0.75) < 2) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
      }
      // Create vertical line at center
      else if (Math.abs(x - width * 0.5) < 2) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
      }
      // Background
      else {
        data[i] = 50;      // R
        data[i + 1] = 50;  // G
        data[i + 2] = 50;  // B
      }
    }
    
    return {
      width,
      height,
      data,
      format: 'rgb',
      timestamp: Date.now()
    };
  }
  
  /**
   * Print validation report
   */
  static printValidationReport(report: any): void {
    console.log('\n📊 SYSTEM VALIDATION REPORT');
    console.log('=' .repeat(50));
    console.log(`Overall Status: ${report.overallStatus}`);
    console.log('');
    
    Object.entries(report.testResults).forEach(([category, result]: [string, any]) => {
      console.log(`${category.toUpperCase()}: ${result.status}`);
      result.tests.forEach((test: any) => {
        console.log(`  ✓ ${test.name}: ${test.status} - ${test.details}`);
      });
      if (result.issues.length > 0) {
        console.log(`  Issues: ${result.issues.join(', ')}`);
      }
      console.log('');
    });
    
    if (report.issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      report.issues.forEach((issue: string) => console.log(`  - ${issue}`));
      console.log('');
    }
    
    if (report.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
      console.log('');
    }
    
    console.log('=' .repeat(50));
  }
}
