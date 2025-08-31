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

export default function CalibrationScreen() {
  // Check if we're running in Expo Go (which doesn't support react-native-vision-camera)
  // In a development build, we can access react-native-vision-camera
  const isExpoGo = false; // We're using a development build now

  if (isExpoGo) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Court calibration requires a development build
        </Text>
        <Text style={[styles.permissionText, { fontSize: 14, marginTop: 10 }]}>
          This feature uses react-native-vision-camera which is not supported in
          Expo Go. Please use `expo run:android` or `expo run:ios` to create a
          development build.
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { marginTop: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dynamic imports for development build only
  const [Camera, setCamera] = useState<any>(null);
  const [useCameraPermission, setUseCameraPermission] = useState<any>(null);
  const [useCameraDevices, setUseCameraDevices] = useState<any>(null);
  const [useFrameProcessor, setUseFrameProcessor] = useState<any>(null);
  const [useRunOnJS, setUseRunOnJS] = useState<any>(null);

  // Load vision camera modules dynamically
  useEffect(() => {
    const loadVisionCamera = async () => {
      try {
        const visionCamera = await import('react-native-vision-camera');
        const workletsCore = await import('react-native-worklets-core');

        setCamera(visionCamera.Camera);
        setUseCameraPermission(visionCamera.useCameraPermission);
        setUseCameraDevices(visionCamera.useCameraDevices);
        setUseFrameProcessor(visionCamera.useFrameProcessor);
        setUseRunOnJS(workletsCore.useRunOnJS);
      } catch (error) {
        console.error('Failed to load vision camera:', error);
      }
    };

    if (!isExpoGo) {
      loadVisionCamera();
    }
  }, [isExpoGo]);

  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [step, setStep] = useState<CalibrationStep>('positioning');
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

  // Mock line detection for demonstration
  const detectCourtLines = useCallback(() => {
    // This is a simplified mock detection
    // In a real app with development build, you'd use react-native-vision-camera
    const mockLines: DetectedLine[] = [
      {
        x1: initialWidth * 0.2,
        y1: initialHeight * 0.15,
        x2: initialWidth * 0.8,
        y2: initialHeight * 0.15,
        confidence: 0.85,
        type: 'horizontal',
        angle: 0,
        length: initialWidth * 0.6,
      },
      {
        x1: initialWidth * 0.2,
        y1: initialHeight * 0.75,
        x2: initialWidth * 0.8,
        y2: initialHeight * 0.75,
        confidence: 0.8,
        type: 'horizontal',
        angle: 0,
        length: initialWidth * 0.6,
      },
      {
        x1: initialWidth * 0.5,
        y1: initialHeight * 0.1,
        x2: initialWidth * 0.5,
        y2: initialHeight * 0.9,
        confidence: 0.75,
        type: 'vertical',
        angle: 90,
        length: initialHeight * 0.8,
      },
    ];
    setDetectedLines(mockLines);
    return mockLines;
  }, [initialWidth, initialHeight]);

  // Check line alignment
  const checkLineAlignment = useCallback(
    (detected: DetectedLine[]) => {
      const TOLERANCE = 15; // pixels tolerance for alignment
      const MIN_CONFIDENCE = 0.7;

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
    [initialWidth, initialHeight]
  );

  // Initialize camera permissions and devices
  useEffect(() => {
    if (useCameraPermission && useCameraDevices) {
      const { hasPermission: perm, requestPermission } = useCameraPermission();
      const devices = useCameraDevices();
      const backDevice = devices.find((d: any) => d.position === 'back');

      setHasPermission(perm);
      setDevice(backDevice);
    }
  }, [useCameraPermission, useCameraDevices]);

  // Vision Camera frame processor hook for real-time processing
  const runOnJS = useRunOnJS
    ? useRunOnJS(
        (result: any) => {
          if (result.success) {
            // Update state with real-time results
            setCourtLines(result.courtLines);
            setDetectedLines(result.detectedLines);
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
          }
        },
        [checkLineAlignment, isAligned, fade]
      )
    : null;

  const frameProcessor = useFrameProcessor
    ? useFrameProcessor(
        (frame: any) => {
          'worklet';

          try {
            // Use our worklet-based frame processor for optimal performance
            const result = WorkletFrameProcessor.processFrameWorklet(frame);

            // Send results back to JS thread for state updates
            if (runOnJS) {
              runOnJS(result);
            }
          } catch (error) {
            console.error('Worklet error:', error);
          }
        },
        [runOnJS]
      )
    : null;

  useEffect(() => {
    // Lock orientation to landscape for calibration
    const lock = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (e) {
        console.error('Failed to lock orientation:', e);
      }
    };
    lock();
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

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

  // Simulate periodic line detection
  useEffect(() => {
    if (cameraReady && step === 'positioning') {
      const interval = setInterval(() => {
        const lines = detectCourtLines();
        const aligned = checkLineAlignment(lines);
        if (aligned !== isAligned) {
          setIsAligned(aligned);
          setStep(aligned ? 'complete' : 'positioning');
          fade.value = withTiming(aligned ? 1 : 0.8, { duration: 250 });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [
    cameraReady,
    step,
    detectCourtLines,
    checkLineAlignment,
    isAligned,
    fade,
  ]);

  const renderLines = () =>
    linePositions.map((line) => {
      const isVertical = line.id === 'verticalCenter';
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

  // Don't render camera if no device is available
  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera device not available</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission required for calibration
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            // Request permission logic would go here
            setHasPermission(true);
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
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

  // Don't render camera if Camera component is not loaded
  if (!Camera) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        onInitialized={() => setCameraReady(true)}
        onError={(error: any) => console.error('Camera error:', error)}
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

        <View style={styles.statusPill}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: cameraReady ? '#00FF88' : '#FF6B6B',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {cameraReady ? 'Camera ready' : 'Preparing camera...'}
          </Text>
        </View>
      </View>

      {/* Perfect Position Indicator */}
      {isAligned && (
        <Animated.View style={[styles.perfectContainer, pulseStyle]}>
          <Ionicons name="checkmark-circle" size={34} color="#4CAF50" />
          <Text style={styles.perfectText}>Court lines detected!</Text>
        </Animated.View>
      )}

      {/* Footer hint */}
      {!isAligned && (
        <Animated.View style={[styles.hintContainer, fadeStyle]}>
          <Text style={styles.hintText}>
            Align the red guides with the actual court lines.{'\n'}
            They will turn green when properly aligned.
          </Text>
        </Animated.View>
      )}

      {/* Success message */}
      {isAligned && (
        <Animated.View style={[styles.successContainer, fadeStyle]}>
          <Text style={styles.successText}>
            Perfect! Court lines are aligned.{'\n'}
            Keep the camera steady.
          </Text>
        </Animated.View>
      )}

      {/* Test button for manual alignment check */}
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
          <Text style={styles.testButtonText}>Test Alignment</Text>
        </TouchableOpacity>
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
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
