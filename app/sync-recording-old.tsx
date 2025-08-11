import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  ArrowLeft,
  Smartphone,
  Wifi,
  WifiOff,
  Users,
  Play,
  Square,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Copy,
  Camera,
} from 'lucide-react-native';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface SyncSession {
  id: string;
  isHost: boolean;
  connectedDevice?: string;
  status: 'waiting' | 'connected' | 'recording' | 'disconnected';
}

export default function SyncRecordingScreen() {
  const [sessionMode, setSessionMode] = useState<'select' | 'host' | 'join'>(
    'select'
  );
  const [session, setSession] = useState<SyncSession | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const [connectedDeviceName, setConnectedDeviceName] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [shouldShowCamera, setShouldShowCamera] = useState(false);
  const [otherDeviceCameraReady, setOtherDeviceCameraReady] = useState(false);
  const [isRecordingAttemptInProgress, setIsRecordingAttemptInProgress] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [mediaLibraryPerm, requestMediaLibraryPerm] =
    MediaLibrary.usePermissions();

  // WebSocket connection management
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (cameraInitTimeoutRef.current) {
        clearTimeout(cameraInitTimeoutRef.current);
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const resolveSyncServerUrl = (): string => {
    const envUrl = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;
    if (envUrl && (envUrl.startsWith('ws://') || envUrl.startsWith('wss://'))) {
      return envUrl.endsWith('/sync')
        ? envUrl
        : `${envUrl.replace(/\/$/, '')}/sync`;
    }

    // For physical devices, we need to use the actual IP address
    // Check if we're running on a physical device by looking at the debugger host
    let host: string | undefined;
    const debuggerHost =
      (Constants as any)?.expoGoConfig?.debuggerHost ||
      (Constants as any)?.manifest2?.extra?.expoClient?.debuggerHost ||
      (Constants as any)?.manifest?.debuggerHost;

    if (typeof debuggerHost === 'string') {
      // Extract the IP address from debugger host (e.g., "192.168.1.222:8081" -> "192.168.1.222")
      host = debuggerHost.split(':')[0];

      // If it's a local IP address (192.168.x.x or 10.x.x.x), use it
      if (host.startsWith('192.168.') || host.startsWith('10.')) {
        console.log('Using network IP for sync server:', host);
      } else if (host === 'localhost' || host === '127.0.0.1') {
        // Running in simulator/emulator
        if (Platform.OS === 'android') {
          host = '10.0.2.2'; // Android emulator loopback to host
        } else {
          host = 'localhost'; // iOS simulator or web
        }
      }
    } else {
      // Fallback to localhost if we can't determine the host
      host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }

    const protocol = 'ws';
    const port = 3001;
    const url = `${protocol}://${host}:${port}/sync`;
    console.log('WebSocket URL:', url);
    return url;
  };

  const connectToSyncServer = (sessionId: string, isHost: boolean) => {
    try {
      // Connect to the sync server WebSocket endpoint. The session is passed in the first message.
      const url = resolveSyncServerUrl();
      console.log('Connecting to WebSocket:', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to sync server');
        setConnectionStatus('connecting');

        // Send initial connection message
        const joinMessage = {
          type: 'join',
          sessionId,
          isHost,
          deviceName: `Device ${Math.random().toString(36).substring(7)}`,
        };
        console.log('Sending join message:', joinMessage);
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          handleSyncMessage(message);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setSession((prev) =>
          prev ? { ...prev, status: 'disconnected' } : null
        );

        // Only show alert for unexpected disconnections
        if (event.code !== 1000 && event.code !== 1001) {
          Alert.alert(
            'Connection Lost',
            'Connection to sync server was lost. Please try again.'
          );
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error details:', error);
        setConnectionStatus('disconnected');

        // Provide more specific error message
        let errorMessage = 'Failed to connect to sync server.';
        const errorString = JSON.stringify(error);

        if (errorString.includes('1005')) {
          errorMessage =
            'Connection closed unexpectedly. Please check your network and try again.';
        } else if (errorString.includes('ECONNREFUSED')) {
          errorMessage =
            'Cannot reach sync server. Make sure the server is running on port 3001.';
        }

        Alert.alert('Connection Error', errorMessage);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      Alert.alert(
        'Connection Error',
        'Failed to initialize connection. Please check your network settings.'
      );
    }
  };

  const handleSyncMessage = (message: any) => {
    switch (message.type) {
      case 'device_connected':
        setConnectionStatus('connected');
        setConnectedDeviceName(message.deviceName);
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: 'connected',
                connectedDevice: message.deviceName,
              }
            : null
        );
        // Now both devices are connected - show camera and initialize
        console.log('📷 Device connected - showing camera and initializing');
        setShouldShowCamera(true);
        // Give camera time to initialize (2 seconds)
        cameraInitTimeoutRef.current = setTimeout(() => {
          console.log('📷 ✅ Camera marked as ready after timeout');
          setIsCameraReady(true);
        }, 2000);
        Alert.alert('Device Connected', `Connected to ${message.deviceName}`);
        break;

      case 'joined':
        // This handles when we successfully join a session
        console.log('📷 Successfully joined session:', message.sessionId);
        console.log('📷 Setting up camera for joined session');
        setConnectionStatus('connected');
        setShouldShowCamera(true);
        // Initialize camera for the joining device
        cameraInitTimeoutRef.current = setTimeout(() => {
          console.log(
            '📷 ✅ Joined session camera marked as ready after timeout'
          );
          setIsCameraReady(true);
        }, 2000);
        break;

      case 'camera_ready':
        // Handle camera ready confirmation from other device
        console.log('📷 🎯 Received camera_ready from other device');
        setOtherDeviceCameraReady(true);
        break;

      case 'start_recording':
        console.log('🎯 Received start_recording message from server');
        
        // If not already recording, start immediately with minimal delay for sync
        if (!isRecording) {
          console.log('🎬 Starting recording from sync command');
          setIsRecording(true);
          setSession((prev) => (prev ? { ...prev, status: 'recording' } : null));
          
          // Small delay to ensure UI updates, then start recording
          setTimeout(() => {
            handleStartRecording(true);
          }, 50);
        } else {
          console.log('🔄 Already recording, ignoring sync start command');
        }
        break;

      case 'stop_recording':
        console.log('🛑 Received stop_recording message from server');

        // Always process stop recording command to ensure both devices save their recordings
        console.log(
          '🛑 Processing stop command - ensuring local recording is saved'
        );
        handleStopRecording(true); // true indicates sync command
        break;

      case 'device_disconnected':
        setConnectionStatus('disconnected');
        setConnectedDeviceName('');
        setSession((prev) => (prev ? { ...prev, status: 'waiting' } : null));
        Alert.alert(
          'Device Disconnected',
          'The other device has disconnected.'
        );
        break;

      case 'error':
        console.log('❌ Received error from server:', message.message);

        // Handle specific error cases
        if (message.message === 'Recording already in progress') {
          // Server says recording already in progress, but our UI might be out of sync
          console.log(
            '🔄 Server says recording already in progress - syncing UI state'
          );
          if (!isRecording) {
            setIsRecording(true);
            setSession((prev) =>
              prev ? { ...prev, status: 'recording' } : null
            );
          }
          // Don't show alert for this case since it's a state sync issue
        } else {
          Alert.alert('Sync Error', message.message);
        }

        // Clear attempt flag on any error
        setIsRecordingAttemptInProgress(false);
        break;
    }
  };

  const sendSyncCommand = (command: string, data?: any) => {
    console.log(`📡 === SENDING SYNC COMMAND ===`);
    console.log(`📡 Command: ${command}`);
    console.log(`📡 WebSocket state: ${wsRef.current?.readyState}`);
    console.log(`📡 WebSocket OPEN constant: ${WebSocket.OPEN}`);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: command,
        ...data,
      };
      console.log(`📡 Sending payload:`, payload);
      wsRef.current.send(JSON.stringify(payload));
      console.log(`📡 ✅ Command sent successfully`);
    } else {
      console.log(`📡 ❌ Cannot send - WebSocket not open`);
    }
    console.log(`📡 === END SYNC COMMAND ===`);
  };

  const handleHostSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setSession({
      id: newSessionId,
      isHost: true,
      status: 'waiting',
    });
    setSessionMode('host');
    // Don't show camera until another device connects
    setShouldShowCamera(false);
    setIsCameraReady(false);
    setIsRecordingAttemptInProgress(false);
    connectToSyncServer(newSessionId, true);
  };

  const handleJoinSession = () => {
    if (!inputSessionId.trim()) {
      Alert.alert('Invalid Session ID', 'Please enter a valid session ID.');
      return;
    }

    setSession({
      id: inputSessionId.toUpperCase(),
      isHost: false,
      status: 'waiting',
    });
    setSessionMode('join');
    // Don't show camera until connection is established
    setShouldShowCamera(false);
    setIsCameraReady(false);
    setIsRecordingAttemptInProgress(false);
    connectToSyncServer(inputSessionId.toUpperCase(), false);
  };

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      console.log('🔒 Checking permissions...');
      console.log('🔒 Current camera permission:', camPerm?.granted);
      console.log('🔒 Current microphone permission:', micPerm?.granted);
      console.log(
        '🔒 Current media library permission:',
        mediaLibraryPerm?.granted
      );

      if (!camPerm?.granted) {
        console.log('🔒 Requesting camera permission...');
        const camResult = await requestCamPerm();
        if (!camResult.granted) {
          console.log('❌ Camera permission denied');
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access to record videos.'
          );
          return false;
        }
        console.log('✅ Camera permission granted');
      }

      if (!micPerm?.granted) {
        console.log('🔒 Requesting microphone permission...');
        const micResult = await requestMicPerm();
        if (!micResult.granted) {
          console.log('❌ Microphone permission denied');
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access to record audio.'
          );
          return false;
        }
        console.log('✅ Microphone permission granted');
      }

      if (!mediaLibraryPerm?.granted) {
        console.log('🔒 Requesting media library permission...');
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          console.log('❌ Media library permission denied');
          Alert.alert(
            'Storage Permission Required',
            'Please enable storage access to save videos.'
          );
          return false;
        }
        console.log('✅ Media library permission granted');
      }

      console.log('✅ All permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Permission error:', error);
      Alert.alert('Permission Error', 'Failed to request permissions.');
      return false;
    }
  };

  const handleStartRecording = async (isSync = false, retryCount = 0) => {
    console.log(`🎬 === START RECORDING DEBUG === `);
    console.log(`🎬 isSync: ${isSync}`);
    console.log(`🎬 connectionStatus: ${connectionStatus}`);
    console.log(`🎬 isCameraReady: ${isCameraReady}`);
    console.log(`🎬 otherDeviceCameraReady: ${otherDeviceCameraReady}`);
    console.log(`🎬 cameraRef.current: ${!!cameraRef.current}`);
    console.log(`🎬 isRecording: ${isRecording}`);
    console.log(
      `🎬 isRecordingAttemptInProgress: ${isRecordingAttemptInProgress}`
    );

    // Prevent multiple simultaneous attempts only for user-initiated starts.
    // Allow sync-initiated starts to proceed even if a prior user click set the flag.
    if (isRecordingAttemptInProgress && !isSync) {
      console.log('🔒 Recording attempt already in progress, ignoring');
      return;
    }

    if (isRecording && !isSync) {
      console.log('⚠️ Already recording, ignoring command');
      return;
    }

    if (connectionStatus !== 'connected' && !isSync) {
      console.log('❌ Connection not ready for user-initiated recording');
      Alert.alert(
        'Not Connected',
        'Please wait for both devices to be connected before recording.'
      );
      return;
    }

    // For user-initiated starts, we schedule via server and immediately update UI
    if (!isSync) {
      try {
        const hasPermissions = await ensurePermissions();
        if (!hasPermissions) return;
        if (!cameraRef.current || !isCameraReady) {
          Alert.alert(
            'Camera Not Ready',
            'Please wait for the camera to initialize.'
          );
          return;
        }

        // Set flag to prevent double-clicks
        setIsRecordingAttemptInProgress(true);

        console.log(
          '📡 Sending start_recording request; will start on atomic timestamp'
        );
        sendSyncCommand('start_recording');
        return;
      } catch (err) {
        console.error('❌ Failed to initiate sync start:', err);
        Alert.alert('Error', 'Failed to initiate synchronized start.');
        setIsRecordingAttemptInProgress(false);
        return;
      }
    }

    // Set flag to prevent concurrent attempts for sync-executed start
    setIsRecordingAttemptInProgress(true);

    try {
      const hasPermissions = await ensurePermissions();
      if (!hasPermissions) {
        console.log('❌ Permissions not granted');
        return;
      }

      // Check if camera is ready
      if (!cameraRef.current || !isCameraReady) {
        console.log(
          `❌ Camera not ready - cameraRef: ${!!cameraRef.current}, isCameraReady: ${isCameraReady}`
        );

        if (isSync && retryCount < 3) {
          console.log(
            `⏳ Camera not ready for sync command, retry ${
              retryCount + 1
            }/3 in 300ms...`
          );
          setTimeout(() => {
            setIsRecordingAttemptInProgress(false);
            handleStartRecording(true, retryCount + 1);
          }, 300);
          return;
        } else {
          console.log('❌ Camera not ready - cannot start recording');
          if (isSync && retryCount >= 3) {
            console.log('❌ Max retries reached for sync command');
          } else {
            Alert.alert(
              'Camera Error',
              'Camera not ready. Please wait a moment and try again.'
            );
          }
          return;
        }
      }

      console.log('✅ Starting recording process...');

      // Recording state is already set by the message handler, don't set it again
      console.log('🔄 This is a sync command - recording state already set');

      // Start recording
      console.log('🎥 Starting camera recording...');
      try {
        cameraIsRecordingRef.current = true;
        // Flip UI to recording at the moment we begin the camera
        setIsRecording(true);
        setSession((prev) => (prev ? { ...prev, status: 'recording' } : null));
        const recording = await cameraRef.current.recordAsync({
          maxDuration: 3600,
        });

        console.log('🎥 Recording completed, URI:', recording?.uri);
        if (recording?.uri) {
          await saveRecording(recording.uri);
          console.log('💾 Recording saved successfully');
        } else {
          console.log(
            '⚠️ Recording completed but no URI returned - resetting UI state'
          );
          // Only reset state here if no URI (save function handles state reset when successful)
          setIsRecording(false);
          setIsRecordingAttemptInProgress(false);
          setSession((prev) =>
            prev ? { ...prev, status: 'connected' } : null
          );
        }
      } catch (recordingError) {
        console.error('❌ Camera recording failed:', recordingError);
        setIsRecording(false);
        setIsRecordingAttemptInProgress(false);
        throw recordingError;
      } finally {
        cameraIsRecordingRef.current = false;
      }
    } catch (error) {
      console.error('❌ Recording error:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.'
      );
      setIsRecording(false);
    } finally {
      // Always clear the attempt flag
      setIsRecordingAttemptInProgress(false);
    }
    console.log(`🎬 === END START RECORDING DEBUG === `);
  };

  const handleStopRecording = async (isSync = false) => {
    console.log('🛑 === STOP RECORDING DEBUG ===');
    console.log('🛑 isSync:', isSync);
    console.log('🛑 isRecording:', isRecording);

    try {
      // Cancel any pending start timers
      if (pendingStartTimeoutRef.current) {
        console.log('🛑 Cancelling pending start timer');
        clearTimeout(pendingStartTimeoutRef.current);
        pendingStartTimeoutRef.current = null;
      }

      // Send sync command to other device first (for user-initiated stops)
      if (!isSync) {
        console.log('📡 Sending stop_recording sync command to server');
        sendSyncCommand('stop_recording');
      }

      // Stop the camera recording - this will cause recordAsync promise to resolve
      if (cameraRef.current && cameraIsRecordingRef.current) {
        console.log('📹 Stopping camera recording...');
        cameraRef.current.stopRecording();
        console.log(
          '📹 Stop command sent - waiting for recordAsync to resolve and save video'
        );
        // Immediately update UI back to connected
        setIsRecording(false);
        setIsRecordingAttemptInProgress(false);
        setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
      } else {
        console.log('📹 No active recording to stop');
        // Ensure UI state is reset
        setIsRecording(false);
        setIsRecordingAttemptInProgress(false);
        setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
      }

      console.log('✅ Stop recording command completed');
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording properly.');
      setIsRecording(false);
      setIsRecordingAttemptInProgress(false);
    }
    console.log('🛑 === END STOP RECORDING DEBUG ===');
  };

  const saveRecording = async (videoUri: string) => {
    try {
      console.log('💾 === SAVING RECORDING ===');
      console.log('💾 Video URI:', videoUri);

      const asset = await MediaLibrary.createAssetAsync(videoUri);

      let album = await MediaLibrary.getAlbumAsync('Raydel Sync Recordings');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(
          'Raydel Sync Recordings',
          asset,
          false
        );
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      console.log('💾 Recording saved successfully to gallery');

      // Show success message and reset UI state (like record.tsx does)
      Alert.alert(
        'Recording Saved',
        `Synchronized recording saved successfully to ${
          Platform.OS === 'ios' ? 'Photos' : 'Gallery'
        } in "Raydel Sync Recordings" album.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('💾 Resetting UI state after save');
              // Reset UI state after user acknowledges save
              setIsRecording(false);
              setIsRecordingAttemptInProgress(false);
              setSession((prev) =>
                prev ? { ...prev, status: 'connected' } : null
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('💾 Save error:', error);
      Alert.alert(
        'Save Error',
        'Recording completed but failed to save to gallery. The video may still be available in your camera roll.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('💾 Resetting UI state after save error');
              // Reset UI state even on save error
              setIsRecording(false);
              setIsRecordingAttemptInProgress(false);
              setSession((prev) =>
                prev ? { ...prev, status: 'connected' } : null
              );
            },
          },
        ]
      );
    }
  };

  const copySessionId = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Session ID Copied', `Session ID: ${sessionId}`);
  };

  const testConnection = async () => {
    const url = resolveSyncServerUrl();
    console.log('Testing connection to:', url);

    try {
      // Try to connect to health endpoint first
      const httpUrl = url
        .replace('ws://', 'http://')
        .replace('/sync', '/health');
      const response = await fetch(httpUrl, {
        method: 'GET',
        timeout: 5000,
      } as any);

      if (response.ok) {
        Alert.alert(
          'Connection Test',
          'Server is reachable! Try connecting again.'
        );
      } else {
        Alert.alert(
          'Connection Test',
          'Server responded but with an error. Check server logs.'
        );
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert(
        'Connection Test Failed',
        `Cannot reach server at ${url}. Make sure:\n\n` +
          '1. The sync server is running on port 3001\n' +
          '2. Both devices are on the same network\n' +
          '3. Your firewall allows connections on port 3001'
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const renderModeSelection = () => (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Recording</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          Synchronized dual-camera recording
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.modeSelection}>
          <TouchableOpacity style={styles.modeCard} onPress={handleHostSession}>
            <LinearGradient
              colors={['#00D4FF', '#0099CC']}
              style={styles.modeGradient}
            >
              <Smartphone size={32} color="#fff" />
              <Text style={styles.modeTitle}>Host Session</Text>
              <Text style={styles.modeDescription}>
                Create a new recording session and wait for another device to
                join
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setSessionMode('join')}
          >
            <LinearGradient
              colors={['#00FF88', '#00CC6A']}
              style={styles.modeGradient}
            >
              <Users size={32} color="#fff" />
              <Text style={styles.modeTitle}>Join Session</Text>
              <Text style={styles.modeDescription}>
                Connect to an existing recording session using a session ID
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              1. One device hosts a session and shares the session ID{'\n'}
              2. The second device joins using the session ID{'\n'}
              3. Both cameras record simultaneously when either device starts
              recording{'\n'}
              4. Perfect synchronization ensures frame-aligned footage
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderJoinMode = () => (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSessionMode('select')}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Session</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>Enter session ID to connect</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.joinSection}>
          <Text style={styles.sectionTitle}>Session ID</Text>
          <TextInput
            style={styles.sessionInput}
            value={inputSessionId}
            onChangeText={setInputSessionId}
            placeholder="Enter 6-digit session ID"
            placeholderTextColor="#888"
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinSession}
          >
            <LinearGradient
              colors={['#00FF88', '#00CC6A']}
              style={styles.joinButtonGradient}
            >
              <Users size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Join Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSessionInterface = () => {
    // For joined sessions, show camera immediately when connected
    // For host sessions, show camera only after another device connects
    const showCameraCondition =
      session &&
      (shouldShowCamera ||
        (!session.isHost && connectionStatus === 'connected'));

    if (showCameraCondition) {
      return (
        <View style={styles.container}>
          <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (wsRef.current) wsRef.current.close();
                  setSessionMode('select');
                  setSession(null);
                  setShouldShowCamera(false);
                  setIsCameraReady(false);
                  setIsRecordingAttemptInProgress(false);
                }}
              >
                <ArrowLeft size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sync Recording</Text>
              <View style={styles.connectionIndicator}>
                {connectionStatus === 'connected' ? (
                  <>
                    <CheckCircle size={16} color="#00FF88" />
                    <Text style={[styles.connectionText, { color: '#00FF88' }]}>
                      Connected
                    </Text>
                  </>
                ) : (
                  <>
                    <Wifi size={16} color="#FFD700" />
                    <Text style={[styles.connectionText, { color: '#FFD700' }]}>
                      Waiting...
                    </Text>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              mode="video"
              onCameraReady={() => {
                console.log('📷 CameraView onCameraReady callback fired');
                console.log('📷 Connection status:', connectionStatus);
                // Send camera ready signal if connected
                if (connectionStatus === 'connected') {
                  console.log('📷 Sending camera_ready signal to server');
                  sendSyncCommand('camera_ready');
                } else {
                  console.log(
                    '📷 Not sending camera_ready - not connected yet'
                  );
                }
              }}
            />

            <View style={styles.cameraOverlay}>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>
                    REC {formatTime(recordingTime)}
                  </Text>
                </View>
              )}

              {connectionStatus === 'connected' && (
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceInfoText}>
                    Connected to: {connectedDeviceName}
                  </Text>
                  <Text style={styles.sessionIdText}>
                    Session: {session.id}
                  </Text>
                  {!isCameraReady && (
                    <Text
                      style={[
                        styles.deviceInfoText,
                        { color: '#FFD700', marginTop: 4 },
                      ]}
                    >
                      Initializing local camera...
                    </Text>
                  )}
                </View>
              )}

              {connectionStatus === 'connected' && (
                <View style={styles.recordingControls}>
                  {!isRecording ? (
                    <TouchableOpacity
                      style={[
                        styles.recordButton,
                        !isCameraReady && styles.disabledButton,
                      ]}
                      onPress={() => handleStartRecording()}
                      disabled={!isCameraReady}
                    >
                      <LinearGradient
                        colors={
                          isCameraReady
                            ? ['#FF6B6B', '#FF4757']
                            : ['#666', '#555']
                        }
                        style={styles.recordButtonGradient}
                      >
                        <Play size={24} color="#fff" />
                        <Text style={styles.recordButtonText}>
                          {!isCameraReady
                            ? 'Preparing Local Camera...'
                            : 'Start Sync Recording'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={() => handleStopRecording()}
                    >
                      <Square size={24} color="#fff" />
                      <Text style={styles.stopButtonText}>Stop Recording</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (wsRef.current) wsRef.current.close();
                setSessionMode('select');
                setSession(null);
                setShouldShowCamera(false);
                setIsCameraReady(false);
                setIsRecordingAttemptInProgress(false);
              }}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {session?.isHost ? 'Hosting Session' : 'Joining Session'}
            </Text>
            <View style={styles.connectionIndicator}>
              {connectionStatus === 'connecting' ? (
                <Wifi size={16} color="#FFD700" />
              ) : (
                <WifiOff size={16} color="#FF6B6B" />
              )}
              <Text
                style={[
                  styles.connectionText,
                  {
                    color:
                      connectionStatus === 'connecting' ? '#FFD700' : '#FF6B6B',
                  },
                ]}
              >
                {connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Waiting...'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {session?.isHost && (
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>Session ID</Text>
              <View style={styles.sessionIdContainer}>
                <Text style={styles.sessionIdDisplay}>{session.id}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copySessionId}
                >
                  <Copy size={16} color="#00D4FF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.sessionInstructions}>
                Share this session ID with the other device to connect
              </Text>
            </View>
          )}

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <AlertCircle size={20} color="#FFD700" />
              <Text style={styles.statusTitle}>Waiting for Connection</Text>
            </View>
            <Text style={styles.statusText}>
              {session?.isHost
                ? 'Waiting for another device to join this session...'
                : `Connecting to session ${session?.id}...`}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  switch (sessionMode) {
    case 'join':
      // If we're joining and not yet in a session, show the join form
      if (!session) {
        return renderJoinMode();
      }
      // Once we have a session, show the session interface
      return renderSessionInterface();
    case 'host':
      return renderSessionInterface();
    default:
      return renderModeSelection();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  modeSelection: {
    gap: 16,
    marginBottom: 32,
  },
  modeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  infoSection: {
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  joinSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sessionInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 24,
    width: '100%',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  joinButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sessionIdDisplay: {
    fontSize: 32,
    color: '#00D4FF',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copyButton: {
    padding: 8,
  },
  sessionInstructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
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
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 60,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deviceInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  deviceInfoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  sessionIdText: {
    color: '#00D4FF',
    fontSize: 12,
    textAlign: 'center',
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recordButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
