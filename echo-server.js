import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log("Echo WebSocket server started on port 8080");

wss.on("connection", function connection(ws) {
  console.log("Client connected");

  ws.on("message", function incoming(message) {
    console.log("Received:", message.toString());
    // Echo the message back
    ws.send(message);
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
  });

  ws.on("error", function error(err) {
    console.error("WebSocket error:", err);
  });
});

wss.on("error", function error(err) {
  console.error("Server error:", err);
});

process.on("SIGINT", () => {
  console.log("\nShutting down echo server...");
  wss.close();
  process.exit(0);
});
