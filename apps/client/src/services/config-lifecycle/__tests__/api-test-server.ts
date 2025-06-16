import { IncomingMessage, ServerResponse, createServer } from "node:http";
import { URL } from "node:url";

export class ConfigApiTestServer {
  private server: any = null;
  private port: number;
  private configs: Map<string, any> = new Map();

  constructor(port = 3001) {
    this.port = port;

    // Initialize with some test data
    this.configs.set("test-config-1.json", {
      id: "test-config-1",
      name: "Test Chat App 1",
      agentId: "test-agent",
      toolbarId: "test-toolbar",
      themeId: "test-theme",
      description: "Test configuration",
      version: "1.0.0",
    });

    this.configs.set("test-config-2.json", {
      id: "test-config-2",
      name: "Test Chat App 2",
      agentId: "test-agent-2",
      toolbarId: "test-toolbar-2",
      themeId: "test-theme-2",
      description: "Another test configuration",
      version: "1.0.0",
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(
          (req: IncomingMessage, res: ServerResponse) => {
            this.handleRequest(req, res);
          },
        );

        this.server.on("listening", () => {
          console.log(`Config API test server listening on port ${this.port}`);
          resolve();
        });

        this.server.on("error", (error: Error) => {
          console.error("Config API server error:", error);
          reject(error);
        });

        this.server.listen(this.port, "localhost");
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log("Config API test server stopped");
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "", `http://localhost:${this.port}`);
    const method = req.method || "GET";

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    console.log(`📡 Config API: ${method} ${url.pathname}${url.search}`);

    try {
      if (url.pathname === "/api/configs") {
        if (method === "GET") {
          this.handleGetConfigs(url, res);
        } else if (method === "POST") {
          this.handlePostConfig(req, res);
        } else {
          this.sendError(res, 405, "Method not allowed");
        }
      } else if (url.pathname.startsWith("/api/configs/")) {
        if (method === "DELETE") {
          this.handleDeleteConfig(url, res);
        } else {
          this.sendError(res, 405, "Method not allowed");
        }
      } else {
        this.sendError(res, 404, "Not found");
      }
    } catch (error) {
      console.error("Error handling request:", error);
      this.sendError(res, 500, "Internal server error");
    }
  }

  private handleGetConfigs(url: URL, res: ServerResponse): void {
    const fileParam = url.searchParams.get("file");

    if (fileParam) {
      // Return specific config file
      const config = this.configs.get(fileParam);
      if (config) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Last-Modified", new Date().toUTCString());
        res.writeHead(200);
        res.end(JSON.stringify(config));
      } else {
        this.sendError(res, 404, "Config file not found");
      }
    } else {
      // Return list of config files
      const fileList = Array.from(this.configs.keys()).map((name) => ({
        name,
        lastModified: Date.now(),
        size: JSON.stringify(this.configs.get(name)).length,
      }));

      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(fileList));
    }
  }

  private handlePostConfig(req: IncomingMessage, res: ServerResponse): void {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { filename, data } = JSON.parse(body);

        if (!filename || !data) {
          this.sendError(res, 400, "Missing filename or data");
          return;
        }

        // Save the config
        this.configs.set(filename, data);

        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        this.sendError(res, 400, "Invalid JSON");
      }
    });
  }

  private handleDeleteConfig(url: URL, res: ServerResponse): void {
    const configId = url.pathname.split("/").pop();
    const filename = `${configId}.json`;

    if (this.configs.has(filename)) {
      this.configs.delete(filename);
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } else {
      this.sendError(res, 404, "Config not found");
    }
  }

  private sendError(
    res: ServerResponse,
    status: number,
    message: string,
  ): void {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(status);
    res.end(JSON.stringify({ error: message }));
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}
