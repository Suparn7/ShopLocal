import { Server } from "socket.io";
import http from "http";

export function startWebSocketServer() {
  const websocketPort = 5050;
  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5000"], // Allow both origins
      methods: ["GET", "POST"], // Allow specific HTTP methods
    },
  });

  io.on("connection", (socket) => {
    console.log("WebSocket client connected:", socket.id);
  
    // Handle room subscription
    socket.on("subscribe", (room) => {
      console.log(`Client subscribed to room: ${room}`);
      socket.join(room);
    });
  
    socket.on("disconnect", () => {
      console.log("WebSocket client disconnected:", socket.id);
    });
  });

  httpServer.listen(websocketPort, () => {
    console.log(`WebSocket server running on port ${websocketPort}`);
  });

  return io;
}