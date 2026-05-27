const pool = require('../config/db');

exports.getMenuItems = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM menu_items WHERE status = 'active' ORDER BY category, name");
        res.json({
            success: true,
            menuItems: result.rows
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Failed to fetch menu items'
        });
    }
};
