const prisma = require("../config/db");

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const createTable = async (req, res) => {
    try {
        const { label, capacity, status } = req.body;
        const tableStatus = status ? status.toUpperCase() : 'AVAILABLE';

        const existingTable = await prisma.table.findUnique({ where: { label } });
        if (existingTable) {
            return res.status(400).json({ success: false, message: "Table already exists" });
        }
        const createdTable = await prisma.table.create({
            data: { label, capacity: parseInt(capacity), status: tableStatus }
        });

        createdTable.status = capitalize(createdTable.status);
        
        if (req.app.locals.io) {
            req.app.locals.io.emit('table:created', { ...createdTable, _id: createdTable.id });
        }

        res.status(201).json({ success: true, message: "Table created", table: { ...createdTable, _id: createdTable.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTables = async (req, res) => {
    try {
        const tablesResult = await prisma.table.findMany({ 
            where: { isActive: true },
            orderBy: { id: 'asc' } 
        });
        // Map id to _id for frontend compatibility
        const tables = tablesResult.map(t => ({ ...t, _id: t.id, status: capitalize(t.status) }));
        res.status(200).json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, capacity, status } = req.body;
        const data = {};

        if (label) data.label = label;
        if (capacity) data.capacity = parseInt(capacity);

        if (status) {
            data.status = status.toUpperCase();

            if (data.status === 'CLEANING' || data.status === 'AVAILABLE') {
                const activeRes = await prisma.reservation.findMany({
                    where: { tableId: parseInt(id), status: 'SEATED' }
                });

                for (const r of activeRes) {
                    const elapsedMins = Math.max(1, Math.floor((Date.now() - new Date(r.startTime).getTime()) / 60000));
                    await prisma.reservation.update({
                        where: { id: r.id },
                        data: { duration: elapsedMins, status: 'COMPLETED' } // Note: Assuming COMPLETED is a valid status, else check schema.
                    });
                }
            }
        }

        const table = await prisma.table.update({
            where: { id: parseInt(id) },
            data
        });

        table.status = capitalize(table.status);
        
        if (req.app.locals.io) {
            req.app.locals.io.emit('table:updated', { ...table, _id: table.id });
        }

        res.status(200).json({ success: true, message: "Table updated", table: { ...table, _id: table.id } });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: "Table not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        const tableId = parseInt(id);

        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) return res.status(404).json({ success: false, message: "Table not found" });

        if (table.status === 'OCCUPIED' || table.status === 'CLEANING') {
            return res.status(400).json({ success: false, message: "Cannot delete an occupied or cleaning table. Please clear the table first." });
        }

        const activeReservations = await prisma.reservation.findMany({
            where: { 
                tableId: tableId, 
                date: { gte: new Date(new Date().setHours(0,0,0,0)) },
                status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] }
            }
        });

        if (activeReservations.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete this table because it has upcoming reservations." });
        }

        await prisma.table.update({ 
            where: { id: tableId },
            data: { isActive: false }
        });
        
        if (req.app.locals.io) {
            req.app.locals.io.emit('table:deleted', { tableId: tableId });
        }

        res.status(200).json({ success: true, message: "Table deleted" });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: "Table not found" });
        if (error.code === 'P2003' || (error.message && error.message.includes('violates foreign key constraint'))) {
            return res.status(400).json({ success: false, message: "Cannot delete this table because it has associated orders or reservations. Please mark it as INACTIVE instead to preserve history." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createTable, getTables, updateTable, deleteTable };
