import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Smartphone, Wifi, Settings, Play, Users, MapPin, Upload, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function RecordScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [mediaLibraryPerm, requestMediaLibraryPerm] = MediaLibrary.usePermissions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      if (!camPerm?.granted) {
        const camResult = await requestCamPerm();
        if (!camResult.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in your device settings to record videos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      // Request microphone permission
      if (!micPerm?.granted) {
        const micResult = await requestMicPerm();
        if (!micResult.granted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access in your device settings to record audio.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      // Request media library permission
      if (!mediaLibraryPerm?.granted) {
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          Alert.alert(
            'Storage Permission Required',
            'Please enable storage access to save recorded videos.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Permission Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  const handleStartRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available',
        'Camera recording is not available on web. Please use a mobile device.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const hasPermissions = await ensurePermissions();
      if (!hasPermissions) return;

      setShowCamera(true);
      setIsRecording(true);

      // Small delay to ensure camera is ready
      setTimeout(async () => {
        if (cameraRef.current) {
          try {
            const recording = await cameraRef.current.recordAsync({
              maxDuration: 3600, // 1 hour max
              quality: '1080p',
              mute: false,
            });

            if (recording?.uri) {
              await handleRecordingComplete(recording.uri);
            }
          } catch (recordError) {
            console.error('Recording error:', recordError);
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
            setIsRecording(false);
            setShowCamera(false);
          }
        }
      }, 500);

    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
      setShowCamera(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (cameraRef.current && isRecording) {
        cameraRef.current.stopRecording();
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording properly.');
    }
  };

  const handleRecordingComplete = async (videoUri: string) => {
    try {
      setIsProcessing(true);
      
      // Create asset from the recorded video
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      
      // Create or get the Raydel Recordings album
      let album = await MediaLibrary.getAlbumAsync('Raydel Recordings');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Raydel Recordings', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Show success message
      Alert.alert(
        'Recording Saved',
        `Video saved successfully to ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'} in "Raydel Recordings" album.`,
        [
          {
            text: 'View Report',
            onPress: () => router.push('/report/1')
          },
          {
            text: 'Record Another',
            onPress: () => {
              setIsRecording(false);
              setShowCamera(false);
              setIsProcessing(false);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Save recording error:', error);
      Alert.alert(
        'Save Error',
        'Recording completed but failed to save to gallery. The video may still be available in your camera roll.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRecording(false);
      setShowCamera(false);
      setIsProcessing(false);
    }
  };

  const handleCameraSetup = () => {
    router.push('/calibration');
  };

  if (showCamera && Platform.OS !== 'web') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef} 
          style={styles.camera} 
          facing="back" 
          mode="video"
          onRecordingStatusChange={(status) => {
            if (!status.isRecording && isRecording) {
              // Recording stopped
              setIsRecording(false);
            }
          }}
        />
        
        <View style={styles.cameraOverlay}>
          {/* Recording indicator */}
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, { backgroundColor: isRecording ? '#FF0000' : '#666' }]} />
            <Text style={styles.recordingText}>
              {isProcessing ? 'PROCESSING...' : (isRecording ? 'RECORDING' : 'STOPPED')}
            </Text>
          </View>

          {/* Control buttons */}
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (isRecording) {
                  handleStopRecording();
                } else {
                  setShowCamera(false);
                }
              }}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.stopButton, isProcessing && styles.disabledButton]}
              onPress={handleStopRecording}
              disabled={!isRecording || isProcessing}
            >
              <Text style={styles.stopButtonText}>
                {isProcessing ? 'Processing...' : 'Stop Recording'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Match</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>Set up dual cameras for AI analysis</Text>
      </LinearGradient>

      {/* Camera Status Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camera Setup</Text>
        
        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <Smartphone size={24} color="#00D4FF" />
            <Text style={styles.cameraTitle}>Primary Camera</Text>
            <View style={[styles.statusDot, { backgroundColor: camPerm?.granted ? '#00FF88' : '#FF6B6B' }]} />
          </View>
          <Text style={styles.cameraDescription}>Mount on back wall (Player 1 side)</Text>
          <Text style={[styles.cameraStatus, { color: camPerm?.granted ? '#00FF88' : '#FF6B6B' }]}>
            {camPerm?.granted ? 'Ready' : 'Permission Required'}
          </Text>
        </View>

        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <Smartphone size={24} color="#00D4FF" />
            <Text style={styles.cameraTitle}>Audio Recording</Text>
            <View style={[styles.statusDot, { backgroundColor: micPerm?.granted ? '#00FF88' : '#FF6B6B' }]} />
          </View>
          <Text style={styles.cameraDescription}>High-quality audio capture</Text>
          <Text style={[styles.cameraStatus, { color: micPerm?.granted ? '#00FF88' : '#FF6B6B' }]}>
            {micPerm?.granted ? 'Ready' : 'Permission Required'}
          </Text>
        </View>
      </View>

      {/* Setup Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup Instructions</Text>
        
        <View style={styles.instructionCard}>
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Grant Permissions</Text>
              <Text style={styles.stepDescription}>
                Allow camera, microphone, and storage access for recording
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Position Camera</Text>
              <Text style={styles.stepDescription}>
                Mount phone on back wall ensuring clear view of entire court
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Recording</Text>
              <Text style={styles.stepDescription}>
                Tap the record button to begin capturing your match
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Match Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Settings</Text>
        
        <TouchableOpacity style={styles.settingCard}>
          <Users size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Players</Text>
            <Text style={styles.settingValue}>4 Players</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <MapPin size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Court Type</Text>
            <Text style={styles.settingValue}>Standard Padel Court</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <Settings size={20} color="#00D4FF" />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Quality</Text>
            <Text style={styles.settingValue}>1080p HD</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/upload')}
        >
          <Upload size={20} color="#00D4FF" />
          <Text style={styles.secondaryButtonText}>Upload Video</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleCameraSetup}
        >
          <Camera size={20} color="#00D4FF" />
          <Text style={styles.secondaryButtonText}>Setup Cameras</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryButton, (isRecording || isProcessing) && styles.disabledButton]}
          onPress={handleStartRecording}
          disabled={isRecording || isProcessing}
        >
          <LinearGradient
            colors={isRecording || isProcessing ? ['#333', '#333'] : ['#00FF88', '#00CC6A']}
            style={styles.primaryButtonGradient}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Processing...' : (isRecording ? 'Recording...' : 'Start Recording')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 60,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 25,
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cameraCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  cameraStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingValue: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    padding: 20,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00D4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});