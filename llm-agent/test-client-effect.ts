import { CommandPayloadSchema, WebSocketMessage, createMessage, parseMessage } from '@buddy/protocol';
import * as S from '@effect/schema';
import { Schema } from '@effect/schema';
import { Effect, Option, pipe } from 'effect';
import WebSocket from 'isomorphic-ws';

// Add type for the class instance
type EffectClientType = {
  url: string;
  ws: WebSocket | null;
  isConnected: boolean;
  sequence: number;
  agentRuntimeId: string;
  pendingRequests: Map<string, (response: any) => void>; // Using any for WebSocketMessage type
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  handleMessage: (data: WebSocket.Data) => void;
  handleClose: () => void;
  attemptReconnect: () => void;
  sendMessage: (payload: any) => Promise<void>; // Using any for payload type
};

export class EffectClient {
  private ws: WebSocket | null = null;
  private sequence = 1;
  private agentRuntimeId = `test-client-${Math.random().toString(36).substring(2, 8)}`;
  private pendingRequests = new Map<string, (response: WebSocketMessage) => void>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 1000;

  constructor(private url: string) {}

  // Connect to the WebSocket server with Effect-based error handling
  connect(): Effect.Effect<void, Error, never> {
    const self: EffectClientType = this as any;
    return Effect.gen(function* () {
      console.log(`🔌 Attempting to connect to ${self.url}...`);
      
      // Create a promise-based connection handler
      const connectPromise = new Promise<void>((resolve, reject) => {
        if (!self.url) {
          reject(new Error('WebSocket URL is not defined'));
          return;
        }
        if (!self.url) {
          reject(new Error('WebSocket URL is not defined'));
          return;
        }
        self.ws = new WebSocket(self.url);
        
        const connectTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        self.ws!.on('open', () => {
          clearTimeout(connectTimeout);
          self.isConnected = true;
          self.reconnectAttempts = 0;
          console.log('✅ Connected to WebSocket server');
          resolve();
        });
        
        self.ws.on('error', (error) => {
          clearTimeout(connectTimeout);
          reject(error);
        });
      });
      
      // Convert promise to Effect
      yield* Effect.promise(() => connectPromise);
      
      // Setup message handler
      if (self.ws) {
        self.ws.on('message', (data) => self.handleMessage(data));
        self.ws.on('close', () => self.handleClose());
        self.ws.on('error', (error: any) => {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error('WebSocket error:', err);
        });
      }
      
      return undefined;
    }.bind(this));
  }
  
  // Handle incoming messages with schema validation
  private handleMessage(data: WebSocket.Data): void {
    Effect.runPromise(
      pipe(
        parseMessage(data),
        Effect.tap((message) => 
          Effect.sync(() => {
            console.log('📥 Received validated message:', {
              type: message.type,
              id: message.id,
              correlationId: message.metadata.correlationId,
              payload: message.payload
            });
            
            // Handle pending requests
            if (message.metadata.correlationId) {
              const resolve = this.pendingRequests.get(message.metadata.correlationId);
              if (resolve) {
                resolve(message);
                this.pendingRequests.delete(message.metadata.correlationId);
              }
            }
          })
        ),
        Effect.catchAll((error) => 
          Effect.sync(() => {
            console.error('Error handling message:', error);
            console.log('Raw message data:', data.toString());
          })
        )
      )
    );
  }
  
  private handleClose(): void {
    console.log('👋 Disconnected from WebSocket server');
    this.isConnected = false;
    this.attemptReconnect();
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`♻️ Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        Effect.runPromise(
          this.connect().pipe(
            Effect.catchAll(error => 
              Effect.sync(() => {
                console.error('Reconnection failed:', error);
                this.attemptReconnect();
              })
            )
          )
        );
      }, this.reconnectDelay);
    } else {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
    }
  }

  // Send a message with schema validation
  private sendMessage(
    type: WebSocketMessage['type'],
    payload: Record<string, unknown>,
    correlationId?: string
  ): Effect.Effect<WebSocketMessage, Error> {
    const self = this; // Capture 'this' in a variable
    return Effect.gen(function* () {
      if (!self.ws || self.ws.readyState !== WebSocket.OPEN) {
        yield* self.connect();
      }
      
      if (!self.ws || self.ws.readyState !== WebSocket.OPEN) {
        return yield* Effect.fail(new Error('WebSocket is not open'));
      }
      
      // Create a properly typed message
      const message = createMessage(type, payload, { correlationId });
      // Create a new message with updated fields instead of mutating
      const updatedMessage = {
        ...message,
        sequence: self.sequence++,
        agentRuntimeId: self.agentRuntimeId
      };
      
      // Convert to JSON and send
      const messageStr = JSON.stringify(updatedMessage);
      console.log(`📤 Sending ${type} message:`, { 
        id: message.id, 
        correlationId,
        payload 
      });
      
      self.ws.send(messageStr);
      
      return updatedMessage;
    });
  }
  
  // Public API methods
  ping(): Effect.Effect<WebSocketMessage, Error> {
    console.log('🏓 Sending PING');
    return this.sendMessage('COMMAND', { type: 'ping' });
  }
  
  sendCommand(command: string, data: unknown): Effect.Effect<WebSocketMessage, Error> {
    console.log(`🚀 Sending COMMAND: ${command}`);
    const correlationId = crypto.randomUUID();
    return this.sendMessage('COMMAND', { command, data }, correlationId);
  }
  
  sendQuery(query: string, params?: unknown): Effect.Effect<WebSocketMessage, Error> {
    console.log(`❓ Sending QUERY: ${query}`);
    const correlationId = crypto.randomUUID();
    return this.sendMessage('QUERY', { query, params }, correlationId);
  }
  
  sendEvent(eventType: string, data: unknown): Effect.Effect<WebSocketMessage, Error> {
    console.log(`🎫 Sending EVENT: ${eventType}`);
    return this.sendMessage('EVENT', { eventType, data });
  }
  
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Test runner using Effect
async function runTest() {
  const client = new EffectClient('ws://localhost:8080/chat');
  
  try {
    console.log('\n--- Connecting to WebSocket server ---');
    await Effect.runPromise(client.connect());
    
    console.log('\n--- Waiting for connection to stabilize ---');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test ping/pong
    console.log('\n--- Testing Ping ---');
    const pingResult = await Effect.runPromise(client.ping());
    console.log('Ping response:', JSON.stringify(pingResult, null, 2));
    
    // Test command
    console.log('\n--- Testing Command ---');
    const commandResult = await Effect.runPromise(
      client.sendCommand('process', { data: 'Test data' })
    );
    console.log('Command response:', JSON.stringify(commandResult, null, 2));
    
    // Keep the connection open for a bit to receive any additional messages
    console.log('\n--- Waiting for any additional messages (5s) ---');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n--- Closing connection ---');
    client.close();
  }
}

// Run the test
runTest().catch(console.error);
