# Raydel Sync Server

Real-time synchronization server for dual-camera recording in the Raydel Padel Analytics app.

## Features

- **Real-time WebSocket communication** between devices
- **Session management** with unique session IDs
- **Synchronized recording** commands (start/stop)
- **Device pairing** and connection status
- **Automatic cleanup** of old sessions
- **Health monitoring** with ping/pong
- **RESTful API** for session management

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## API Endpoints

### WebSocket
- **Endpoint**: `ws://localhost:3001/sync`
- **Purpose**: Real-time communication between devices

### REST API
- **GET /health** - Server health check
- **GET /api/sessions** - List all active sessions
- **GET /api/sessions/:sessionId** - Get specific session details
- **DELETE /api/sessions/:sessionId** - End a session

## WebSocket Messages

### Client to Server

#### Join Session
```json
{
  "type": "join",
  "sessionId": "ABC123",
  "isHost": true,
  "deviceName": "iPhone 15"
}
```

#### Start Recording
```json
{
  "type": "start_recording",
  "timestamp": 1640995200000
}
```

#### Stop Recording
```json
{
  "type": "stop_recording",
  "timestamp": 1640995260000
}
```

### Server to Client

#### Device Connected
```json
{
  "type": "device_connected",
  "deviceId": "dev123",
  "deviceName": "iPhone 15",
  "sessionId": "ABC123"
}
```

#### Start Recording Command
```json
{
  "type": "start_recording",
  "sessionId": "ABC123",
  "timestamp": 1640995200000,
  "initiator": "dev123"
}
```

#### Stop Recording Command
```json
{
  "type": "stop_recording",
  "sessionId": "ABC123",
  "timestamp": 1640995260000,
  "initiator": "dev123"
}
```

## Session Management

- **Maximum 2 devices** per session
- **Host device** creates the session
- **Joining device** connects using session ID
- **Automatic cleanup** after 30 minutes of inactivity
- **Graceful handling** of device disconnections

## Error Handling

The server handles various error scenarios:
- Invalid session IDs
- Full sessions (>2 devices)
- Network disconnections
- Invalid message formats
- Recording state conflicts

## Security Considerations

For production deployment:
- Add authentication/authorization
- Implement rate limiting
- Use HTTPS/WSS
- Add input validation
- Configure CORS properly
- Add logging and monitoring

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Monitoring

The server provides health check endpoint at `/health` which returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "activeSessions": 2,
  "totalConnections": 4
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running on correct port
   - Check firewall settings
   - Verify WebSocket URL in client

2. **Session Not Found**
   - Session may have expired (30 min timeout)
   - Check session ID format (6 characters, alphanumeric)

3. **Recording Sync Issues**
   - Ensure both devices are connected
   - Check network stability
   - Verify WebSocket connection status

### Logs

The server logs important events:
- Session creation/deletion
- Device connections/disconnections
- Recording start/stop commands
- Error conditions

## License

MIT License - see LICENSE file for details.