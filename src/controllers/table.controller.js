const pool = require("../config/db");

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const createTable = async (req, res) => {
    try {
        const { label, capacity, status } = req.body;
        const tableStatus = status ? status.toLowerCase() : 'available';

        const existingTable = await pool.query('SELECT * FROM tables WHERE label = $1', [label]);
        if (existingTable.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Table already exists" });
        }
        const result = await pool.query(
            'INSERT INTO tables (label, capacity, status) VALUES ($1, $2, $3) RETURNING *',
            [label, capacity, tableStatus]
        );
        const createdTable = result.rows[0];
        createdTable.status = capitalize(createdTable.status);
        res.status(201).json({ success: true, message: "Table created", table: { ...createdTable, _id: createdTable.table_id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTables = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tables ORDER BY table_id ASC');
        // Map table_id to _id for frontend compatibility
        const tables = result.rows.map(t => ({ ...t, _id: t.table_id, status: capitalize(t.status) }));
        res.status(200).json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, capacity, status } = req.body;
        
        let query = 'UPDATE tables SET ';
        const values = [];
        let index = 1;
        
        if (label) { query += `label = $${index}, `; values.push(label); index++; }
        if (capacity) { query += `capacity = $${index}, `; values.push(capacity); index++; }
        if (status) { 
            const newStatus = status.toLowerCase();
            query += `status = $${index}, `; values.push(newStatus); index++; 
            
            if (newStatus === 'cleaning' || newStatus === 'available') {
                const activeRes = await pool.query(
                    "SELECT * FROM reservations WHERE table_id = $1 AND status = 'seated'",
                    [id]
                );
                for (const r of activeRes.rows) {
                    const pad = (n) => n.toString().padStart(2, '0');
                    const dbDateStr = `${r.date.getFullYear()}-${pad(r.date.getMonth() + 1)}-${pad(r.date.getDate())}`;
                    const start = new Date(`${dbDateStr}T${r.start_time}`);
                    let elapsedMins = Math.floor((Date.now() - start.getTime()) / 60000);
                    if (elapsedMins < 1) elapsedMins = 1;
                    
                    await pool.query(
                        "UPDATE reservations SET duration = $1, status = 'completed' WHERE reservation_id = $2",
                        [elapsedMins, r.reservation_id]
                    );
                }
            }
        }
        
        query = query.slice(0, -2); // remove last comma
        query += ` WHERE table_id = $${index} RETURNING *`;
        values.push(id);
        
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Table not found" });

        const table = result.rows[0];

        table.status = capitalize(table.status);
        res.status(200).json({ success: true, message: "Table updated", table: { ...table, _id: table.table_id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        // Unlink from history to prevent foreign key constraint violations
        await pool.query('UPDATE reservations SET table_id = NULL WHERE table_id = $1', [id]);
        await pool.query('UPDATE orders SET table_id = NULL WHERE table_id = $1', [id]);
        
        const result = await pool.query('DELETE FROM tables WHERE table_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Table not found" });
        res.status(200).json({ success: true, message: "Table deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createTable, getTables, updateTable, deleteTable };
