import { useState, useRef, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type VideoQuality } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { VideoUtils } from '../utils/videoUtils';

type VideoQualityOption = '480p' | '720p' | '1080p' | '2160p' | '4k';

const VIDEO_QUALITY_MAP: Record<VideoQualityOption, VideoQuality> = {
  '480p': '480p',
  '720p': '720p',
  '1080p': '1080p',
  '2160p': '2160p',
  '4k': '2160p',
};

export interface UseVideoRecordingOptions {
  maxDuration?: number;
  quality?: VideoQualityOption;
  albumName?: string;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingComplete?: (videoUri: string) => void;
  onError?: (error: string) => void;
}

export interface VideoRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  hasPermissions: boolean;
  isInitialized: boolean;
}

export function useVideoRecording(options: UseVideoRecordingOptions = {}) {
  const {
    maxDuration = 3600,
    quality = '1080p',
    albumName = 'Raydel Recordings',
    onRecordingStart,
    onRecordingStop,
    onRecordingComplete,
    onError
  } = options;

  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  // Always call the hook (React rules), but only use it on iOS
  const [mediaLibraryPerm, requestMediaLibraryPerm] = MediaLibrary.usePermissions();

  const [state, setState] = useState<VideoRecordingState>({
    isRecording: false,
    isProcessing: false,
    recordingTime: 0,
    hasPermissions: false,
    isInitialized: false
  });
  const resolvedVideoQuality = VIDEO_QUALITY_MAP[quality];

  const updateState = useCallback((updates: Partial<VideoRecordingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we're on web
      if (Platform.OS === 'web') {
        onError?.('Camera recording is not available on web platform');
        return false;
      }

      let allGranted = true;

      // Request camera permission explicitly
      if (!camPerm?.granted) {
        const camResult = await requestCamPerm();
        if (!camResult.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in your device settings to record videos.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          allGranted = false;
        }
      }

      // Request microphone permission explicitly
      if (!micPerm?.granted) {
        const micResult = await requestMicPerm();
        if (!micResult.granted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access in your device settings to record audio.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          allGranted = false;
        }
      }

      // Request media library permission on BOTH iOS and Android
      if (!mediaLibraryPerm?.granted) {
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          Alert.alert(
            'Media Library Permission Required',
            'Please enable media library access in your device settings to save videos to gallery.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          allGranted = false;
        }
      }

      updateState({
        hasPermissions: allGranted,
        isInitialized: allGranted
      });

      return allGranted;
    } catch (error) {
      console.error('Permission request error:', error);
      onError?.('Failed to request permissions');
      return false;
    }
  }, [camPerm, micPerm, mediaLibraryPerm, requestCamPerm, requestMicPerm, requestMediaLibraryPerm, onError, updateState]);

  const startRecordingTimer = useCallback(() => {
    recordingTimerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
    }, 1000);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    updateState({ recordingTime: 0 });
  }, [updateState]);

  const startRecording = useCallback(async () => {
    try {
      // Check permissions
      const hasPerms = await requestPermissions();
      if (!hasPerms) return;

      // Check camera ref
      if (!cameraRef.current) {
        onError?.('Camera not ready. Please try again.');
        return;
      }

      updateState({ isRecording: true });
      onRecordingStart?.();
      startRecordingTimer();

      // Start recording with a small delay to ensure camera is ready
      setTimeout(async () => {
        try {
          if (cameraRef.current) {
            const recording = await cameraRef.current.recordAsync({
              maxDuration,
            });

            if (recording?.uri) {
              await handleRecordingComplete(recording.uri);
            } else {
              updateState({ isRecording: false });
              stopRecordingTimer();
            }
          }
        } catch (recordError) {
          console.error('Recording start error:', recordError);
          onError?.('Failed to start recording. Please try again.');
          updateState({ isRecording: false });
          stopRecordingTimer();
        }
      }, 500);

    } catch (error) {
      console.error('Start recording error:', error);
      onError?.('Failed to start recording');
      updateState({ isRecording: false });
      stopRecordingTimer();
    }
  }, [requestPermissions, onRecordingStart, startRecordingTimer, maxDuration, quality, onError, updateState, stopRecordingTimer]);

  const stopRecording = useCallback(async () => {
    try {
      if (cameraRef.current && state.isRecording) {
        cameraRef.current.stopRecording();
        onRecordingStop?.();
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      onError?.('Failed to stop recording properly');
    }
  }, [state.isRecording, onRecordingStop, onError]);

  const handleRecordingComplete = useCallback(async (videoUri: string) => {
    try {
      updateState({ isProcessing: true });
      stopRecordingTimer();

      // Validate video file
      const isValid = await VideoUtils.validateVideoFile(videoUri);
      if (!isValid) {
        updateState({ isRecording: false, isProcessing: false });
        return;
      }

      // Save to gallery
      const asset = await VideoUtils.saveToGallery(videoUri, albumName);
      if (!asset) {
        onError?.('Failed to save video to gallery');
        updateState({ isRecording: false, isProcessing: false });
        return;
      }

      // Get video metadata
      const metadata = await VideoUtils.getVideoMetadata(videoUri);

      // Show success message - both platforms now save to gallery
      Alert.alert(
        'Recording Saved',
        `Video saved successfully to gallery in "${albumName}" album.${
          metadata ? `\n\nDuration: ${VideoUtils.formatDuration(metadata.duration)}\nSize: ${VideoUtils.formatFileSize(metadata.size)}` : ''
        }`,
        [{ text: 'OK' }]
      );

      onRecordingComplete?.(videoUri);

    } catch (error) {
      console.error('Recording completion error:', error);
      onError?.('Recording completed but failed to save properly');
    } finally {
      updateState({ isRecording: false, isProcessing: false });
    }
  }, [updateState, stopRecordingTimer, albumName, onError, onRecordingComplete]);

  const resetRecording = useCallback(() => {
    stopRecordingTimer();
    updateState({
      isRecording: false,
      isProcessing: false,
      recordingTime: 0
    });
  }, [stopRecordingTimer, updateState]);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const resetPermissions = useCallback(() => {
    Alert.alert(
      'Reset Permissions',
      'To reset permissions, please go to your device settings and manually revoke permissions for this app, then restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  }, []);

  return {
    // State
    ...state,

    // Refs
    cameraRef,

    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    requestPermissions,
    resetPermissions,

    // Utilities
    formatRecordingTime: () => formatRecordingTime(state.recordingTime),
  videoQuality: resolvedVideoQuality,

    // Permission states
    permissions: {
      camera: camPerm?.granted || false,
      microphone: micPerm?.granted || false,
      mediaLibrary: mediaLibraryPerm?.granted || false
    }
  };
}

export default useVideoRecording;