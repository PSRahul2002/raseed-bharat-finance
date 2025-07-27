# WebSocket Integration for Receipt Assistant

This document outlines the WebSocket integration implemented in the Receipt Assistant component.

## Features Implemented

### 1. ✅ WebSocket Connection Management
- **Real-time connection** to `ws://localhost:8000/ws/{user_id}`
- **Automatic reconnection** with exponential backoff (max 5 attempts)
- **Connection status tracking** (connecting, connected, disconnected, error)
- **Visual status indicators** in the UI header

### 2. ✅ Message Handling
- **Real-time message exchange** via WebSocket
- **Multi-type message support**:
  - `status`: Processing updates (e.g., "Processing your query...")
  - `intermediate`: Progress updates (e.g., "Found 5 matching receipts...")
  - `result`: Final AI response
  - `error`: Error handling with user-friendly messages

### 3. ✅ Enhanced User Interface
- **Connection status badge** showing current WebSocket state
- **Real-time message updates** with different styling for each message type
- **Loading indicators** with spinning animations for processing messages
- **Improved suggested queries** relevant to MongoDB data
- **Clear chat functionality**
- **Manual reconnection button** when disconnected

### 4. ✅ Error Handling & Resilience
- **Automatic reconnection** with exponential backoff
- **Comprehensive error handling** for connection failures
- **User notifications** via toast messages
- **Graceful degradation** when WebSocket is disconnected
- **Input field disabled** when not connected

### 5. ✅ Configuration Management
- **Environment variables** for easy configuration:
  - `VITE_WEBSOCKET_URL`: WebSocket server URL
  - `VITE_USER_ID`: User identifier for WebSocket connection
- **Development vs Production** URL handling

## Environment Variables

Add these to your `.env.local` file:

```bash
# WebSocket Configuration
VITE_WEBSOCKET_URL=ws://localhost:8000/ws
VITE_USER_ID=user123
```

For production, update to your production WebSocket URL:
```bash
VITE_WEBSOCKET_URL=wss://your-production-websocket-server.com/ws
```

## WebSocket Message Protocol

### Outgoing Messages (Frontend → Backend)
```json
{
  "type": "query",
  "query": "Show me all my grocery expenses"
}
```

### Incoming Messages (Backend → Frontend)

#### Status Message
```json
{
  "type": "status",
  "message": "Processing your query..."
}
```

#### Intermediate Message
```json
{
  "type": "intermediate", 
  "message": "Found 15 matching receipts in your database..."
}
```

#### Result Message
```json
{
  "type": "result",
  "message": "Based on your receipts, you spent ₹12,450 on groceries this month. Here's the breakdown: ..."
}
```

#### Error Message
```json
{
  "type": "error",
  "message": "Database connection failed. Please try again."
}
```

## Backend Requirements

Your WebSocket server should:

1. **Accept connections** at `/ws/{user_id}`
2. **Handle query messages** and process them against your MongoDB database
3. **Send status updates** during processing
4. **Return final results** or error messages
5. **Support reconnection** gracefully

## Usage Instructions

### 1. Start Your WebSocket Server
Make sure your WebSocket server is running on `localhost:8000` (or update the environment variable).

### 2. Launch the Frontend
```bash
npm run dev
```

### 3. Navigate to Assistant Page
The Assistant component will automatically:
- Connect to the WebSocket server
- Show connection status in the header
- Enable real-time chat when connected

### 4. Try Sample Queries
Use the suggested queries or ask:
- "Show me all my grocery expenses"
- "What did I spend on food last month?"
- "How much did I spend at Amazon?"
- "Find all receipts over ₹1000"

## Connection Status Indicators

| Status | Badge Color | Description |
|--------|-------------|-------------|
| 🟢 Connected | Green | WebSocket connected and ready |
| 🟡 Connecting | Yellow | Attempting to connect |
| 🔴 Disconnected | Red | Connection lost, manual reconnect available |
| 🔴 Error | Red | Connection error occurred |

## Message Types in UI

| Type | Styling | Purpose |
|------|---------|---------|
| `user` | Blue background | User's questions |
| `assistant` | Gray background | Final AI responses |
| `status` | Blue border, processing icon | Processing updates |
| `intermediate` | Blue border, processing icon | Progress updates |

## Troubleshooting

### WebSocket Connection Issues
1. **Check server status**: Ensure your WebSocket server is running
2. **Verify URL**: Check `VITE_WEBSOCKET_URL` in `.env.local`
3. **Check console**: Look for WebSocket errors in browser console
4. **Manual reconnect**: Use the "Reconnect" button when disconnected

### Message Flow Issues
1. **Check message format**: Ensure your backend sends properly formatted JSON
2. **Verify message types**: Backend should use `status`, `intermediate`, `result`, or `error`
3. **Monitor network**: Use browser DevTools to inspect WebSocket messages

### Performance Considerations
- **Message cleanup**: Processing messages are automatically removed when final result arrives
- **Connection pooling**: Automatic reconnection prevents connection buildup
- **Memory management**: Component cleanup closes WebSocket connections

## Next Steps

### Optional Enhancements
1. **User Authentication**: Replace hardcoded `USER_ID` with actual user authentication
2. **Message History**: Persist chat history in localStorage
3. **File Upload**: Allow receipt uploads through WebSocket
4. **Voice Input**: Add speech-to-text for voice queries
5. **Export Chat**: Allow users to export conversation history

### Production Deployment
1. **Update WebSocket URL** to production server
2. **Configure SSL/TLS** for secure WebSocket connections (wss://)
3. **Add monitoring** for connection health
4. **Implement rate limiting** for query requests
