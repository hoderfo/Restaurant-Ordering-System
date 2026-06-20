const prisma = require('../config/db');

exports.getMenuItems = async (req, res) => {
    try {
        const menuItems = await prisma.menuItem.findMany({
            where: { status: { in: ['ACTIVE', 'SOLD_OUT'] } },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        res.json({
            success: true,
            menuItems
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
    const { name, description, price, category, status, imageUrl } = req.body;

    if (!name || price == null || !category) {
        return res.status(400).json({ success: false, message: 'name, price and category are required.' });
    }

    const categorySetting = await prisma.setting.findUnique({ where: { key: 'MENU_CATEGORIES' }});
    const allowedCategoriesStr = categorySetting ? categorySetting.value : 'STARTER,MAIN,DESSERT,BEVERAGE';
    const allowedCategories = allowedCategoriesStr.split(',').map(c => c.trim().toUpperCase());
    
    const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SOLD_OUT'];
    const uppercaseCategory = category.toUpperCase();
    const uppercaseStatus = status ? status.toUpperCase() : 'ACTIVE';

    if (!allowedCategories.includes(uppercaseCategory)) {
        return res.status(400).json({ success: false, message: `Invalid category. Allowed: ${allowedCategories.join(', ')}` });
    }

    if (!allowedStatuses.includes(uppercaseStatus)) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    try {
        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(price),
                category: uppercaseCategory,
                status: uppercaseStatus,
                imageUrl: imageUrl || null
            }
        });

        res.status(201).json({ success: true, menuItem });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to create menu item' });
    }
};

exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, status, imageUrl } = req.body;

    const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SOLD_OUT'];

    const data = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    
    if (category !== undefined) {
        const categorySetting = await prisma.setting.findUnique({ where: { key: 'MENU_CATEGORIES' }});
        const allowedCategoriesStr = categorySetting ? categorySetting.value : 'STARTER,MAIN,DESSERT,BEVERAGE';
        const allowedCategories = allowedCategoriesStr.split(',').map(c => c.trim().toUpperCase());
        
        const uppercaseCategory = category.toUpperCase();
        if (!allowedCategories.includes(uppercaseCategory)) {
            return res.status(400).json({ success: false, message: `Invalid category. Allowed: ${allowedCategories.join(', ')}` });
        }
        data.category = uppercaseCategory;
    }

    if (status !== undefined) {
        const uppercaseStatus = status.toUpperCase();
        if (!allowedStatuses.includes(uppercaseStatus)) {
            return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }
        data.status = uppercaseStatus;
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    try {
        const menuItem = await prisma.menuItem.update({
            where: { id: parseInt(id) },
            data
        });

        res.json({ success: true, menuItem });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to update menu item' });
    }
};

exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;
    try {
        const menuItem = await prisma.menuItem.update({
            where: { id: parseInt(id) },
            data: { status: 'INACTIVE' }
        });

        res.json({ success: true, message: 'Menu item marked inactive.', menuItem });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Server Error: Failed to delete menu item' });
    }
};
