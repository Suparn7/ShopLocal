import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const useSocket = (userId: number, onEvent: (event: string, data: any) => void) => {
  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket server
    socket = io("http://localhost:5050"); // Ensure this matches your WebSocket server URL

    // Subscribe to the customer's room
    const roomName = `customer-${userId}`;
    console.log(`Subscribing to room: ${roomName}`); // Debug log
    socket.emit("subscribe", roomName);

    // Listen for events
    socket.onAny((event, data) => {
      console.log(`Received event: ${event}`, data);
      onEvent(event, data);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, onEvent]);

  return socket;
};