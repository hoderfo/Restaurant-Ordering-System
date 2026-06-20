const prisma = require('../config/db');

exports.getOrCreateOrder = async (req, res) => {
    const { tableId } = req.body;
    try {
        let order = await prisma.order.findFirst({
            where: { tableId: parseInt(tableId), status: 'ACTIVE' }
        });

        if (!order) {
            order = await prisma.order.create({
                data: {
                    tableId: parseInt(tableId),
                    status: 'ACTIVE'
                }
            });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating/getting order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTableOrderItems = async (req, res) => {
    const { tableId } = req.params;
    try {
        const order = await prisma.order.findFirst({
            where: { tableId: parseInt(tableId), status: 'ACTIVE' },
            select: { id: true }
        });

        if (!order) {
            return res.json({ success: true, orderItems: [], message: 'No active order for this table' });
        }

        const orderItems = await prisma.orderItem.findMany({
            where: { orderId: order.id },
            include: { menuItem: { select: { name: true } } },
            orderBy: { id: 'asc' }
        });

        const formattedItems = orderItems.map(item => ({
            ...item,
            order_item_id: item.id, // for legacy frontend compatibility if needed
            name: item.menuItem.name
        }));

        res.json({ success: true, orderItems: formattedItems });
    } catch (error) {
        console.error('Error fetching table order items:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addItemToOrder = async (req, res) => {
    const { orderId } = req.params;
    const { menuItemId, quantity, note } = req.body;

    try {
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: parseInt(menuItemId) },
            select: { price: true }
        });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        const orderItem = await prisma.orderItem.create({
            data: {
                orderId: parseInt(orderId),
                menuItemId: parseInt(menuItemId),
                quantity: quantity ? parseInt(quantity) : 1,
                unitPrice: menuItem.price,
                note: note || '',
                status: 'PENDING'
            },
            include: {
                menuItem: { select: { name: true } },
                order: { include: { table: { select: { label: true } } } }
            }
        });

        if (req.app.locals.io) {
            req.app.locals.io.emit('order:new_item', {
                order_item_id: orderItem.id,
                quantity: orderItem.quantity,
                note: orderItem.note,
                status: orderItem.status.toLowerCase(),
                created_at: orderItem.createdAt,
                menu_item_name: orderItem.menuItem.name,
                table_label: orderItem.order.table.label
            });
        }

        res.json({ success: true, orderItem });
    } catch (error) {
        console.error('Error adding item to order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getKitchenOrders = async (req, res) => {
    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                status: { in: ['PENDING', 'IN_PREPARATION'] }
            },
            include: {
                menuItem: { select: { name: true } },
                order: {
                    include: { table: { select: { label: true } } }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const formattedOrders = orderItems.map(oi => ({
            order_item_id: oi.id,
            quantity: oi.quantity,
            note: oi.note,
            status: oi.status.toLowerCase(),
            created_at: oi.createdAt,
            menu_item_name: oi.menuItem.name,
            table_label: oi.order.table.label
        }));

        res.json({ success: true, kitchenOrders: formattedOrders });
    } catch (error) {
        console.error('Error fetching kitchen orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



exports.updateOrderItemStatus = async (req, res) => {
    const { itemId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PREPARATION', 'READY', 'SERVED'];
    const uppercaseStatus = status ? status.toUpperCase() : '';

    if (!validStatuses.includes(uppercaseStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const orderItem = await prisma.orderItem.update({
            where: { id: parseInt(itemId) },
            data: { status: uppercaseStatus },
            include: {
                menuItem: { select: { name: true } },
                order: { include: { table: { select: { label: true } } } }
            }
        });

        if (req.app.locals.io) {
            req.app.locals.io.emit('order:item_updated', {
                order_item_id: orderItem.id,
                status: orderItem.status,
                menu_item_name: orderItem.menuItem.name,
                table_label: orderItem.order.table.label
            });
        }

        res.json({ success: true, orderItem });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Order item not found' });
        }
        console.error('Error updating order item status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.checkoutOrder = async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, discountType, discountValue, discountReason } = req.body;
    
    const validPaymentMethods = ['CASH', 'CARD', 'EWALLET'];
    const validDiscountTypes = ['PERCENTAGE', 'FLAT'];
    const uppercasePaymentMethod = paymentMethod ? paymentMethod.toUpperCase() : null;
    const uppercaseDiscountType = discountType ? discountType.toUpperCase() : null;

    if (!uppercasePaymentMethod || !validPaymentMethods.includes(uppercasePaymentMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing paymentMethod. Use cash, card, or ewallet.' });
    }

    if (uppercaseDiscountType && !validDiscountTypes.includes(uppercaseDiscountType)) {
        return res.status(400).json({ success: false, message: 'Invalid discountType. Use percentage, flat, or omit it.' });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: { items: true, bill: true }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        if (order.status !== 'ACTIVE') {
            return res.status(400).json({ success: false, message: 'Only active orders can be checked out.' });
        }
        if (order.bill) {
            return res.status(400).json({ success: false, message: 'Order already billed.' });
        }
        if (order.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cannot checkout an order without items.' });
        }

        const subtotal = order.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
        
        let taxRate = 10.0;
        try {
            let taxSetting;
            try {
                taxSetting = await prisma.setting.findUnique({ where: { key: 'TAX_RATE' } });
            } catch (e) {
                const results = await prisma.$queryRaw`SELECT * FROM settings WHERE key = 'TAX_RATE'`;
                taxSetting = results[0];
            }
            if (taxSetting && taxSetting.value) {
                taxRate = parseFloat(taxSetting.value);
            }
        } catch (e) {
            console.error('Failed to fetch TAX_RATE setting, falling back to 10.0');
        }

        const taxAmount = Number((subtotal * taxRate / 100).toFixed(2));

        let discount = 0;
        let normalizedDiscountValue = 0;
        if (uppercaseDiscountType && discountValue != null) {
            normalizedDiscountValue = Number(discountValue);
            if (Number.isNaN(normalizedDiscountValue) || normalizedDiscountValue < 0) {
                return res.status(400).json({ success: false, message: 'Invalid discountValue.' });
            }

            if (uppercaseDiscountType === 'PERCENTAGE') {
                if (normalizedDiscountValue > 100) {
                    return res.status(400).json({ success: false, message: 'percentage discountValue cannot exceed 100.' });
                }
                discount = Number((subtotal * normalizedDiscountValue / 100).toFixed(2));
            } else if (uppercaseDiscountType === 'FLAT') {
                discount = Number(normalizedDiscountValue.toFixed(2));
                if (discount > subtotal + taxAmount) {
                    return res.status(400).json({ success: false, message: 'flat discountValue cannot exceed bill total.' });
                }
            }
        }

        const total = Number((subtotal + taxAmount - discount).toFixed(2));
        const userId = req.user && (req.user.id || req.user.user_id) ? parseInt(req.user.id || req.user.user_id) : undefined;

        const bill = await prisma.bill.create({
            data: {
                orderId: parseInt(orderId),
                subtotal: subtotal,
                taxRate: taxRate,
                taxAmount: taxAmount,
                discountType: uppercaseDiscountType,
                discountValue: uppercaseDiscountType ? normalizedDiscountValue : null,
                discountAmount: discount,
                discountReason: discountReason || null,
                total: total,
                paymentMethod: uppercasePaymentMethod,
                closedAt: new Date(),
                closedById: userId
            }
        });

        await prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: 'BILLED', lockedAt: new Date() }
        });

        // End the meal
        const updatedTable = await prisma.table.update({
            where: { id: order.tableId },
            data: { status: 'CLEANING' }
        });

        await prisma.reservation.updateMany({
            where: { tableId: order.tableId, status: 'SEATED' },
            data: { status: 'COMPLETED' }
        });

        if (req.app.locals.io) {
            req.app.locals.io.emit('table:updated', { ...updatedTable, _id: updatedTable.id, status: 'Cleaning' });
        }

        res.status(201).json({ success: true, bill });
    } catch (error) {
        console.error('Error checking out order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getBill = async (req, res) => {
    const { orderId } = req.params;
    try {
        const bill = await prisma.bill.findUnique({
            where: { orderId: parseInt(orderId) },
            include: { order: { select: { status: true } } }
        });

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found.' });
        }

        const formattedBill = {
            ...bill,
            order_status: bill.order.status
        };

        res.json({ success: true, bill: formattedBill });
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
