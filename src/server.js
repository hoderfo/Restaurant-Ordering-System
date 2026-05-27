const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/table.router');
const reservationRoutes = require('./routes/reservation.router');
const menuRoutes = require('./routes/menu.router');
const orderRoutes = require('./routes/order.router');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Simple CORS since frontend is now served by this backend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// Trust proxy for accurate IP addresses in audit logs
app.set('trust proxy', true);
 
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

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
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV}`);
});
