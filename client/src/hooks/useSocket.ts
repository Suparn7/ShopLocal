import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const useSocket = (
  userId: number,
  role: string,
  onEvent: (event: string, data: any) => void,
  shopId?: number // Optional shopId for dynamic room subscription
) => {
  useEffect(() => {
    if (!userId || !role) return;

    // Connect to WebSocket server
    socket = io("http://localhost:5050"); // Ensure this matches your WebSocket server URL

    // Subscribe to the user's main room
    const roomName = `${role.toLowerCase()}-${userId}`;
    //console.log(`Subscribing to room: ${roomName}`);
    socket.emit("subscribe", roomName);

    // Subscribe to a generic "customer" room if the role is "customer"
    if (role.toLowerCase() === "customer") {
      //console.log(`Subscribing to customer room`);
      socket.emit("subscribe", "customer");
    }

    // Subscribe to a shop-specific room if shopId is provided
    if (shopId) {
      const shopRoom = `shop-${shopId}`;
     // console.log(`Subscribing to shop room: ${shopRoom}`);
      socket.emit("subscribe", shopRoom);
    }

    // Listen for events
    socket.onAny((event, data) => {
     // console.log(`Received event: ${event}`, data);
      onEvent(event, data);
    });

    return () => {
      // Unsubscribe from the shop-specific room if shopId is provided
      if (shopId) {
        const shopRoom = `shop-${shopId}`;
        //console.log(`Unsubscribing from shop room: ${shopRoom}`);
        socket.emit("unsubscribe", shopRoom);
      }

      // Unsubscribe from the "customer" room if the role is "customer"
      if (role.toLowerCase() === "customer") {
        //console.log(`Unsubscribing from customer room`);
        socket.emit("unsubscribe", "customer");
      }

      // Disconnect the socket
      socket.disconnect();
    };
  }, [userId, role, onEvent, shopId]);

  return socket;
};