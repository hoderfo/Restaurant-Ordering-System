import { io } from "socket.io-client";

// In development, the Vite dev server typically proxies via vite.config.js
// If deployed, this should point to your backend URL (e.g., from an environment variable)
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

let socket = null;

export const initSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            autoConnect: false // We will connect manually when needed (e.g., after login)
        });

        socket.on("connect", () => {
            console.log("Connected to Socket.io server with ID:", socket.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("Disconnected from Socket.io server. Reason:", reason);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket.io connection error:", err.message);
        });
    }

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn("Socket.io requested before initialization. Initializing now...");
        return initSocket();
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
};

export const disconnectSocket = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};
