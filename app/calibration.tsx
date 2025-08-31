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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CalibrationStep = 'positioning' | 'complete';

type LineId = 'topBackWall' | 'baseline' | 'verticalCenter';

interface LinePosition {
  x: number;
  y: number;
  id: LineId;
}

interface DetectedLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  type: 'horizontal' | 'vertical';
  confidence: number;
}

export default function CalibrationScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const [, setStep] = useState<CalibrationStep>('positioning');
  const [isAligned, setIsAligned] = useState(false);
  const [detectedLines, setDetectedLines] = useState<DetectedLine[]>([]);

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

  // Simulated line detection (in production, this would use actual CV)
  const detectCourtLines = useCallback(() => {
    // This is a placeholder for actual computer vision line detection
    // In a real implementation, this would process camera frames
    // and detect actual lines using edge detection algorithms
    
    // For now, return empty array (no lines detected = stay red)
    // In production, this would only return lines when actually detected
    return [];
  }, []);

  // Check if detected lines match our guide positions
  const checkLineAlignment = useCallback((detected: DetectedLine[]) => {
    const TOLERANCE = 15; // pixels tolerance for alignment
    const MIN_CONFIDENCE = 0.7; // minimum confidence for line detection
    
    // Find horizontal lines near our guide positions
    const topWallDetected = detected.find(line => 
      line.type === 'horizontal' && 
      Math.abs(line.y1 - initialHeight * 0.15) < TOLERANCE &&
      line.confidence > MIN_CONFIDENCE
    );
    
    const baselineDetected = detected.find(line => 
      line.type === 'horizontal' && 
      Math.abs(line.y1 - initialHeight * 0.75) < TOLERANCE &&
      line.confidence > MIN_CONFIDENCE
    );
    
    const centerDetected = detected.find(line => 
      line.type === 'vertical' && 
      Math.abs(line.x1 - initialWidth * 0.5) < TOLERANCE &&
      line.confidence > MIN_CONFIDENCE
    );
    
    // All three lines must be detected with high confidence
    return !!(topWallDetected && baselineDetected && centerDetected);
  }, [initialWidth, initialHeight]);

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

  // Simulate line detection when camera is ready
  useEffect(() => {
    if (cameraReady) {
      // Check for lines periodically
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
  }, [cameraReady, detectCourtLines, checkLineAlignment, isAligned, fade]);

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
              { backgroundColor: cameraReady ? '#00FF88' : '#FF6B6B' },
            ]}
          />
          <Text style={styles.statusText}>
            {cameraReady ? 'Detecting court lines...' : 'Preparing camera...'}
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
            Lines detected: {detectedLines.length} | 
            Aligned: {isAligned ? 'YES' : 'NO'}
          </Text>
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