const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    // Array of allowed origins matching the main server configuration
    const allowedOrigins = [
        "http://localhost:5173",
        "https://tastystation.vercel.app",
        "tastystation.vercel.app",
        "https://www.tastystation.vercel.app",
        "www.tastystation.vercel.app"
    ];

    io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            },
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true
        }
    });

    console.log("Socket.io initialized.");

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on("join-room", (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
        });

        socket.on("leave-room", (room) => {
            socket.leave(room);
            console.log(`Socket ${socket.id} left room ${room}`);
        });

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
