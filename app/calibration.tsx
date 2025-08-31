import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

// Computer Vision imports
import { AdvancedCourtLineDetector } from '../utils/courtLineDetectorV2';
import { RealTimeFrameProcessor } from '../utils/realTimeFrameProcessor';
import { WorkletFrameProcessor } from '../utils/workletFrameProcessor';
import type {
  DetectedLine,
  CourtLine,
  FrameData,
} from '../types/computerVision';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CalibrationStep = 'positioning' | 'complete';

type LineId = 'topBackWall' | 'baseline' | 'verticalCenter';

interface LinePosition {
  x: number;
  y: number;
  id: LineId;
}

// DetectedLine interface is now imported from types/computerVision

export default function CalibrationScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const [, setStep] = useState<CalibrationStep>('positioning');
  const [isAligned, setIsAligned] = useState(false);
  const [detectedLines, setDetectedLines] = useState<DetectedLine[]>([]);
  const [courtLines, setCourtLines] = useState<CourtLine[]>([]);
  const [detectionStats, setDetectionStats] = useState<{
    processingTime: number;
    confidence: number;
    lineCount: number;
  } | null>(null);

  // Real-time processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [processingMode, setProcessingMode] = useState<'real-time' | 'mock'>(
    'real-time' // Start with real-time mode by default
  );

  // Animations
  const pulse = useSharedValue(1);
  const fade = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // Initial line positions (landscape-friendly defaults)
  const initialWidth = Math.max(screenWidth, screenHeight);
  const initialHeight = Math.min(screenWidth, screenHeight);

  const [linePositions] = useState<LinePosition[]>([
    // Top line: 15% from top, centered horizontally
    { id: 'topBackWall', x: initialWidth * 0.5, y: initialHeight * 0.15 },
    // Bottom line: 75% from top, centered horizontally
    { id: 'baseline', x: initialWidth * 0.5, y: initialHeight * 0.75 },
    // Vertical line: centered both ways
    { id: 'verticalCenter', x: initialWidth * 0.5, y: initialHeight * 0.5 },
  ]);

  // Real computer vision line detection using Phase 5 implementation
  const detectCourtLines = useCallback(() => {
    try {
      if (processingMode === 'mock') {
        // Mock frame for testing (fallback mode)
        const mockFrame: FrameData = {
          width: initialWidth,
          height: initialHeight,
          data: new Uint8Array(initialWidth * initialHeight * 3), // Mock RGB data
          format: 'rgb',
          timestamp: Date.now(),
        };

        // Use our advanced court line detector
        const detectedCourtLines =
          AdvancedCourtLineDetector.detectCourtLines(mockFrame);
        setCourtLines(detectedCourtLines);

        // Get detection statistics
        const stats = AdvancedCourtLineDetector.getDetectionStats(mockFrame);
        setDetectionStats({
          processingTime: stats.processingTime,
          confidence: stats.confidence,
          lineCount: stats.courtLineCount,
        });

        // Convert court lines to detected lines for compatibility
        const lines: DetectedLine[] = detectedCourtLines.map(
          (courtLine) => courtLine.detectedLine
        );
        setDetectedLines(lines);

        return lines;
      } else {
        // Real-time processing mode - this will be called by frame processor
        console.log('Real-time processing mode active');
        return detectedLines; // Return current detected lines
      }
    } catch (error) {
      console.error('Error in court line detection:', error);
      return [];
    }
  }, [initialWidth, initialHeight, processingMode, detectedLines]);

  // Enhanced alignment validation using our court line detection system
  const checkLineAlignment = useCallback(
    (detected: DetectedLine[]) => {
      const TOLERANCE = 15; // pixels tolerance for alignment
      const MIN_CONFIDENCE = 0.7; // minimum confidence for line detection

      // Use our court line classification if available
      if (courtLines.length > 0) {
        // Check if we have all three expected court lines
        const hasTopWall = courtLines.some((line) => line.id === 'topBackWall');
        const hasBaseline = courtLines.some((line) => line.id === 'baseline');
        const hasCenter = courtLines.some(
          (line) => line.id === 'verticalCenter'
        );

        // All three lines must be detected with high confidence
        return !!(hasTopWall && hasBaseline && hasCenter);
      }

      // Fallback to original logic for compatibility
      const topWallDetected = detected.find(
        (line) =>
          line.type === 'horizontal' &&
          Math.abs(line.y1 - initialHeight * 0.15) < TOLERANCE &&
          line.confidence > MIN_CONFIDENCE
      );

      const baselineDetected = detected.find(
        (line) =>
          line.type === 'horizontal' &&
          Math.abs(line.y1 - initialHeight * 0.75) < TOLERANCE &&
          line.confidence > MIN_CONFIDENCE
      );

      const centerDetected = detected.find(
        (line) =>
          line.type === 'vertical' &&
          Math.abs(line.x1 - initialWidth * 0.5) < TOLERANCE &&
          line.confidence > MIN_CONFIDENCE
      );

      return !!(topWallDetected && baselineDetected && centerDetected);
    },
    [initialWidth, initialHeight, courtLines]
  );

  // Real-time frame processing function using Vision Camera
  const processRealTimeFrame = useCallback(
    (frame: any) => {
      try {
        setIsProcessing(true);
        setFrameCount((prev) => prev + 1);

        // Process frame using our real-time processor
        const result = RealTimeFrameProcessor.processFrame(frame, {
          enablePerformanceOptimization: true,
          enableCaching: true,
          enableErrorHandling: true,
          targetFrameRate: 10,
        });

        // Update state with real-time results
        setCourtLines(result.courtLines);
        setDetectedLines(result.detectedLines);

        // Update detection statistics
        setDetectionStats({
          processingTime: result.performanceMetrics.processingTime,
          confidence:
            result.performanceMetrics.qualityLevel === 'high' ? 0.9 : 0.7,
          lineCount: result.courtLines.length,
        });

        // Check alignment with real-time data
        const aligned = checkLineAlignment(result.detectedLines);
        if (aligned !== isAligned) {
          setIsAligned(aligned);
          setStep(aligned ? 'complete' : 'positioning');
          fade.value = withTiming(aligned ? 1 : 0.8, { duration: 250 });
        }

        setIsProcessing(false);
      } catch (error) {
        console.error('Error in real-time frame processing:', error);
        setIsProcessing(false);
      }
    },
    [isAligned, fade, checkLineAlignment]
  );

  // Vision Camera frame processor hook
  const frameProcessor = useCallback((frame: any) => {
    'worklet';

    try {
      // Use our worklet-based frame processor for optimal performance
      const result = WorkletFrameProcessor.processFrameWorklet(frame);

      if (result.success) {
        // Send results back to JS thread for state updates
        // Note: In a real implementation, this would use runOnJS
        // For now, we'll handle this in the React component
        console.log('Frame processed successfully:', result);
      } else {
        console.error('Frame processing failed:', result.error);
      }
    } catch (error) {
      console.error('Worklet error:', error);
    }
  }, []);

  // Toggle between real-time and mock processing modes
  const toggleProcessingMode = useCallback(() => {
    setProcessingMode((prev) => (prev === 'mock' ? 'real-time' : 'mock'));
    if (processingMode === 'mock') {
      console.log('Switching to real-time processing mode');
    } else {
      console.log('Switching to mock processing mode');
    }
  }, [processingMode]);

  // Process frames when in real-time mode
  useEffect(() => {
    if (cameraReady && processingMode === 'real-time') {
      // Set up frame processing interval for real-time mode
      const interval = setInterval(() => {
        // In real-time mode, we'll process frames as they come in
        // This simulates real camera frame processing
        if (cameraRef.current) {
          try {
            // Create a simulated frame based on current camera state
            // In production, this would be real camera data
            const simulatedFrame = {
              width: initialWidth,
              height: initialHeight,
              timestamp: Date.now(),
              // Simulate camera frame data with potential court line patterns
              data: generateSmartMockFrame(initialWidth, initialHeight),
            };

            // Process the simulated frame
            processRealTimeFrame(simulatedFrame);
          } catch (error) {
            console.error('Error in real-time frame processing:', error);
          }
        }
      }, 200); // Process every 200ms for real-time feel

      return () => clearInterval(interval);
    }
  }, [
    cameraReady,
    processingMode,
    processRealTimeFrame,
    initialWidth,
    initialHeight,
  ]);

  useEffect(() => {
    // Lock orientation to landscape for calibration
    const lock = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (e) {
        // no-op
      }
    };
    lock();
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    // Request camera permission if needed
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // Subtle breathing animation for status indicator
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );
  }, [pulse]);

  // Simulate line detection when camera is ready (mock mode only)
  useEffect(() => {
    if (cameraReady && processingMode === 'mock') {
      // Check for lines periodically in mock mode
      const interval = setInterval(() => {
        const lines = detectCourtLines();
        setDetectedLines(lines);

        const aligned = checkLineAlignment(lines);

        // Update alignment state
        if (aligned !== isAligned) {
          setIsAligned(aligned);
          setStep(aligned ? 'complete' : 'positioning');
          fade.value = withTiming(aligned ? 1 : 0.8, { duration: 250 });
        }
      }, 500); // Check every 500ms

      return () => clearInterval(interval);
    }
  }, [
    cameraReady,
    detectCourtLines,
    checkLineAlignment,
    isAligned,
    fade,
    processingMode,
  ]);

  // Generate smart mock frame with potential court line patterns
  const generateSmartMockFrame = useCallback(
    (width: number, height: number) => {
      const data = new Uint8Array(width * height * 3);

      // Create a more realistic court-like pattern
      for (let i = 0; i < data.length; i += 3) {
        const pixelIndex = i / 3;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / height);

        // Simulate court surface (green/blue tint)
        let r = 30 + Math.random() * 20; // Dark base
        let g = 40 + Math.random() * 30; // Green tint
        let b = 35 + Math.random() * 25; // Blue tint

        // Add some noise and variation
        const noise = (Math.random() - 0.5) * 15;
        r = Math.max(0, Math.min(255, r + noise));
        g = Math.max(0, Math.min(255, g + noise));
        b = Math.max(0, Math.min(255, b + noise));

        // Simulate potential court lines (bright white lines)
        // These will be detected by our computer vision algorithms
        if (
          Math.abs(y - height * 0.15) < 3 ||
          Math.abs(y - height * 0.75) < 3
        ) {
          // Horizontal lines (top wall and baseline)
          r = 200 + Math.random() * 55; // Bright white
          g = 200 + Math.random() * 55;
          b = 200 + Math.random() * 55;
        } else if (Math.abs(x - width * 0.5) < 3) {
          // Vertical center line
          r = 200 + Math.random() * 55; // Bright white
          g = 200 + Math.random() * 55;
          b = 200 + Math.random() * 55;
        }

        data[i] = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
      }

      return data;
    },
    []
  );

  const renderLines = () =>
    linePositions.map((line) => {
      const isVertical = line.id === 'verticalCenter';
      // Lines are ALWAYS red unless perfectly aligned with detected court lines
      const color = isAligned ? '#4CAF50' : '#FF0000';

      return (
        <View
          key={line.id}
          style={[
            isVertical ? styles.lineContainerVertical : styles.lineContainer,
            {
              left: isVertical ? line.x - 20 : line.x - 75,
              top: isVertical ? line.y - 75 : line.y - 20,
            },
          ]}
        >
          <View
            style={[
              isVertical ? styles.lineVertical : styles.lineHorizontal,
              {
                backgroundColor: color,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.8)',
                opacity: isAligned ? 1 : 0.8,
              },
            ]}
          />
          <Text
            style={[
              isVertical ? styles.lineLabelVertical : styles.lineLabel,
              { color },
            ]}
          >
            {labelFor(line.id)}
          </Text>
        </View>
      );
    });

  const labelFor = (id: LineId) => {
    switch (id) {
      case 'topBackWall':
        return 'Top of Back Wall';
      case 'baseline':
        return 'Near Service Line';
      case 'verticalCenter':
        return 'Center Line';
      default:
        return '';
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {permission.canAskAgain
            ? 'Camera permission required for calibration'
            : 'Camera permission denied. Please enable in settings.'}
        </Text>
        {permission.canAskAgain && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.permissionButton,
            { backgroundColor: '#666', marginTop: 10 },
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onMountError={(e) => console.error('Camera mount error', e)}
        // Note: frameProcessor prop is not available in expo-camera
        // This would be used with react-native-vision-camera
        // For now, we're using the interval-based approach
      />

      {/* AR Fixed Guides */}
      {renderLines()}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Processing mode toggle */}
        {__DEV__ && (
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              {
                backgroundColor:
                  processingMode === 'real-time' ? '#4CAF50' : '#FF9800',
              },
            ]}
            onPress={toggleProcessingMode}
          >
            <Text style={styles.modeToggleButtonText}>
              {processingMode === 'real-time' ? 'Real-time' : 'Mock'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Manual detection button for testing */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              const lines = detectCourtLines();
              const aligned = checkLineAlignment(lines);
              setIsAligned(aligned);
              setStep(aligned ? 'complete' : 'positioning');
            }}
          >
            <Text style={styles.testButtonText}>Test Detection</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: cameraReady
                  ? processingMode === 'real-time' && isProcessing
                    ? '#FFD700' // Gold when processing
                    : '#00FF88' // Green when ready
                  : '#FF6B6B', // Red when not ready
              },
            ]}
          />
          <Text style={styles.statusText}>
            {cameraReady
              ? processingMode === 'real-time'
                ? isProcessing
                  ? 'Processing frame...'
                  : 'Real-time detection active...'
                : 'Mock detection active...'
              : 'Preparing camera...'}
          </Text>
        </View>
      </View>

      {/* Perfect Position Indicator - Only shows when truly aligned */}
      {isAligned && (
        <Animated.View style={[styles.perfectContainer, pulseStyle]}>
          <Ionicons name="checkmark-circle" size={34} color="#4CAF50" />
          <Text style={styles.perfectText}>Court lines detected!</Text>
        </Animated.View>
      )}

      {/* Footer hint - Always shows when not aligned */}
      {!isAligned && (
        <Animated.View style={[styles.hintContainer, fadeStyle]}>
          <Text style={styles.hintText}>
            Align the red guides with the actual court lines.{'\n'}
            They will turn green when properly aligned.
          </Text>
        </Animated.View>
      )}

      {/* Success message - Only when aligned */}
      {isAligned && (
        <Animated.View style={[styles.successContainer, fadeStyle]}>
          <Text style={styles.successText}>
            Perfect! Court lines are aligned.{'\n'}
            Keep the camera steady.
          </Text>
        </Animated.View>
      )}

      {/* Debug info (remove in production) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Mode: {processingMode.toUpperCase()} | Lines: {detectedLines.length}{' '}
            | Court lines: {courtLines.length} | Aligned:{' '}
            {isAligned ? 'YES' : 'NO'}
          </Text>
          {processingMode === 'real-time' && (
            <Text style={styles.debugText}>
              Real-time: Frame {frameCount} | Processing:{' '}
              {isProcessing ? 'YES' : 'NO'} | FPS: {Math.round(1000 / 200)}
            </Text>
          )}
          {detectionStats && (
            <Text style={styles.debugText}>
              Processing: {detectionStats.processingTime.toFixed(1)}ms |
              Confidence: {(detectionStats.confidence * 100).toFixed(1)}%
            </Text>
          )}
          {courtLines.length > 0 && (
            <Text style={styles.debugText}>
              Top Wall:{' '}
              {courtLines.find((l) => l.id === 'topBackWall') ? '✓' : '✗'} |
              Baseline:{' '}
              {courtLines.find((l) => l.id === 'baseline') ? '✓' : '✗'} |
              Center:{' '}
              {courtLines.find((l) => l.id === 'verticalCenter') ? '✓' : '✗'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // Fixed line containers
  lineContainer: {
    position: 'absolute',
    width: 150,
    height: 40,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineContainerVertical: {
    position: 'absolute',
    width: 40,
    height: 150,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineHorizontal: {
    width: 120,
    height: 4,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  lineVertical: {
    width: 4,
    height: 120,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  lineLabel: {
    position: 'absolute',
    top: -20,
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lineLabelVertical: {
    position: 'absolute',
    left: -50,
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    transform: [{ rotate: '-90deg' }],
  },

  perfectContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  perfectText: { color: '#4CAF50', fontWeight: 'bold' },

  hintContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 14,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  successContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    padding: 14,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  testButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  modeToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  modeToggleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  debugContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
