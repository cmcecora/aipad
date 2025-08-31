import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PanResponder,
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

type LineId =
  | 'topBackWall'
  | 'net'
  | 'baseline'
  | 'midCourt'
  | 'verticalCenter';

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
  const [draggedLineId, setDraggedLineId] = useState<LineId | null>(null);
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
    // Four horizontal lines evenly spaced from top to bottom (1/5, 2/5, 3/5, 4/5)
    { id: 'topBackWall', x: initialWidth * 0.5, y: initialHeight * 0.2 },
    { id: 'net', x: initialWidth * 0.5, y: initialHeight * 0.4 },
    { id: 'midCourt', x: initialWidth * 0.5, y: initialHeight * 0.6 },
    { id: 'baseline', x: initialWidth * 0.5, y: initialHeight * 0.8 },
    // One vertical line perpendicular to the bottom (baseline) line
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
    const net = byId('net');
    const midCourt = byId('midCourt');
    const base = byId('baseline');
    const vertical = byId('verticalCenter');

    const height = initialHeight;
    const width = initialWidth;

    // Order: top < net < midCourt < base
    const hasValidOrder =
      top.y < net.y && net.y < midCourt.y && midCourt.y < base.y;

    // Even spacing check: distances between consecutive horizontals roughly equal
    const d1 = net.y - top.y;
    const d2 = midCourt.y - net.y;
    const d3 = base.y - midCourt.y;
    const avg = (d1 + d2 + d3) / 3;
    const spacingEven = [d1, d2, d3].every(
      (d) => Math.abs(d - avg) < height * 0.06
    );

    // Horizontal centering for all horizontals
    const centered = [top, net, midCourt, base].every(
      (l) => Math.abs(l.x - width * 0.5) < width * 0.06
    );

    // Bounds sanity
    const topNearTop = top.y < height * 0.25;
    const baseNearBottom = base.y > height * 0.7;

    // Vertical line near center
    const verticalCentered = Math.abs(vertical.x - width * 0.5) < width * 0.06;

    const aligned =
      hasValidOrder &&
      spacingEven &&
      centered &&
      topNearTop &&
      baseNearBottom &&
      verticalCentered;

    setIsAligned(aligned);

    if (aligned && step !== 'complete') {
      fade.value = withTiming(1, { duration: 250 });
      setStep('complete');
    } else if (!aligned && step !== 'positioning') {
      setStep('positioning');
    }
  }, [linePositions, initialHeight, initialWidth, fade, step]);

  const createPanResponder = (lineId: LineId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDraggedLineId(lineId),
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        setLinePositions((prev) =>
          prev.map((l) => (l.id === lineId ? { ...l, x: pageX, y: pageY } : l))
        );
      },
      onPanResponderRelease: () => setDraggedLineId(null),
      onPanResponderTerminate: () => setDraggedLineId(null),
    });

  const lineColors: Record<LineId, string> = {
    topBackWall: '#9C27B0',
    net: '#FF9800',
    midCourt: '#FFEB3B',
    baseline: '#F44336',
    verticalCenter: '#2196F3',
  };

  const renderDraggableLines = () =>
    linePositions.map((line) => {
      const isVertical = line.id === 'verticalCenter';
      const pan = createPanResponder(line.id);
      const isDragging = draggedLineId === line.id;
      const color = isAligned ? '#4CAF50' : lineColors[line.id];

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
          {...pan.panHandlers}
        >
          <View
            style={[
              isVertical ? styles.lineVertical : styles.lineHorizontal,
              {
                backgroundColor: color,
                opacity: isDragging ? 0.9 : 1,
                transform: [{ scale: isDragging ? 1.12 : 1 }],
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
      case 'net':
        return 'Top of Net';
      case 'midCourt':
        return 'Middle-line';
      case 'baseline':
        return 'Near Baseline';
      case 'verticalCenter':
        return 'Vertical Center';
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

      {/* AR Draggable Guides */}
      {renderDraggableLines()}

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
            Fit the court inside the colored guides. Drag lines if needed. They
            turn green when aligned.
          </Text>
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

  // Draggable line containers
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
