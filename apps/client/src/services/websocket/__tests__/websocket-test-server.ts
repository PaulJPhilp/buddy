import { WebSocketServer } from "ws";

export class WebSocketTestServer {
  private server: WebSocketServer | null = null;
  private port: number;

  constructor(port = 8080) {
    this.port = port;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocketServer({
          port: this.port,
          host: "localhost",
        });

        this.server.on("connection", (ws, request) => {
          console.log(`WebSocket connection established: ${request.url}`);

          // Echo server - send back any message received
          ws.on("message", (data) => {
            try {
              // Try to parse as JSON and echo back
              const message = JSON.parse(data.toString());
              ws.send(JSON.stringify({ echo: message }));
            } catch {
              // If not JSON, just echo the string
              ws.send(`Echo: ${data.toString()}`);
            }
          });

          // Send a welcome message
          ws.send(
            JSON.stringify({
              type: "welcome",
              message: "Connected to test server",
            }),
          );

          ws.on("error", (error) => {
            console.error("WebSocket error:", error);
          });

          ws.on("close", (code, reason) => {
            console.log(`WebSocket closed: ${code} ${reason}`);
          });
        });

        this.server.on("listening", () => {
          console.log(`WebSocket test server listening on port ${this.port}`);
          resolve();
        });

        this.server.on("error", (error) => {
          console.error("WebSocket server error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log("WebSocket test server stopped");
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `ws://localhost:${this.port}`;
  }

  isRunning(): boolean {
    return this.server !== null;
  }
}
