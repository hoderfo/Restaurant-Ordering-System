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

exports.createMenuItem = async (req, res) => {
    const { name, description, price, category, status } = req.body;

    if (!name || price == null || !category) {
        return res.status(400).json({ success: false, message: 'name, price and category are required.' });
    }

    const allowedCategories = ['starter', 'main', 'dessert', 'beverage'];
    const allowedStatuses = ['active', 'inactive', 'sold_out'];

    if (!allowedCategories.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category. Allowed: ${allowedCategories.join(', ')}` });
    }

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    try {
        const insertResult = await pool.query(
            `INSERT INTO menu_items (name, description, price, category, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, description || '', price, category, status || 'active']
        );

        res.status(201).json({ success: true, menuItem: insertResult.rows[0] });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to create menu item' });
    }
};

exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, status } = req.body;

    const allowedCategories = ['starter', 'main', 'dessert', 'beverage'];
    const allowedStatuses = ['active', 'inactive', 'sold_out'];

    if (category && !allowedCategories.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category. Allowed: ${allowedCategories.join(', ')}` });
    }

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
        fields.push(`name = $${index++}`);
        values.push(name);
    }
    if (description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(description);
    }
    if (price !== undefined) {
        fields.push(`price = $${index++}`);
        values.push(price);
    }
    if (category !== undefined) {
        fields.push(`category = $${index++}`);
        values.push(category);
    }
    if (status !== undefined) {
        fields.push(`status = $${index++}`);
        values.push(status);
    }

    if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(id);

    try {
        const updateResult = await pool.query(
            `UPDATE menu_items SET ${fields.join(', ')} WHERE menu_item_id = $${index} RETURNING *`,
            values
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }

        res.json({ success: true, menuItem: updateResult.rows[0] });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to update menu item' });
    }
};

exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        const updateResult = await pool.query(
            "UPDATE menu_items SET status = 'inactive' WHERE menu_item_id = $1 RETURNING *",
            [id]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }

        res.json({ success: true, message: 'Menu item marked inactive.', menuItem: updateResult.rows[0] });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to delete menu item' });
    }
};
