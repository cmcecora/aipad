import React, { useEffect, useRef, useState } from 'react';
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

export default function CalibrationScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const [step, setStep] = useState<CalibrationStep>('positioning');
  const [isAligned, setIsAligned] = useState(false);

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

  const [linePositions, setLinePositions] = useState<LinePosition[]>([
    // Top line: 15% from top, centered horizontally
    { id: 'topBackWall', x: initialWidth * 0.5, y: initialHeight * 0.15 },
    // Bottom line: 25% from bottom (75% from top), centered horizontally
    { id: 'baseline', x: initialWidth * 0.5, y: initialHeight * 0.75 },
    // One vertical line: centered vertically (50% from top), centered horizontally (50% from left)
    { id: 'verticalCenter', x: initialWidth * 0.5, y: initialHeight * 0.5 },
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
  }, []);

  // Simple geometric validation to auto-detect a "good" alignment
  useEffect(() => {
    const byId = (id: LineId) => linePositions.find((l) => l.id === id)!;
    const top = byId('topBackWall');
    const base = byId('baseline');
    const vertical = byId('verticalCenter');

    const height = initialHeight;
    const width = initialWidth;

    // Order: top < base
    const hasValidOrder = top.y < base.y;

    // Check that the distance between top and bottom lines is reasonable
    const distance = base.y - top.y;
    const reasonableDistance =
      distance > height * 0.3 && distance < height * 0.8;

    // Horizontal centering for horizontal lines
    const centered = [top, base].every(
      (l) => Math.abs(l.x - width * 0.5) < width * 0.08
    );

    // Bounds sanity - top line should be near top (15% from top)
    const topNearTop = Math.abs(top.y - height * 0.15) < height * 0.05;
    // Bottom line should be near bottom (25% from bottom = 75% from top)
    const baseNearBottom = Math.abs(base.y - height * 0.75) < height * 0.05;
    // Vertical line should be centered vertically (50% from top)
    const verticalCentered =
      Math.abs(vertical.y - height * 0.5) < height * 0.05;

    // Vertical line should be centered horizontally (50% from left)
    const verticalHorizontallyCentered =
      Math.abs(vertical.x - width * 0.5) < width * 0.08;

    const aligned =
      hasValidOrder &&
      reasonableDistance &&
      centered &&
      topNearTop &&
      baseNearBottom &&
      verticalCentered &&
      verticalHorizontallyCentered;

    setIsAligned(aligned);

    if (aligned && step !== 'complete') {
      fade.value = withTiming(1, { duration: 250 });
      setStep('complete');
    } else if (!aligned && step !== 'positioning') {
      setStep('positioning');
    }
  }, [linePositions, initialHeight, initialWidth, fade, step]);

  const renderLines = () =>
    linePositions.map((line) => {
      const isVertical = line.id === 'verticalCenter';
      // Lines are red by default, only turn green when perfectly aligned
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
        return 'Near Baseline';
      case 'verticalCenter':
        return 'Middle';
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
            {cameraReady ? 'Camera ready' : 'Preparing camera...'}
          </Text>
        </View>
      </View>

      {/* Perfect Position Indicator */}
      {isAligned && (
        <Animated.View style={[styles.perfectContainer, pulseStyle]}>
          <Ionicons name="checkmark-circle" size={34} color="#4CAF50" />
          <Text style={styles.perfectText}>Perfect position</Text>
        </Animated.View>
      )}

      {/* Footer hint */}
      {step === 'positioning' && (
        <Animated.View style={[styles.hintContainer, fadeStyle]}>
          <Text style={styles.hintText}>
            Fit the court inside the colored guides. They turn green when
            aligned.
          </Text>
        </Animated.View>
      )}

      {/* Success message when aligned */}
      {isAligned && (
        <Animated.View style={[styles.hintContainer, fadeStyle]}>
          <Text style={styles.hintText}>You found the sweet spot!</Text>
        </Animated.View>
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
  hintText: { color: '#CCCCCC', fontSize: 14, textAlign: 'center' },

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
});
