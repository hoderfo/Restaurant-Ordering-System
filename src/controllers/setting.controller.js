const prisma = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        let settings = [];
        try {
            settings = await prisma.setting.findMany();
        } catch (e) {
            settings = await prisma.$queryRaw`SELECT * FROM settings`;
        }

        // Convert array to key-value object for easy frontend consumption
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Add default for TAX_RATE if it doesn't exist
        if (!settingsMap['TAX_RATE']) {
            settingsMap['TAX_RATE'] = '10.0';
        }

        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSetting = async (req, res) => {
    const { key, value } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ success: false, message: 'Key and value are required' });
    }

    try {
        // Since we are not guaranteed Prisma Client generation works due to locked DLL,
        // we use a raw query just to be safe, or we can use upsert.
        // Let's try upsert first. If it fails, we fall back to raw SQL.
        let setting;
        try {
            setting = await prisma.setting.upsert({
                where: { key: key },
                update: { value: value.toString() },
                create: { key: key, value: value.toString() }
            });
        } catch (e) {
            console.error('Prisma upsert failed, using raw query fallback', e);
            await prisma.$executeRaw`
                INSERT INTO settings (key, value, "updatedAt") 
                VALUES (${key}, ${value.toString()}, NOW()) 
                ON CONFLICT (key) DO UPDATE SET value = ${value.toString()}, "updatedAt" = NOW()
            `;
            setting = { key, value: value.toString() };
        }

        res.json({ success: true, message: 'Setting updated successfully', setting });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPublicSettings = async (req, res) => {
    try {
        let settings = [];
        try {
            settings = await prisma.setting.findMany({
                where: {
                    key: { in: [
                        'RESTAURANT_NAME', 'PRIMARY_COLOR', 'SECONDARY_COLOR',
                        'CURRENCY_SYMBOL', 'MENU_CATEGORIES', 'PAYMENT_METHODS', 'DEFAULT_RESERVATION_DURATION'
                    ] }
                }
            });
        } catch (e) {
            settings = await prisma.$queryRaw`SELECT * FROM settings WHERE key IN ('RESTAURANT_NAME', 'PRIMARY_COLOR', 'SECONDARY_COLOR', 'CURRENCY_SYMBOL', 'MENU_CATEGORIES', 'PAYMENT_METHODS', 'DEFAULT_RESERVATION_DURATION')`;
        }

        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Add defaults
        if (!settingsMap['RESTAURANT_NAME']) settingsMap['RESTAURANT_NAME'] = 'NgonNgon';
        if (!settingsMap['PRIMARY_COLOR']) settingsMap['PRIMARY_COLOR'] = '#e5a546ff';
        if (!settingsMap['SECONDARY_COLOR']) settingsMap['SECONDARY_COLOR'] = '#ebb536ff';
        if (!settingsMap['CURRENCY_SYMBOL']) settingsMap['CURRENCY_SYMBOL'] = '$';
        if (!settingsMap['MENU_CATEGORIES']) settingsMap['MENU_CATEGORIES'] = 'STARTER,MAIN,DESSERT,BEVERAGE';
        if (!settingsMap['PAYMENT_METHODS']) settingsMap['PAYMENT_METHODS'] = 'CASH,CARD,EWALLET';
        if (!settingsMap['DEFAULT_RESERVATION_DURATION']) settingsMap['DEFAULT_RESERVATION_DURATION'] = '90';

        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error('Error fetching public settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
