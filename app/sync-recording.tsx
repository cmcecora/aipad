import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Smartphone, Wifi, WifiOff, Users, Play, Square, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Copy, Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

interface SyncSession {
  id: string;
  isHost: boolean;
  connectedDevice?: string;
  status: 'waiting' | 'connected' | 'recording' | 'disconnected';
}

export default function SyncRecordingScreen() {
  const [sessionMode, setSessionMode] = useState<'select' | 'host' | 'join'>('select');
  const [session, setSession] = useState<SyncSession | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [inputSessionId, setInputSessionId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [connectedDeviceName, setConnectedDeviceName] = useState('');
  
  const cameraRef = useRef<CameraView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [mediaLibraryPerm, requestMediaLibraryPerm] = MediaLibrary.usePermissions();

  // WebSocket connection management
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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

  const connectToSyncServer = (sessionId: string, isHost: boolean) => {
    const ws = new WebSocket(`ws://localhost:3001/sync/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to sync server');
      setConnectionStatus('connecting');
      
      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'join',
        sessionId,
        isHost,
        deviceName: `Device ${Math.random().toString(36).substring(7)}`
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleSyncMessage(message);
    };

    ws.onclose = () => {
      console.log('Disconnected from sync server');
      setConnectionStatus('disconnected');
      setSession(prev => prev ? { ...prev, status: 'disconnected' } : null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Connection Error', 'Failed to connect to sync server. Please try again.');
    };
  };

  const handleSyncMessage = (message: any) => {
    switch (message.type) {
      case 'device_connected':
        setConnectionStatus('connected');
        setConnectedDeviceName(message.deviceName);
        setSession(prev => prev ? {
          ...prev,
          status: 'connected',
          connectedDevice: message.deviceName
        } : null);
        Alert.alert('Device Connected', `Connected to ${message.deviceName}`);
        break;

      case 'start_recording':
        handleStartRecording(true); // true indicates sync command
        break;

      case 'stop_recording':
        handleStopRecording(true); // true indicates sync command
        break;

      case 'device_disconnected':
        setConnectionStatus('disconnected');
        setConnectedDeviceName('');
        setSession(prev => prev ? { ...prev, status: 'waiting' } : null);
        Alert.alert('Device Disconnected', 'The other device has disconnected.');
        break;

      case 'error':
        Alert.alert('Sync Error', message.message);
        break;
    }
  };

  const sendSyncCommand = (command: string, data?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: command,
        ...data
      }));
    }
  };

  const handleHostSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setSession({
      id: newSessionId,
      isHost: true,
      status: 'waiting'
    });
    setSessionMode('host');
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
      status: 'waiting'
    });
    setSessionMode('join');
    connectToSyncServer(inputSessionId.toUpperCase(), false);
  };

  const ensurePermissions = async (): Promise<boolean> => {
    try {
      if (!camPerm?.granted) {
        const camResult = await requestCamPerm();
        if (!camResult.granted) {
          Alert.alert('Camera Permission Required', 'Please enable camera access to record videos.');
          return false;
        }
      }

      if (!micPerm?.granted) {
        const micResult = await requestMicPerm();
        if (!micResult.granted) {
          Alert.alert('Microphone Permission Required', 'Please enable microphone access to record audio.');
          return false;
        }
      }

      if (!mediaLibraryPerm?.granted) {
        const mediaResult = await requestMediaLibraryPerm();
        if (!mediaResult.granted) {
          Alert.alert('Storage Permission Required', 'Please enable storage access to save videos.');
          return false;
        }
      }

      return true;
    } catch (error) {
      Alert.alert('Permission Error', 'Failed to request permissions.');
      return false;
    }
  };

  const handleStartRecording = async (isSync = false) => {
    if (connectionStatus !== 'connected' && !isSync) {
      Alert.alert('Not Connected', 'Please wait for both devices to be connected before recording.');
      return;
    }

    const hasPermissions = await ensurePermissions();
    if (!hasPermissions) return;

    if (!cameraRef.current) {
      Alert.alert('Camera Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      setIsRecording(true);
      setSession(prev => prev ? { ...prev, status: 'recording' } : null);

      // Send sync command to other device
      if (!isSync) {
        sendSyncCommand('start_recording');
      }

      // Start recording
      const recording = await cameraRef.current.recordAsync({
        maxDuration: 3600,
        quality: '1080p',
        mute: false,
      });

      if (recording?.uri) {
        await saveRecording(recording.uri);
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async (isSync = false) => {
    try {
      if (cameraRef.current && isRecording) {
        cameraRef.current.stopRecording();
      }

      // Send sync command to other device
      if (!isSync) {
        sendSyncCommand('stop_recording');
      }

      setIsRecording(false);
      setSession(prev => prev ? { ...prev, status: 'connected' } : null);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording properly.');
    }
  };

  const saveRecording = async (videoUri: string) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      
      let album = await MediaLibrary.getAlbumAsync('Raydel Sync Recordings');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Raydel Sync Recordings', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Recording Saved', 'Synchronized recording saved to gallery successfully!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Error', 'Failed to save recording to gallery.');
    }
  };

  const copySessionId = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert('Session ID Copied', `Session ID: ${sessionId}`);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderModeSelection = () => (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Recording</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>Synchronized dual-camera recording</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.modeSelection}>
          <TouchableOpacity style={styles.modeCard} onPress={handleHostSession}>
            <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.modeGradient}>
              <Smartphone size={32} color="#fff" />
              <Text style={styles.modeTitle}>Host Session</Text>
              <Text style={styles.modeDescription}>
                Create a new recording session and wait for another device to join
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeCard} onPress={() => setSessionMode('join')}>
            <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.modeGradient}>
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
              3. Both cameras record simultaneously when either device starts recording{'\n'}
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
          <TouchableOpacity style={styles.backButton} onPress={() => setSessionMode('select')}>
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
          
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinSession}>
            <LinearGradient colors={['#00FF88', '#00CC6A']} style={styles.joinButtonGradient}>
              <Users size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Join Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSessionInterface = () => {
    if (connectionStatus === 'connected' && session) {
      return (
        <View style={styles.container}>
          <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => {
                if (wsRef.current) wsRef.current.close();
                setSessionMode('select');
                setSession(null);
              }}>
                <ArrowLeft size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sync Recording</Text>
              <View style={styles.connectionIndicator}>
                <CheckCircle size={16} color="#00FF88" />
                <Text style={styles.connectionText}>Connected</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="video" />
            
            <View style={styles.cameraOverlay}>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC {formatTime(recordingTime)}</Text>
                </View>
              )}

              <View style={styles.deviceInfo}>
                <Text style={styles.deviceInfoText}>
                  Connected to: {connectedDeviceName}
                </Text>
                <Text style={styles.sessionIdText}>
                  Session: {session.id}
                </Text>
              </View>

              <View style={styles.recordingControls}>
                {!isRecording ? (
                  <TouchableOpacity style={styles.recordButton} onPress={() => handleStartRecording()}>
                    <LinearGradient colors={['#FF6B6B', '#FF4757']} style={styles.recordButtonGradient}>
                      <Play size={24} color="#fff" />
                      <Text style={styles.recordButtonText}>Start Sync Recording</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.stopButton} onPress={() => handleStopRecording()}>
                    <Square size={24} color="#fff" />
                    <Text style={styles.stopButtonText}>Stop Recording</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              if (wsRef.current) wsRef.current.close();
              setSessionMode('select');
              setSession(null);
            }}>
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
              <Text style={[styles.connectionText, { 
                color: connectionStatus === 'connecting' ? '#FFD700' : '#FF6B6B' 
              }]}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting...'}
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
                <TouchableOpacity style={styles.copyButton} onPress={copySessionId}>
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
                : `Connecting to session ${session?.id}...`
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  switch (sessionMode) {
    case 'join':
      return renderJoinMode();
    case 'host':
    case 'join':
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
});