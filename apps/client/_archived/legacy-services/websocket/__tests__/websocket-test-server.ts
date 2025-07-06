import { WebSocketServer } from "ws";

export class WebSocketTestServer {
  private server: WebSocketServer | null = null;
  private actualPort: number | null = null;
  private connections: Set<any> = new Set();

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      // Create WebSocket server directly (like llm-agent and working simple server)
      this.server = new WebSocketServer({ port: 0 });

      this.server.on("connection", (ws) => {
        console.log("WebSocket connection established: /");
        this.connections.add(ws);

        // Simple message handling (like working simple server)
        ws.on("message", (data) => {
          console.log("Server received:", data.toString());
          // Simple echo without complex JSON parsing
          ws.send(`Echo: ${data.toString()}`);
        });

        // DON'T send welcome message immediately - this was causing the hang

        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
        });

        ws.on("close", (code, reason) => {
          console.log(`WebSocket closed: ${code} ${reason}`);
          this.connections.delete(ws);
        });
      });

      this.server.on("listening", () => {
        const address = this.server?.address();
        if (typeof address === "object" && address && "port" in address) {
          this.actualPort = address.port;
          console.log(
            `WebSocket test server listening on port ${this.actualPort}`,
          );
          resolve(this.actualPort);
        } else {
          reject(new Error("Unable to determine server port"));
        }
      });

      this.server.on("error", (error) => {
        console.error("WebSocket server error:", error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all active connections first
      for (const ws of this.connections) {
        if (ws.readyState === 1) {
          // OPEN
          ws.close();
        }
      }
      this.connections.clear();

      if (this.server) {
        this.server.close(() => {
          console.log("WebSocket server stopped");
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    if (!this.actualPort) {
      throw new Error("Server not started - no port available");
    }
    const host =
      typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_HOST
        ? process.env.NEXT_PUBLIC_WS_HOST
        : "localhost";
    return `ws://${host}:${this.actualPort}`;
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  getPort(): number {
    if (!this.actualPort) {
      throw new Error("Server not started - no port available");
    }
    return this.actualPort;
  }

  // Simulate different server behaviors for testing
  simulateDisconnect(): void {
    for (const ws of this.connections) {
      ws.close(1001, "Server going away");
    }
  }

  simulateError(): void {
    for (const ws of this.connections) {
      ws.terminate(); // Abrupt close
    }
  }
}
