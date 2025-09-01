import * as React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
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
import {
  Camera,
  useCameraPermission,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CalibrationStep = 'positioning' | 'complete';

type LineId = 'topBackWall' | 'baseline' | 'verticalCenter';

interface LinePosition {
  x: number;
  y: number;
  id: LineId;
}

export default function CalibrationScreen() {
  // Disable mock detection by default so lines start red until real detection is available
  const USE_MOCK_DETECTION = false;
  // Vision Camera hooks (called at top-level)
  const {
    hasPermission: vcHasPermission,
    requestPermission: vcRequestPermission,
  } = useCameraPermission();
  const vcDevices = useCameraDevices();

  // State for tracking module loading
  // Removed dynamic module loading state; using static imports

  // (removed dynamic import state; using static vision-camera imports)

  // (dynamic vision-camera loader removed)

  // Camera state hooks must be declared before any conditional returns
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // (removed module loading error/loader UI)

  // (camera state moved above)

  const [step, setStep] = useState('positioning');
  const [isAligned, setIsAligned] = useState(false);
  const [detectedLines, setDetectedLines] = useState<any[]>([]);
  const [courtLines, setCourtLines] = useState<any[]>([]);
  const [detectionStats, setDetectionStats] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [linePositions] = useState<any[]>([
    // Top line: 15% from top, centered horizontally
    { id: 'topBackWall', x: initialWidth * 0.5, y: initialHeight * 0.15 },
    // Bottom line: 75% from top, centered horizontally
    { id: 'baseline', x: initialWidth * 0.5, y: initialHeight * 0.75 },
    // Vertical line: centered both ways
    { id: 'verticalCenter', x: initialWidth * 0.5, y: initialHeight * 0.5 },
  ]);

  // Mock line detection (disabled by default)
  const detectCourtLines = useCallback(() => {
    if (!USE_MOCK_DETECTION) {
      setDetectedLines([]);
      return [] as any[];
    }
    const mockLines: any[] = [];
    setDetectedLines(mockLines);
    return mockLines;
  }, [USE_MOCK_DETECTION]);

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

  // Initialize camera permissions and devices from Vision Camera
  useEffect(() => {
    const backDevice = vcDevices.find((d: any) => d.position === 'back');
    setHasPermission(!!vcHasPermission);
    setDevice(backDevice || null);
  }, [vcHasPermission, vcDevices]);

  useEffect(() => {
    if (!vcHasPermission) {
      vcRequestPermission().catch(() => {});
    }
  }, [vcHasPermission, vcRequestPermission]);

  // Frame processor for camera (currently disabled for performance)
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Frame processing is currently disabled to maintain performance
    // This will be implemented in future phases when real-time detection is needed
  }, []);

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

  // Periodic detection loop (no-op unless detection provides lines)
  useEffect(() => {
    if (cameraReady) {
      const interval = setInterval(() => {
        const lines = detectCourtLines();
        const aligned = checkLineAlignment(lines);
        if (aligned && !isAligned) {
          setIsAligned(true);
          setStep('complete');
          fade.value = withTiming(1, { duration: 250 });
          setShowSuccess(true);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(
            () => setShowSuccess(false),
            10000
          );
        } else if (!aligned && isAligned) {
          setIsAligned(false);
          setStep('positioning');
          fade.value = withTiming(0.8, { duration: 250 });
          if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
          }
          setShowSuccess(false);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cameraReady, detectCourtLines, checkLineAlignment, isAligned, fade]);

  // Cleanup success banner timer on unmount
  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    []
  );

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
            vcRequestPermission();
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

  return (
    <View style={styles.container}>
      {device ? (
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
      ) : (
        <View style={[styles.camera, styles.mockCamera]}>
          <Text style={styles.mockCameraText}>Camera Preview</Text>
          <Text
            style={[styles.mockCameraText, { fontSize: 14, marginTop: 10 }]}
          >
            Camera modules not available in this build
          </Text>
        </View>
      )}

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

      {/* Perfect Position Indicator (limited to 10s after alignment) */}
      {showSuccess && (
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

      {/* Success message (limited to 10s after alignment) */}
      {showSuccess && (
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
            // Dev toggle: simulate alignment transition to verify UI behavior
            const next = !isAligned;
            setIsAligned(next);
            setStep(next ? 'complete' : 'positioning');
            if (next) {
              setShowSuccess(true);
              if (successTimerRef.current)
                clearTimeout(successTimerRef.current);
              successTimerRef.current = setTimeout(
                () => setShowSuccess(false),
                10000
              );
            } else {
              if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
                successTimerRef.current = null;
              }
              setShowSuccess(false);
            }
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
  mockCamera: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCameraText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
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
