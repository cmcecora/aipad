const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Store active sessions
const sessions = new Map();

// WebSocket server for real-time sync
const wss = new WebSocket.Server({ 
  server,
  path: '/sync'
});

class SyncSession {
  constructor(id) {
    this.id = id;
    this.devices = new Map();
    this.host = null;
    this.isRecording = false;
    this.createdAt = new Date();
  }

  addDevice(ws, deviceInfo) {
    const deviceId = this.generateDeviceId();
    
    const device = {
      id: deviceId,
      ws: ws,
      name: deviceInfo.deviceName || `Device ${deviceId}`,
      isHost: deviceInfo.isHost || false,
      connectedAt: new Date()
    };

    this.devices.set(deviceId, device);
    
    if (device.isHost) {
      this.host = deviceId;
    }

    // Notify other devices about new connection
    this.broadcastToOthers(deviceId, {
      type: 'device_connected',
      deviceId: deviceId,
      deviceName: device.name,
      sessionId: this.id
    });

    console.log(`Device ${device.name} joined session ${this.id}`);
    return device;
  }

  removeDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    this.devices.delete(deviceId);
    
    // If host disconnects, end session
    if (this.host === deviceId) {
      this.endSession();
      return;
    }

    // Notify remaining devices
    this.broadcastToOthers(deviceId, {
      type: 'device_disconnected',
      deviceId: deviceId,
      sessionId: this.id
    });

    console.log(`Device ${device.name} left session ${this.id}`);
  }

  broadcastToAll(message) {
    this.devices.forEach(device => {
      if (device.ws.readyState === WebSocket.OPEN) {
        device.ws.send(JSON.stringify(message));
      }
    });
  }

  broadcastToOthers(excludeDeviceId, message) {
    this.devices.forEach((device, deviceId) => {
      if (deviceId !== excludeDeviceId && device.ws.readyState === WebSocket.OPEN) {
        device.ws.send(JSON.stringify(message));
      }
    });
  }

  startRecording(initiatorDeviceId) {
    if (this.isRecording) {
      return { success: false, message: 'Recording already in progress' };
    }

    this.isRecording = true;
    
    // Send start command to all devices
    this.broadcastToAll({
      type: 'start_recording',
      sessionId: this.id,
      timestamp: Date.now(),
      initiator: initiatorDeviceId
    });

    console.log(`Recording started in session ${this.id} by device ${initiatorDeviceId}`);
    return { success: true };
  }

  stopRecording(initiatorDeviceId) {
    if (!this.isRecording) {
      return { success: false, message: 'No recording in progress' };
    }

    this.isRecording = false;
    
    // Send stop command to all devices
    this.broadcastToAll({
      type: 'stop_recording',
      sessionId: this.id,
      timestamp: Date.now(),
      initiator: initiatorDeviceId
    });

    console.log(`Recording stopped in session ${this.id} by device ${initiatorDeviceId}`);
    return { success: true };
  }

  endSession() {
    // Notify all devices that session is ending
    this.broadcastToAll({
      type: 'session_ended',
      sessionId: this.id
    });

    // Close all connections
    this.devices.forEach(device => {
      if (device.ws.readyState === WebSocket.OPEN) {
        device.ws.close();
      }
    });

    console.log(`Session ${this.id} ended`);
  }

  generateDeviceId() {
    return Math.random().toString(36).substring(2, 8);
  }

  getStatus() {
    return {
      id: this.id,
      deviceCount: this.devices.size,
      isRecording: this.isRecording,
      createdAt: this.createdAt,
      devices: Array.from(this.devices.values()).map(device => ({
        id: device.id,
        name: device.name,
        isHost: device.isHost,
        connectedAt: device.connectedAt
      }))
    };
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  let currentSession = null;
  let currentDeviceId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      switch (message.type) {
        case 'join':
          handleJoinSession(message);
          break;
        
        case 'start_recording':
          handleStartRecording(message);
          break;
        
        case 'stop_recording':
          handleStopRecording(message);
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (currentSession && currentDeviceId) {
      currentSession.removeDevice(currentDeviceId);
      
      // Clean up empty sessions
      if (currentSession.devices.size === 0) {
        sessions.delete(currentSession.id);
        console.log(`Session ${currentSession.id} deleted (no devices)`);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  function handleJoinSession(message) {
    const { sessionId, isHost, deviceName } = message;
    
    if (!sessionId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Session ID is required' 
      }));
      return;
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      if (!isHost) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Session not found' 
        }));
        return;
      }
      session = new SyncSession(sessionId);
      sessions.set(sessionId, session);
      console.log(`Created new session: ${sessionId}`);
    }

    // Check if session is full (max 2 devices)
    if (session.devices.size >= 2) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Session is full' 
      }));
      return;
    }

    // Add device to session
    const device = session.addDevice(ws, { isHost, deviceName });
    currentSession = session;
    currentDeviceId = device.id;

    // Send confirmation to joining device
    ws.send(JSON.stringify({
      type: 'joined',
      sessionId: sessionId,
      deviceId: device.id,
      deviceName: device.name,
      isHost: device.isHost,
      sessionStatus: session.getStatus()
    }));
  }

  function handleStartRecording(message) {
    if (!currentSession || !currentDeviceId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not connected to a session' 
      }));
      return;
    }

    const result = currentSession.startRecording(currentDeviceId);
    if (!result.success) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: result.message 
      }));
    }
  }

  function handleStopRecording(message) {
    if (!currentSession || !currentDeviceId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not connected to a session' 
      }));
      return;
    }

    const result = currentSession.stopRecording(currentDeviceId);
    if (!result.success) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: result.message 
      }));
    }
  }
});

// REST API endpoints for session management
app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => session.getStatus());
  res.json({ sessions: sessionList });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session.getStatus());
});

app.delete('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.endSession();
  sessions.delete(req.params.sessionId);
  res.json({ message: 'Session ended' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    totalConnections: wss.clients.size
  });
});

// Cleanup old sessions (run every 5 minutes)
setInterval(() => {
  const now = new Date();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  sessions.forEach((session, sessionId) => {
    if (now - session.createdAt > maxAge && session.devices.size === 0) {
      sessions.delete(sessionId);
      console.log(`Cleaned up old session: ${sessionId}`);
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`Sync server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/sync`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down sync server...');
  
  // End all sessions
  sessions.forEach(session => {
    session.endSession();
  });
  
  server.close(() => {
    console.log('Sync server shut down');
    process.exit(0);
  });
});