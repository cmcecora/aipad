import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
} from 'lucide-react-native';
import {
  Camera,
  useCameraPermission,
  useMicrophonePermission,
  useCameraDevices,
} from 'react-native-vision-camera';
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
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [timeOffset, setTimeOffset] = useState(0);
  const [networkLatency, setNetworkLatency] = useState(0);
  const [isPreWarming, setIsPreWarming] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStatusRef = useRef<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeSyncSamples = useRef<Array<{ offset: number; latency: number }>>([]);
  const recordingScheduled = useRef(false);
  const serverStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { hasPermission: hasCamPerm, requestPermission: requestCamPerm } = useCameraPermission();
  const { hasPermission: hasMicPerm, requestPermission: requestMicPerm } = useMicrophonePermission();
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');
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
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (serverStartTimeoutRef.current) {
        clearTimeout(serverStartTimeoutRef.current);
        serverStartTimeoutRef.current = null;
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

    let host: string | undefined;
    const debuggerHost =
      (Constants as any)?.expoGoConfig?.debuggerHost ||
      (Constants as any)?.manifest2?.extra?.expoClient?.debuggerHost ||
      (Constants as any)?.manifest?.debuggerHost;

    if (typeof debuggerHost === 'string') {
      host = debuggerHost.split(':')[0];
      if (host.startsWith('192.168.') || host.startsWith('10.')) {
        console.log('Using network IP for sync server:', host);
      } else if (host === 'localhost' || host === '127.0.0.1') {
        if (Platform.OS === 'android') {
          host = '10.0.2.2';
        } else {
          host = 'localhost';
        }
      }
    } else {
      host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }

    // Prefer env override for phones on LAN (e.g., ws://192.168.x.x:3002/sync)
    const url = `ws://${host}:3001/sync`;
    console.log('WebSocket URL:', url);
    return url;
  };

  const connectToSyncServer = (sessionId: string, isHost: boolean) => {
    try {
      const url = resolveSyncServerUrl();
      console.log(
        '[SYNC][WS] Connecting to WebSocket:',
        url,
        'isHost:',
        isHost
      );
      console.log('[SYNC][WS] Platform:', Platform.OS);
      console.log('[SYNC][WS] SessionId:', sessionId);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(
          '[SYNC][WS][OPEN] ✅ Successfully connected to sync server'
        );
        setConnectionStatus('connecting');
        connectionStatusRef.current = 'connecting';

        const joinMessage = {
          type: 'join',
          sessionId,
          isHost,
          deviceName: `${Platform.OS.toUpperCase()}-${
            isHost ? 'HOST' : 'JOIN'
          }-${Math.random().toString(36).substring(2, 6)}`,
        };
        console.log('[SYNC][WS][SEND] join ->', joinMessage);
        try {
          ws.send(JSON.stringify(joinMessage));
          console.log('[SYNC][WS][SEND] ✅ Join message sent successfully');
        } catch (sendError) {
          console.error(
            '[SYNC][WS][SEND] ❌ Failed to send join message:',
            sendError
          );
        }

        // Start keepalive ping interval (every 30 seconds)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log('[SYNC][WS][PING] Sending keepalive ping');
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[SYNC][WS][RECV]', message);
          handleSyncMessage(message);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('[SYNC][WS][CLOSE] ❌ WebSocket connection closed');
        console.log('[SYNC][WS][CLOSE] ❌ Code:', event.code);
        console.log('[SYNC][WS][CLOSE] ❌ Reason:', event.reason);
        console.log('[SYNC][WS][CLOSE] ❌ WasClean:', event.wasClean);
        console.error(
          '[SYNC][WS][CLOSE] ❌ Connection lost - this will break sync!'
        );
        setConnectionStatus('disconnected');
        connectionStatusRef.current = 'disconnected';
        setSession((prev) =>
          prev ? { ...prev, status: 'disconnected' } : null
        );

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error(
          '[SYNC][WS][ERROR] ❌ WebSocket connection failed:',
          error
        );
        console.error('[SYNC][WS][ERROR] ❌ URL was:', url);
        console.error('[SYNC][WS][ERROR] ❌ Platform:', Platform.OS);
        setConnectionStatus('disconnected');
        connectionStatusRef.current = 'disconnected';
        Alert.alert(
          'Connection Error',
          `Failed to connect to sync server at ${url}. Make sure the server is running and accessible.`
        );
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      Alert.alert('Connection Error', 'Failed to initialize connection.');
    }
  };

  const handleSyncMessage = (message: any) => {
    switch (message.type) {
      case 'time_sync_request': {
        // Respond immediately with high-precision timestamp
        const clientTimestamp = Date.now();
        const response = {
          type: 'time_sync_response',
          request_id: message.request_id,
          client_timestamp: clientTimestamp,
          server_timestamp: message.server_timestamp
        };
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(response));
        }
        break;
      }

      case 'time_sync_update': {
        // Store time sync data
        const { offset_ms, latency_ms, sample_count } = message;
        setTimeOffset(offset_ms);
        setNetworkLatency(latency_ms);
        timeSyncSamples.current.push({ offset: offset_ms, latency: latency_ms });
        if (timeSyncSamples.current.length > 10) {
          timeSyncSamples.current.shift();
        }
        console.log(`⏱ Time sync update: offset=${offset_ms.toFixed(2)}ms, latency=${latency_ms.toFixed(2)}ms, samples=${sample_count}`);
        break;
      }

      case 'readiness_update': {
        const { ready_devices, total_devices, all_ready } = message;
        console.log(`📊 Readiness: ${ready_devices}/${total_devices} devices ready`);
        if (all_ready) {
          console.log('✅ All devices ready for synchronized recording!');
        }
        break;
      }

      case 'device_connected':
        console.log(
          '📱 Device connected - setting up camera with pre-warming'
        );
        console.log(
          '📱 Setting connectionStatus to CONNECTED (device_connected)'
        );
        setConnectionStatus('connected');
        connectionStatusRef.current = 'connected';
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
        setShouldShowCamera(true);
        // Start pre-warming camera immediately
        preWarmCamera();
        Alert.alert(
          'Device Connected',
          `Connected to ${message.deviceName}. Press "Start Sync Recording" to begin.`
        );
        break;

      case 'joined':
        console.log(
          '📱 Successfully joined session - setting up camera with pre-warming'
        );
        console.log('📱 Setting connectionStatus to CONNECTED');
        setConnectionStatus('connected');
        connectionStatusRef.current = 'connected';
        setShouldShowCamera(true);
        // Start pre-warming camera immediately
        preWarmCamera();
        break;

      case 'start_recording': {
        console.log('🎯 Received start_recording from server');
        // Cancel any local fallback start if server broadcast arrived
        if (serverStartTimeoutRef.current) {
          clearTimeout(serverStartTimeoutRef.current);
          serverStartTimeoutRef.current = null;
        }
        
        if (recordingScheduled.current) {
          console.log('⚠️ Recording already scheduled, ignoring duplicate');
          return;
        }
        
        const { atomic_start_time, high_precision, device_timestamps } = message;
        const now = Date.now();
        
        // Use device-specific timestamp if available (accounts for clock offset)
        let targetTime = atomic_start_time;
        const deviceId = getCurrentDeviceId();
        if (device_timestamps && device_timestamps[deviceId]) {
          targetTime = device_timestamps[deviceId].atomic_start;
          console.log(`⏱ Using device-specific timestamp adjusted for clock offset`);
        }
        
        // Calculate precise delay
        let delay = Math.max(0, targetTime - now);
        
        // For high precision mode, use sub-millisecond timing
        if (high_precision && delay > 0) {
          // Account for processing time (typically 5-10ms)
          delay = Math.max(0, delay - 5);
        }
        
        console.log(`⏱ Scheduling recording start in ${delay}ms (target: ${new Date(targetTime).toISOString()})`);
        console.log('🎯 Current state:', {
          isRecording,
          connectionStatus: connectionStatusRef.current,
          isCameraReady,
          hasCameraRef: !!cameraRef.current,
          timeOffset,
          networkLatency
        });

        recordingScheduled.current = true;

        const doStart = () => {
          recordingScheduled.current = false;
          
          // Use ref for connection status to avoid stale closures
          const currentConnectionStatus = connectionStatusRef.current;
          const currentCameraRef = cameraRef.current;

          console.log('🎬 doStart() executing at:', new Date().toISOString());
          console.log('🎬 State:', {
            connectionStatus: currentConnectionStatus,
            hasCameraRef: !!currentCameraRef,
          });

          // Check if we can start recording
          const canStart = !!currentCameraRef && currentConnectionStatus === 'connected' && !isRecording;

          if (canStart) {
            console.log('🎬 ✅ Starting recording with high precision sync');
            setIsRecording(true);
            setSession((prev) =>
              prev ? { ...prev, status: 'recording' } : null
            );
            // Start immediately since we've already accounted for delays
            startActualRecording();
          } else {
            console.log('🎬 ❌ Cannot start recording:', {
              noCameraRef: !currentCameraRef,
              notConnected: currentConnectionStatus !== 'connected',
              actualStatus: currentConnectionStatus,
              alreadyRecording: isRecording,
            });
          }
        };

        // Use high-precision timer for better accuracy
        if (delay < 10) {
          // For very small delays, execute immediately
          doStart();
        } else {
          setTimeout(doStart, delay);
        }
        break;
      }

      case 'stop_recording':
        console.log('🛑 Received stop_recording from server');
        console.log('🛑 Current state:', {
          isRecording,
          hasCameraRef: !!cameraRef.current,
        });

        // Update UI state first
        setIsRecording(false);
        setCameraMode('picture');
        setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));

        // Stop camera recording if currently recording
        if (isRecording && cameraRef.current) {
          console.log('🛑 Stopping camera recording from sync command');
          setTimeout(() => {
            if (cameraRef.current) {
              cameraRef.current.stopRecording();
            }
          }, 100);
        } else {
          console.log('🛑 Not recording locally, UI updated for sync');
        }
        break;

      case 'device_disconnected':
        setConnectionStatus('disconnected');
        connectionStatusRef.current = 'disconnected';
        setConnectedDeviceName('');
        setSession((prev) => (prev ? { ...prev, status: 'waiting' } : null));
        Alert.alert(
          'Device Disconnected',
          'The other device has disconnected.'
        );
        break;

      case 'error':
        Alert.alert('Sync Error', message.message);
        break;
    }
  };

  const sendSyncCommand = (command: string, data?: any) => {
    const readyState = wsRef.current?.readyState;
    console.log(
      '[SYNC][SEND] command:',
      command,
      'readyState:',
      readyState,
      'OPEN:',
      WebSocket.OPEN
    );
    if (wsRef.current && readyState === WebSocket.OPEN) {
      const payload = { type: command, ...data };
      try {
        wsRef.current.send(JSON.stringify(payload));
        console.log('[SYNC][SEND][OK]', payload);
      } catch (e) {
        console.error('[SYNC][SEND][ERROR]', e);
      }
    } else {
      console.warn(
        '[SYNC][SEND][SKIP] WebSocket not open, cannot send command'
      );
    }
  };

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      if (!hasCamPerm) {
        const camResult = await requestCamPerm();
        if (!camResult) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access to record videos.'
          );
          return false;
        }
      }

      if (!hasMicPerm) {
        const micResult = await requestMicPerm();
        if (!micResult) {
          Alert.alert(
            'Microphone Permission Required',
            'Please enable microphone access to record audio.'
          );
          return false;
        }
      }

      if (!mediaLibraryPerm?.granted) {
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          Alert.alert(
            'Storage Permission Required',
            'Please enable storage access to save videos.'
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Permission Error', 'Failed to request permissions.');
      return false;
    }
  };

  const handleStartRecording = async () => {
    console.log('🎬 User clicked Start Recording');
    console.log('📊 Sync stats:', {
      timeOffset: `${timeOffset.toFixed(2)}ms`,
      networkLatency: `${networkLatency.toFixed(2)}ms`,
      samples: timeSyncSamples.current.length
    });

    if (connectionStatus !== 'connected') {
      Alert.alert(
        'Not Connected',
        'Please wait for both devices to be connected.'
      );
      return;
    }

    if (isRecording || recordingScheduled.current) {
      console.log('Already recording or scheduled, ignoring');
      return;
    }

    const hasPermissions = await ensurePermissions();
    if (!hasPermissions) return;

    if (!cameraRef.current) {
      Alert.alert(
        'Camera Not Ready',
        'Please wait for the camera to initialize.'
      );
      return;
    }

    // Send sync command to start both devices
    console.log('[SYNC][START] Sending start_recording command to server');
    console.log('[SYNC][START] Expected network round-trip:', `${(networkLatency * 2).toFixed(2)}ms`);
    sendSyncCommand('start_recording');

    // Fallback: If server broadcast is delayed/missed, start locally after a short timeout
    if (serverStartTimeoutRef.current) {
      clearTimeout(serverStartTimeoutRef.current);
    }
    serverStartTimeoutRef.current = setTimeout(() => {
      if (!isRecording && !recordingScheduled.current) {
        const currentCameraRef = cameraRef.current;
        const currentConnectionStatus = connectionStatusRef.current;
        if (currentCameraRef && currentConnectionStatus === 'connected' && isCameraReady) {
          console.log('⏱️ Fallback start: server did not broadcast in time');
          setIsRecording(true);
          setSession((prev) => (prev ? { ...prev, status: 'recording' } : null));
          startActualRecording();
        } else {
          console.warn('⏱️ Fallback start skipped: not ready', {
            hasCameraRef: !!currentCameraRef,
            status: currentConnectionStatus,
            isCameraReady,
          });
        }
      }
    }, 1500);
  };

  const preWarmCamera = async () => {
    console.log('🔥 Pre-warming camera for instant recording...');
    setIsPreWarming(true);
    
    // Switch to video mode early
    setCameraMode('video');
    
    // Allow camera to stabilize
    setTimeout(() => {
      setIsCameraReady(true);
      setIsPreWarming(false);
      console.log('📷 Camera pre-warmed and ready for instant recording');
      
      // Notify server that this device is ready
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'device_ready' }));
      }
    }, 1500);
  };

  const getCurrentDeviceId = (): string => {
    // This would be received from server on join, for now generate one
    return Math.random().toString(36).substring(2, 8);
  };

  const startActualRecording = async () => {
    try {
      console.log('[SYNC][RECORD] Starting camera recording with pre-warmed camera...');
      if (!cameraRef.current) return;

      // Camera should already be in video mode from pre-warming
      if (cameraMode !== 'video') {
        console.log('[SYNC][RECORD] Switching to video mode (should have been pre-warmed)');
        setCameraMode('video');
        // Minimal delay since we're in emergency mode
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log('[SYNC][RECORD] Starting recording - camera is pre-warmed');
      const recOptions: any = {
        onRecordingFinished: async (video: any) => {
          console.log('[SYNC][RECORD] Recording finished. Path:', video.path);
          await saveRecording(video.path);
        },
        onRecordingError: (error: any) => {
          console.error('Recording error:', error);
          Alert.alert('Recording Error', 'Failed to record video. Please try again.');
          setIsRecording(false);
          setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
          recordingScheduled.current = false;
          setCameraMode('picture');
        },
      };
      if (Platform.OS === 'ios') {
        // Ensure .mp4 container on iOS; Android defaults to MP4
        recOptions.fileType = 'mp4';
      }
      await cameraRef.current.startRecording(recOptions);
    } catch (error) {
      console.error('❌ Recording error:', error);
      Alert.alert(
        'Recording Error',
        'Camera failed to start recording. Please try again.'
      );
      setIsRecording(false);
      setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
      recordingScheduled.current = false;
      // Reset camera mode on error
      setCameraMode('picture');
    }
  };

  const handleStopRecording = async () => {
    console.log('🛑 User clicked Stop Recording');

    if (!isRecording) return;

    // Stop local camera immediately so file is finalized
    try {
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
    } catch (e) {
      console.warn('stopRecording threw (safe to ignore if already stopped):', e);
    }

    // Send sync command to stop both devices (server will broadcast back to both)
    console.log('[SYNC][STOP] Sending stop_recording command to server');
    sendSyncCommand('stop_recording');

    // Immediately update local UI so button flips back to Start
    setIsRecording(false);
    setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
    setCameraMode('picture');
  };

  const saveRecording = async (videoUri: string) => {
    try {
      console.log('💾 Saving recording (raw path):', videoUri);

      // Normalize to file URI for MediaLibrary
      const uri = videoUri.startsWith('file://') ? videoUri : `file://${videoUri}`;
      console.log('💾 Saving recording (file uri):', uri);

      // Ensure permission at save time (Android may revoke at runtime)
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Storage Permission Required', 'Please enable storage access to save videos.');
        return;
      }

      let asset: MediaLibrary.Asset | null = null;
      try {
        asset = await MediaLibrary.createAssetAsync(uri);
      } catch (e) {
        console.warn('createAssetAsync failed, trying saveToLibraryAsync. Error:', e);
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
        } catch (e2) {
          console.error('saveToLibraryAsync also failed:', e2);
          throw e2;
        }
      }

      if (asset) {
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
      }

      Alert.alert(
        'Recording Saved',
        `Synchronized recording saved to ${
          Platform.OS === 'ios' ? 'Photos' : 'Gallery'
        }!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset UI state and camera mode
              setIsRecording(false);
              setCameraMode('picture');
              setSession((prev) =>
                prev ? { ...prev, status: 'connected' } : null
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('💾 Save error:', error);
      Alert.alert('Save Error', 'Failed to save recording to gallery.');
      setIsRecording(false);
      setCameraMode('picture');
      setSession((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }
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
    setShouldShowCamera(false);
    setIsCameraReady(false);
    setCameraMode('picture');
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
    setShouldShowCamera(false);
    setIsCameraReady(false);
    setCameraMode('picture');
    connectToSyncServer(inputSessionId.toUpperCase(), false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // [Rest of the render functions remain the same as the original file...]
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
                  setCameraMode('picture');
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
            {device ? (
              <Camera
                ref={cameraRef}
                style={styles.camera}
                device={device}
                isActive={true}
                video={true}
                audio={true}
                onInitialized={() => {
                  console.log('📷 Camera ready callback');
                  setIsCameraReady(true);
                }}
              />
            ) : (
              <View style={styles.camera}>
                <Text style={{ color: 'white' }}>Camera not available</Text>
              </View>
            )}

            <View style={styles.cameraOverlay}>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>
                    REC {formatTime(recordingTime)}
                  </Text>
                </View>
              )}

              {isPreWarming && (
                <View style={styles.preWarmingIndicator}>
                  <Text style={styles.preWarmingText}>Preparing camera...</Text>
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
                  {networkLatency > 0 && (
                    <Text style={styles.syncInfoText}>
                      Sync: ±{networkLatency.toFixed(0)}ms
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
                      onPress={handleStartRecording}
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
                            ? 'Preparing Camera...'
                            : 'Start Sync Recording'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={handleStopRecording}
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
                setCameraMode('picture');
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
                <TouchableOpacity style={styles.copyButton}>
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
      if (!session) return renderJoinMode();
      return renderSessionInterface();
    case 'host':
      return renderSessionInterface();
    default:
      return renderModeSelection();
  }
}

// [All the styles remain the same as the original file...]
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
  preWarmingIndicator: {
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
  },
  preWarmingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncInfoText: {
    color: '#00FF88',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
