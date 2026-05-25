const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');

const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/table.router');
const reservationRoutes = require('./routes/reservation.router');
const pool = require('./config/db');
const { initSocket } = require('./config/socket.config');

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 3000;

// Middleware
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
		if (!origin) return callback(null, true);
		if (allowedOrigins.indexOf(origin) === -1) {
			var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
			return callback(new Error(msg), false);
		}
		return callback(null, true);
	},
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Trust proxy for accurate IP addresses in audit logs
app.set('trust proxy', true);
 
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/reservations', reservationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString()
	});
});

// Test DB connection
app.get('/api/test-db', async (req, res) => {
	try {
		const result = await pool.query('SELECT NOW()');
		res.json({
			database: 'connected',
			timestamp: result.rows[0].now
		});
	} catch (error) {
		res.status(500).json({
			database: 'error',
			message: error.message
		});
	}
});

// 404 Handler
app.use((req, res) => {
	res.status(404).json({
		error: 'Route not found'
	});
});

// Error Handler
app.use((error, req, res, next) => {
	console.error('Server error:', error);
	res.status(500).json({
		error: 'Internal server error'
	});
});

// Start server
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server };
