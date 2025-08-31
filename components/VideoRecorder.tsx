import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevices,
} from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import { Play, Square, Camera as CameraIcon } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

interface VideoRecorderProps {
  onRecordingComplete?: (videoUri: string) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  quality?: '480p' | '720p' | '1080p' | '4k';
}

export default function VideoRecorder({
  onRecordingComplete,
  onError,
  maxDuration = 3600,
  quality = '1080p',
}: VideoRecorderProps) {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission: hasCamPerm, requestPermission: requestCamPerm } = useCameraPermission();
  const { hasPermission: hasMicPerm, requestPermission: requestMicPerm } = useMicrophonePermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');
  const [mediaLibraryPerm, requestMediaLibraryPerm] =
    MediaLibrary.usePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
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

  const requestAllPermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      if (!hasCamPerm) {
        const camResult = await requestCamPerm();
        if (!camResult) {
          onError?.('Camera permission is required to record videos');
          return false;
        }
      }

      // Request microphone permission
      if (!hasMicPerm) {
        const micResult = await requestMicPerm();
        if (!micResult) {
          onError?.('Microphone permission is required to record audio');
          return false;
        }
      }

      // Request media library permission
      if (!mediaLibraryPerm?.granted) {
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          onError?.('Storage permission is required to save videos');
          return false;
        }
      }

      setIsInitialized(true);
      return true;
    } catch (error) {
      onError?.('Failed to request permissions');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermissions = await requestAllPermissions();
      if (!hasPermissions) return;

      if (!cameraRef.current) {
        onError?.('Camera not ready');
        return;
      }

      setIsRecording(true);

      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          await saveVideoToGallery(video.path);
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          onError?.('Failed to record video');
          setIsRecording(false);
        }
      });
    } catch (error) {
      console.error('Recording error:', error);
      onError?.('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (cameraRef.current && isRecording) {
        await cameraRef.current.stopRecording();
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      onError?.('Failed to stop recording');
    }
  };

  const saveVideoToGallery = async (videoUri: string) => {
    try {
      // Create asset from the recorded video
      const asset = await MediaLibrary.createAssetAsync(videoUri);

      // Create or get the Raydel Recordings album
      let album = await MediaLibrary.getAlbumAsync('Raydel Recordings');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(
          'Raydel Recordings',
          asset,
          false
        );
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      onRecordingComplete?.(videoUri);
    } catch (error) {
      console.error('Save error:', error);
      onError?.('Failed to save video to gallery');
    } finally {
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  if (!isInitialized || !hasCamPerm || !device) {
    return (
      <View style={styles.permissionContainer}>
        <CameraIcon size={48} color="#00D4FF" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please grant camera and microphone permissions to record videos
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestAllPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
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
        video={true}
        audio={true}
      />

      <View style={styles.overlay}>
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              REC {formatTime(recordingTime)}
            </Text>
          </View>
        )}

        {/* Control buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square size={24} color="#fff" />
            ) : (
              <Play size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 60,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordingButton: {
    backgroundColor: '#666',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  permissionTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
