/**
 * Sync Manager - Handles real-time synchronization between devices
 * Provides WebSocket communication and state management for dual-camera recording
 */

export interface SyncDevice {
  id: string;
  name: string;
  isHost: boolean;
  connectedAt: Date;
}

export interface SyncSession {
  id: string;
  isHost: boolean;
  devices: SyncDevice[];
  isRecording: boolean;
  status: 'waiting' | 'connected' | 'recording' | 'disconnected';
}

export interface SyncMessage {
  type:
    | 'join'
    | 'joined'
    | 'start_recording'
    | 'stop_recording'
    | 'device_connected'
    | 'device_disconnected'
    | 'error'
    | 'ping'
    | 'pong'
    | 'time_sync_request'
    | 'time_sync_response'
    | 'time_sync_update';
  sessionId?: string;
  deviceId?: string;
  deviceName?: string;
  isHost?: boolean;
  timestamp?: number;
  message?: string;
  data?: any;
  // time sync fields
  request_id?: string;
  server_timestamp?: number;
  server_receive_timestamp?: number;
  offset_ms?: number;
  latency_ms?: number;
  atomic_start_time?: number;
  client_timestamp?: number;
}

export class SyncManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private serverUrl: string;
  private clockOffsetMs = 0; // server_time ≈ local_time - offset
  private latencyMs = 0;
  private lastSyncAt: number | null = null;

  // Event callbacks
  private onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
  private onDeviceConnected?: (device: SyncDevice) => void;
  private onDeviceDisconnected?: (deviceId: string) => void;
  private onRecordingStart?: () => void;
  private onRecordingStop?: () => void;
  private onError?: (error: string) => void;
  private onSessionUpdate?: (session: Partial<SyncSession>) => void;

  constructor(serverUrl: string = 'ws://localhost:3001/sync') {
    this.serverUrl = serverUrl;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onConnectionChange?: (status: 'connecting' | 'connected' | 'disconnected') => void;
    onDeviceConnected?: (device: SyncDevice) => void;
    onDeviceDisconnected?: (deviceId: string) => void;
    onRecordingStart?: () => void;
    onRecordingStop?: () => void;
    onError?: (error: string) => void;
    onSessionUpdate?: (session: Partial<SyncSession>) => void;
  }) {
    this.onConnectionChange = callbacks.onConnectionChange;
    this.onDeviceConnected = callbacks.onDeviceConnected;
    this.onDeviceDisconnected = callbacks.onDeviceDisconnected;
    this.onRecordingStart = callbacks.onRecordingStart;
    this.onRecordingStop = callbacks.onRecordingStop;
    this.onError = callbacks.onError;
    this.onSessionUpdate = callbacks.onSessionUpdate;
  }

  /**
   * Connect to sync server and join/create session
   */
  async connect(sessionId: string, isHost: boolean, deviceName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.onConnectionChange?.('connecting');
        
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to sync server');
          this.reconnectAttempts = 0;
          
          // Send join message
          this.sendMessage({
            type: 'join',
            sessionId,
            isHost,
            deviceName
          });

          // Start ping/pong for connection health
          this.startPingPong();
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SyncMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing sync message:', error);
            this.onError?.('Invalid message received from server');
          }
        };

        this.ws.onclose = (event) => {
          console.log('Disconnected from sync server:', event.code, event.reason);
          this.onConnectionChange?.('disconnected');
          this.stopPingPong();
          
          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(sessionId, isHost, deviceName);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onError?.('Connection error occurred');
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('Failed to connect to sync server:', error);
        this.onError?.('Failed to connect to sync server');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from sync server
   */
  disconnect() {
    this.stopPingPong();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.onConnectionChange?.('disconnected');
  }

  /**
   * Send start recording command to all devices
   */
  startRecording(): boolean {
    if (!this.isConnected()) {
      this.onError?.('Not connected to sync server');
      return false;
    }

    this.sendMessage({
      type: 'start_recording',
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Send stop recording command to all devices
   */
  stopRecording(): boolean {
    if (!this.isConnected()) {
      this.onError?.('Not connected to sync server');
      return false;
    }

    this.sendMessage({
      type: 'stop_recording',
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Check if connected to sync server
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }

  /**
   * Send message to sync server
   */
  private sendMessage(message: SyncMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
      this.onError?.('Cannot send command: Not connected to server');
    }
  }

  /**
   * Handle incoming messages from sync server
   */
  private handleMessage(message: SyncMessage) {
    console.log('Received sync message:', message);

    switch (message.type) {
      case 'joined':
        this.onConnectionChange?.('connected');
        this.onSessionUpdate?.({
          id: message.sessionId,
          status: 'connected'
        });
        break;

      case 'device_connected':
        this.onConnectionChange?.('connected');
        if (message.deviceId && message.deviceName) {
          this.onDeviceConnected?.({
            id: message.deviceId,
            name: message.deviceName,
            isHost: message.isHost || false,
            connectedAt: new Date()
          });
        }
        break;

      case 'device_disconnected':
        if (message.deviceId) {
          this.onDeviceDisconnected?.(message.deviceId);
        }
        break;

      case 'start_recording':
        console.log('Received start recording command');
        // If an atomic start time is provided, delay local callback until that wall-clock time
        if (message.atomic_start_time && typeof message.atomic_start_time === 'number') {
          const localNow = Date.now();
          const serverNowEstimate = localNow - this.clockOffsetMs; // server ≈ local - offset
          const delayMs = message.atomic_start_time - serverNowEstimate;
          const clampedDelay = Math.max(0, Math.min(delayMs, 5000));
          setTimeout(() => {
            this.onRecordingStart?.();
            this.onSessionUpdate?.({ isRecording: true, status: 'recording' });
          }, clampedDelay);
        } else {
          this.onRecordingStart?.();
          this.onSessionUpdate?.({ isRecording: true, status: 'recording' });
        }
        break;

      case 'stop_recording':
        console.log('Received stop recording command');
        this.onRecordingStop?.();
        this.onSessionUpdate?.({ 
          isRecording: false,
          status: 'connected'
        });
        break;

      case 'time_sync_request':
        // Reply immediately with local timestamp
        if (message.request_id && typeof message.server_timestamp === 'number') {
          this.sendMessage({
            type: 'time_sync_response',
            request_id: message.request_id,
            server_timestamp: message.server_timestamp,
            client_timestamp: Date.now()
          });
        }
        break;

      case 'time_sync_update':
        if (typeof message.offset_ms === 'number' && typeof message.latency_ms === 'number') {
          this.clockOffsetMs = message.offset_ms;
          this.latencyMs = message.latency_ms;
          this.lastSyncAt = Date.now();
        }
        break;

      case 'error':
        console.error('Sync server error:', message.message);
        this.onError?.(message.message || 'Unknown server error');
        break;

      case 'pong':
        // Connection is healthy
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Attempt to reconnect to sync server
   */
  private attemptReconnect(sessionId: string, isHost: boolean, deviceName: string) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect(sessionId, isHost, deviceName);
        console.log('Reconnected successfully');
      } catch (error) {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.onError?.('Failed to reconnect to sync server. Please try again manually.');
        }
      }
    }, delay);
  }

  /**
   * Start ping/pong for connection health monitoring
   */
  private startPingPong() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping/pong monitoring
   */
  private stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Generate a random session ID
   */
  static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Validate session ID format
   */
  static isValidSessionId(sessionId: string): boolean {
    return /^[A-Z0-9]{6}$/.test(sessionId);
  }
}

export default SyncManager;