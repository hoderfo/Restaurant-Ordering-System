const pool = require('../config/db');

// Create a new order or return existing active order for a table
exports.getOrCreateOrder = async (req, res) => {
    const { tableId } = req.body;
    try {
        // Check for active order
        let result = await pool.query("SELECT * FROM orders WHERE table_id = $1 AND status = 'active'", [tableId]);
        let order;

        if (result.rows.length > 0) {
            order = result.rows[0];
        } else {
            // Create new order
            const insertResult = await pool.query(
                "INSERT INTO orders (table_id, status) VALUES ($1, 'active') RETURNING *",
                [tableId]
            );
            order = insertResult.rows[0];
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating/getting order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch order items for a specific table (useful for Floor Plan)
exports.getTableOrderItems = async (req, res) => {
    const { tableId } = req.params;
    try {
        const orderResult = await pool.query("SELECT order_id FROM orders WHERE table_id = $1 AND status = 'active'", [tableId]);

        if (orderResult.rows.length === 0) {
            return res.json({ success: true, orderItems: [], message: 'No active order for this table' });
        }

        const orderId = orderResult.rows[0].order_id;

        const itemsResult = await pool.query(`
            SELECT oi.*, mi.name 
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
            WHERE oi.order_id = $1
            ORDER BY oi.order_item_id ASC
        `, [orderId]);

        res.json({ success: true, orderItems: itemsResult.rows });
    } catch (error) {
        console.error('Error fetching table order items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add item to order
exports.addItemToOrder = async (req, res) => {
    const { orderId } = req.params;
    const { menuItemId, quantity, note } = req.body;

    try {
        // Fetch price snapshot
        const menuResult = await pool.query("SELECT price FROM menu_items WHERE menu_item_id = $1", [menuItemId]);
        if (menuResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        const unitPrice = menuResult.rows[0].price;

        const insertResult = await pool.query(
            "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, note, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *",
            [orderId, menuItemId, quantity || 1, unitPrice, note || '']
        );

        res.json({ success: true, orderItem: insertResult.rows[0] });
    } catch (error) {
        console.error('Error adding item to order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// KDS: Fetch pending and in_preparation items
exports.getKitchenOrders = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                oi.order_item_id, oi.quantity, oi.note, oi.status, oi.created_at,
                mi.name AS menu_item_name,
                t.label AS table_label
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
            JOIN orders o ON oi.order_id = o.order_id
            JOIN tables t ON o.table_id = t.table_id
            WHERE oi.status IN ('pending', 'in_preparation')
            ORDER BY oi.created_at ASC
        `);

        res.json({ success: true, kitchenOrders: result.rows });
    } catch (error) {
        console.error('Error fetching kitchen orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// KDS: Fetch pending and in_preparation items (Fallback without created_at)
exports.getKitchenOrdersSafe = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                oi.order_item_id, oi.quantity, oi.note, oi.status,
                mi.name AS menu_item_name,
                t.label AS table_label,
                o.created_at AS order_created_at
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
            JOIN orders o ON oi.order_id = o.order_id
            JOIN tables t ON o.table_id = t.table_id
            WHERE oi.status IN ('pending', 'in_preparation')
            ORDER BY oi.order_item_id ASC
        `);

        res.json({ success: true, kitchenOrders: result.rows });
    } catch (error) {
        console.error('Error fetching kitchen orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Kitchen update status
exports.updateOrderItemStatus = async (req, res) => {
    const { itemId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_preparation', 'ready', 'served'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const updateResult = await pool.query(
            "UPDATE order_items SET status = $1 WHERE order_item_id = $2 RETURNING *",
            [status, itemId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order item not found' });
        }

        res.json({ success: true, orderItem: updateResult.rows[0] });
    } catch (error) {
        console.error('Error updating order item status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.checkoutOrder = async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, discountType, discountValue, discountReason } = req.body;
    const validPaymentMethods = ['cash', 'card', 'ewallet'];
    const validDiscountTypes = ['percentage', 'flat', null];

    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing paymentMethod. Use cash, card, or ewallet.' });
    }

    if (discountType && !validDiscountTypes.includes(discountType)) {
        return res.status(400).json({ success: false, message: 'Invalid discountType. Use percentage, flat, or omit it.' });
    }

    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orderResult.rows[0];
        if (order.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Only active orders can be checked out.' });
        }

        const billExists = await pool.query('SELECT bill_id FROM bills WHERE order_id = $1', [orderId]);
        if (billExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Order already billed.' });
        }

        const itemsResult = await pool.query(
            'SELECT quantity, unit_price FROM order_items WHERE order_id = $1',
            [orderId]
        );

        if (itemsResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Cannot checkout an order without items.' });
        }

        const subtotal = itemsResult.rows.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
        const taxRate = 10.0;
        const taxAmount = Number((subtotal * taxRate / 100).toFixed(2));

        let discount = 0;
        let normalizedDiscountValue = 0;
        if (discountType && discountValue != null) {
            normalizedDiscountValue = Number(discountValue);
            if (Number.isNaN(normalizedDiscountValue) || normalizedDiscountValue < 0) {
                return res.status(400).json({ success: false, message: 'Invalid discountValue.' });
            }

            if (discountType === 'percentage') {
                if (normalizedDiscountValue > 100) {
                    return res.status(400).json({ success: false, message: 'percentage discountValue cannot exceed 100.' });
                }
                discount = Number((subtotal * normalizedDiscountValue / 100).toFixed(2));
            } else if (discountType === 'flat') {
                discount = Number(normalizedDiscountValue.toFixed(2));
                if (discount > subtotal + taxAmount) {
                    return res.status(400).json({ success: false, message: 'flat discountValue cannot exceed bill total.' });
                }
            }
        }

        const total = Number((subtotal + taxAmount - discount).toFixed(2));

        const insertResult = await pool.query(
            `INSERT INTO bills (
                order_id, subtotal, tax_rate, tax_amount,
                discount_type, discount_value, discount_amount, discount_reason,
                total, payment_method, closed_at, closed_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
            RETURNING *`,
            [orderId, subtotal, taxRate, taxAmount, discountType || null, normalizedDiscountValue || null, discount, discountReason || null, total, paymentMethod, req.user.user_id]
        );

        await pool.query(
            "UPDATE orders SET status = 'billed', locked_at = NOW() WHERE order_id = $1",
            [orderId]
        );

        res.status(201).json({ success: true, bill: insertResult.rows[0] });
    } catch (error) {
        console.error('Error checking out order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getBill = async (req, res) => {
    const { orderId } = req.params;
    try {
        const result = await pool.query(
            `SELECT b.*, o.status AS order_status
             FROM bills b
             JOIN orders o ON b.order_id = o.order_id
             WHERE b.order_id = $1`,
            [orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bill not found.' });
        }

        res.json({ success: true, bill: result.rows[0] });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
