const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const logger = require("./utils/logger");
const { initSocket } = require("./config/socket.config");

// Database connection is now managed via pg pool
// const userRouter = require("./routers/user.router");
// const menuRouter = require("./routers/menu.router");
const tableRouter = require("./routers/table.router");
// const taxRouter = require("./routers/tax.router");
// const discountRouter = require("./routers/discount.router");
// const orderRouter = require("./routers/order.router");
// const inventoryRouter = require("./routers/inventory.router");
// const reportRouter = require("./routers/report.router");
// const clientRouter = require("./routers/client.router");
// const dashboardRouter = require("./routers/dashboard.router");
const reservationRouter = require("./routers/reservation.router");
// const redisTestRouter = require("./routers/redis.test.router");
const errorHandler = require("./middlewares/error.middleware");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Apply Rate Limiting globally for API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 10000 : 100, // Limit each IP
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" }
});

app.use('/api', apiLimiter);

if (process.env.NODE_ENV !== "test") {
    // Inject Morgan HTTP logging into Winston
    const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
    app.use(morgan(morganFormat, { stream: logger.stream }));
}

// App initialization
initSocket(server);

app.set('trust proxy', 1);
app.use(express.json());
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://tastystation.vercel.app",
    "tastystation.vercel.app",
    "https://www.tastystation.vercel.app",
    "www.tastystation.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable pre-flight requests for all routes
app.options(/.*/, cors());
app.use(cookieParser());

const authRouter = require("./routers/auth");
app.use('/api/auth', authRouter);
// app.use('/api/users', userRouter);
// app.use('/api/menu', menuRouter);
app.use('/api/table', tableRouter);
// app.use('/api/tax', taxRouter);
// app.use('/api/discount', discountRouter);
// app.use('/api/orders', orderRouter);
// app.use('/api/inventory', inventoryRouter);
// app.use('/api/reports', reportRouter);
// app.use('/api/clients', clientRouter);
// app.use('/api/dashboard', dashboardRouter);
app.use('/api/reservations', reservationRouter);
// app.use('/api', redisTestRouter);
// const chatRouter = require("./routers/chat.router");
// app.use('/api/chat', chatRouter);

// Global Error Handler - Must be last
app.use(errorHandler);


// if (process.env.NODE_ENV !== 'test') {
//     connectDB();
// }



app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Welcome to the POS API"
    })
})


if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });
}

module.exports = app;