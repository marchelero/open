---
name: realtime-patterns
description: Use this skill when implementing real-time features. Covers WebSockets, Server-Sent Events, Socket.io, Pusher, Ably, and real-time state synchronization patterns for collaborative and live applications.
triggers: [real-time, WebSocket, SSE, Socket.io, Pusher, live updates, collaborative editing, live chat, real-time sync]
origin: starter-pack
---

# Real-Time Patterns

Patterns for building real-time, collaborative, and live applications.

## When to Activate

- Building chat or messaging features
- Implementing live collaboration (Google Docs-like)
- Creating live dashboards or notifications
- Adding real-time notifications
- Building multiplayer games
- Implementing live feeds or streams

## WebSocket Patterns

### Basic WebSocket Server (Node.js)

```typescript
import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  
  ws.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

### WebSocket Client

```typescript
class RealtimeClient {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.setupListeners();
  }
  
  private setupListeners() {
    this.ws.onopen = () => {
      console.log('Connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.ws = new WebSocket(this.ws.url);
        this.setupListeners();
      }, delay);
    }
  }
  
  send(type: string, payload: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
  
  private handleMessage(data: { type: string; payload: any }) {
    switch (data.type) {
      case 'message':
        this.onMessage(data.payload);
        break;
      case 'user_joined':
        this.onUserJoined(data.payload);
        break;
    }
  }
  
  onMessage: (payload: any) => void = () => {};
  onUserJoined: (payload: any) => void = () => {};
}
```

### WebSocket with Redis Pub/Sub (Scalable)

```typescript
import Redis from 'ioredis';

const pub = new Redis();
const sub = new Redis();

// Subscribe to channel
sub.subscribe('chat');

sub.on('message', (channel, message) => {
  const data = JSON.parse(message);
  // Broadcast to local WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Publish messages
function broadcast(message: any) {
  pub.publish('chat', JSON.stringify(message));
}
```

## Server-Sent Events (SSE)

### SSE Server

```typescript
import express from 'express';

const app = express();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  const clientId = Date.now();
  clients.set(clientId, res);
  
  req.on('close', () => {
    clients.delete(clientId);
  });
});

function sendEvent(event: string, data: any) {
  clients.forEach((client) => {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}
```

### SSE Client

```typescript
class SSEClient {
  private eventSource: EventSource;
  
  constructor(url: string) {
    this.eventSource = new EventSource(url);
    
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };
    
    this.eventSource.addEventListener('user_joined', (event) => {
      const data = JSON.parse(event.data);
      this.onUserJoined(data);
    });
    
    this.eventSource.onerror = () => {
      console.log('SSE connection error, retrying...');
    };
  }
  
  onMessage: (data: any) => void = () => {};
  onUserJoined: (data: any) => void = () => {};
  
  close() {
    this.eventSource.close();
  }
}
```

## Socket.io Patterns

### Server

```typescript
import { Server } from 'socket.io';

const io = new Server(3000, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('join_room', (room) => {
    socket.join(room);
    socket.to(room).emit('user_joined', { userId: socket.id });
  });
  
  // Send message
  socket.on('send_message', (data) => {
    io.to(data.room).emit('new_message', {
      user: socket.id,
      message: data.message,
      timestamp: Date.now()
    });
  });
  
  // Typing indicator
  socket.on('typing', (room) => {
    socket.to(room).emit('user_typing', { userId: socket.id });
  });
  
  socket.on('stop_typing', (room) => {
    socket.to(room).emit('user_stop_typing', { userId: socket.id });
  });
});
```

### Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.emit('join_room', 'general');

socket.on('new_message', (data) => {
  console.log(`${data.user}: ${data.message}`);
});

socket.on('user_typing', (data) => {
  showTypingIndicator(data.userId);
});
```

## Real-Time State Synchronization

### Operational Transforms (OT)

```typescript
interface Operation {
  type: 'insert' | 'delete';
  position: number;
  content?: string;
}

function transform(op1: Operation, op2: Operation): [Operation, Operation] {
  // Transform operations for concurrent editing
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.position < op2.position) {
      return [op1, { ...op2, position: op2.position + 1 }];
    } else if (op1.position > op2.position) {
      return [{ ...op1, position: op1.position + 1 }, op2];
    }
  }
  // ... more cases
  return [op1, op2];
}
```

### CRDT (Conflict-free Replicated Data Types)

```typescript
// Simple CRDT counter
class GCounter {
  private counts: Map<string, number> = new Map();
  
  increment(nodeId: string) {
    const current = this.counts.get(nodeId) || 0;
    this.counts.set(nodeId, current + 1);
  }
  
  merge(other: GCounter) {
    for (const [nodeId, count] of other.counts) {
      const current = this.counts.get(nodeId) || 0;
      this.counts.set(nodeId, Math.max(current, count));
    }
  }
  
  value(): number {
    return Array.from(this.counts.values()).reduce((sum, c) => sum + c, 0);
  }
}
```

## Anti-Patterns

1. **No heartbeat** → Zombie connections
2. **Missing reconnection** → Users lose connection permanently
3. **No message ordering** → Out-of-sync state
4. **Broadcasting to all** → Performance issues
5. **No message persistence** → Lost messages
6. **Ignoring backpressure** → Memory exhaustion

## Related Skills

- `caching-patterns` — for real-time caching
- `message-queue-patterns` — for scalable pub/sub
- `typescript-advanced-patterns` — for type-safe real-time

## Related Agents

- `performance-optimizer` — for real-time performance
- `typescript-reviewer` — for real-time code review
