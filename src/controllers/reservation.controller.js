const pool = require("../config/db");

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const pad = (n) => n.toString().padStart(2, '0');
const getLocalDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Best-Fit Algorithm to find the optimal table
const findBestFitTable = async (guests, requestedStartTime, requestedEndTime, requireAvailableNow = false) => {
    let query = 'SELECT * FROM tables WHERE capacity >= $1';
    const params = [guests];

    if (requireAvailableNow) {
        query += " AND status = 'available'";
    }

    query += ' ORDER BY capacity ASC, length(label) ASC, label ASC'; // Sort fix

    const result = await pool.query(query, params);
    const tables = result.rows;

    for (const table of tables) {
        // Check for overlapping reservations for this table
        const overlapQuery = `
            SELECT * FROM reservations 
            WHERE table_id = $1 
            AND status IN ('pending', 'seated')
            AND date = $2
            AND (start_time + (duration * interval '1 minute')) > $3::time
            AND start_time < $4::time
        `;
        // We need to parse date and time correctly.
        // It's safer to just fetch all active reservations for the day and check in JS if time manipulation is tricky.
        const reqDate = getLocalDateString(requestedStartTime);
        
        const dayResResult = await pool.query(
            "SELECT * FROM reservations WHERE table_id = $1 AND status IN ('pending', 'seated') AND date = $2",
            [table.table_id, reqDate]
        );

        let hasOverlap = false;
        for (const res of dayResResult.rows) {
            // The DB returns date at midnight local time, but toISOString converts it to UTC (which shifts it 1 day back in UTC+7).
            // Using getLocalDateString ensures we extract the local date correctly.
            const dbDateStr = getLocalDateString(res.date);
            const start = new Date(`${dbDateStr}T${res.start_time}`);
            const end = new Date(start.getTime() + res.duration * 60000);
            
            if (start < requestedEndTime && end > requestedStartTime) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            return { ...table, _id: table.table_id, name: table.label }; 
        }
    }
    return null; // No table available
};

const createReservation = async (req, res) => {
    try {
        const { bookedBy, contact, date, tableId, overrideWarningConfirmed, notes } = req.body;
        console.log("CREATE RESERVATION CALLED. req.body:", req.body);
        console.log("tableId value:", tableId, "type:", typeof tableId);
        // Postgres uses customer_name, phone instead of bookedBy, contact.
        
        const guests = parseInt(req.body.guests, 10) || 1;
        const duration = parseInt(req.body.duration, 10) || 90;

        const startTime = new Date(date); // assuming 'date' contains the full timestamp from frontend
        const endTime = new Date(startTime.getTime() + (duration * 60000));
        
        // Include 15-minute buffers
        const bufferedStartTime = new Date(startTime.getTime() - (15 * 60000));
        const bufferedEndTime = new Date(endTime.getTime() + (15 * 60000));

        let assignedTable = null;

        if (tableId) {
            // Manual specific table assignment
            const tableResult = await pool.query('SELECT * FROM tables WHERE table_id = $1', [tableId]);
            if (tableResult.rows.length === 0) {
                console.log("TABLE NOT FOUND IN DB. tableId used:", tableId);
                require('fs').appendFileSync('404_errors.log', `404 Error - tableId used: ${tableId} (type: ${typeof tableId})\n`);
                return res.status(404).json({ success: false, message: `Selected table not found. (tableId sent: ${tableId})` });
            }
            assignedTable = { ...tableResult.rows[0], _id: tableResult.rows[0].table_id, name: tableResult.rows[0].label };

            // Check if it fits (REQ-RTM-05 override check)
            if (assignedTable.capacity > guests) {
                const isStartingSoon = (bufferedStartTime.getTime() - Date.now()) < 30 * 60000;
                const bestFit = await findBestFitTable(guests, bufferedStartTime, bufferedEndTime, isStartingSoon);
                if (bestFit && bestFit._id !== assignedTable._id && bestFit.capacity < assignedTable.capacity) {
                    if (!overrideWarningConfirmed) {
                        return res.status(409).json({ 
                            success: false, 
                            message: `Capacity Warning: Table ${assignedTable.name} seats ${assignedTable.capacity}, but party size is ${guests}. Table ${bestFit.name} (Seats ${bestFit.capacity}) is available. Do you want to proceed?`,
                            requiresOverride: true 
                        });
                    }
                }
            }

            // Verify no overlaps for the manually selected table
            const reqDate = getLocalDateString(bufferedStartTime);
            const dayResResult = await pool.query(
                "SELECT * FROM reservations WHERE table_id = $1 AND status IN ('pending', 'seated') AND date = $2",
                [assignedTable._id, reqDate]
            );

            let overlapping = null;
            for (const r of dayResResult.rows) {
                const dbDateStr = getLocalDateString(r.date);
                const start = new Date(`${dbDateStr}T${r.start_time}`);
                const end = new Date(start.getTime() + r.duration * 60000);
                console.log('DEBUG CHECK:', {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    bufferedStart: bufferedStartTime.toISOString(),
                    bufferedEnd: bufferedEndTime.toISOString()
                });
                if (start < bufferedEndTime && end > bufferedStartTime) {
                    overlapping = { ...r, start, end };
                    break;
                }
            }

            if (overlapping) {
                // Suggest alternative
                const isStartingSoon = (bufferedStartTime.getTime() - Date.now()) < 30 * 60000;
                const alternativeTable = await findBestFitTable(guests, bufferedStartTime, bufferedEndTime, isStartingSoon);
                
                let suggestedTime = null;
                if (!alternativeTable || alternativeTable._id === assignedTable._id) {
                    const nextAvailableTime = new Date(overlapping.end.getTime() + 15 * 60000);
                    suggestedTime = nextAvailableTime;
                }
                
                if (alternativeTable && alternativeTable._id !== assignedTable._id) {
                    return res.status(409).json({
                        success: false,
                        message: `The selected table is already booked. However, Table ${alternativeTable.name} (Seats ${alternativeTable.capacity}) is available! Book Table ${alternativeTable.name} instead?`,
                        requiresOverride: true,
                        suggestedTableId: alternativeTable._id
                    });
                } else if (suggestedTime) {
                    return res.status(409).json({
                        success: false,
                        message: `The table is booked. It is available later at ${suggestedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Book it for this time instead?`,
                        requiresOverride: true,
                        suggestedTableId: assignedTable._id,
                        suggestedTime: suggestedTime.toISOString()
                    });
                } else {
                    return res.status(400).json({ success: false, message: "The selected table is already booked and no alternative tables are available." });
                }
            }
        } else {
            const isStartingSoon = (bufferedStartTime.getTime() - Date.now()) < 30 * 60000;
            assignedTable = await findBestFitTable(guests, bufferedStartTime, bufferedEndTime, isStartingSoon);
            if (!assignedTable) {
                return res.status(400).json({ success: false, message: "No available tables can accommodate this party size for the requested time." });
            }
        }

        const insertQuery = `
            INSERT INTO reservations (table_id, customer_name, phone, party_size, date, start_time, duration, notes, status, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) 
            RETURNING *
        `;
        const insertParams = [
            assignedTable._id,
            bookedBy,
            contact,
            guests,
            getLocalDateString(startTime),
            startTime.toTimeString().split(' ')[0], // HH:MM:SS
            duration,
            notes || null,
            req.user?.user_id || null // from auth middleware
        ];

        const resResult = await pool.query(insertQuery, insertParams);
        const r = resResult.rows[0];

        const mappedReservation = {
            ...r,
            status: capitalize(r.status),
            _id: r.reservation_id,
            bookedBy: r.customer_name,
            contact: r.phone,
            guests: r.party_size,
            startTime: new Date(`${getLocalDateString(r.date)}T${r.start_time}`)
        };

        res.status(201).json({ 
            success: true, 
            message: "Reservation created successfully", 
            reservation: mappedReservation, 
            table: assignedTable 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getReservations = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, t.label as table_label, t.capacity as table_capacity 
            FROM reservations r
            LEFT JOIN tables t ON r.table_id = t.table_id
            ORDER BY r.date ASC, r.start_time ASC
        `);
        const reservations = result.rows.map(r => ({
            ...r,
            status: capitalize(r.status),
            _id: r.reservation_id,
            table: { _id: r.table_id, name: r.table_label, capacity: r.table_capacity },
            bookedBy: r.customer_name,
            contact: r.phone,
            guests: r.party_size,
            startTime: new Date(`${getLocalDateString(r.date)}T${r.start_time}`)
        }));
        res.status(200).json({ success: true, reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE reservations SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1 WHERE reservation_id = $2 RETURNING *",
            [req.user?.user_id || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }
        
        const reservation = result.rows[0];
        reservation.status = capitalize(reservation.status);
        
        // Revert table to available
        await pool.query("UPDATE tables SET status = 'available' WHERE table_id = $1", [reservation.table_id]);

        res.status(200).json({ success: true, message: "Reservation cancelled", reservation: { ...reservation, _id: reservation.reservation_id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const checkInReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE reservations SET status = 'seated' WHERE reservation_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }
        
        const reservation = result.rows[0];
        reservation.status = capitalize(reservation.status);
        await pool.query("UPDATE tables SET status = 'occupied' WHERE table_id = $1", [reservation.table_id]);

        res.status(200).json({ success: true, message: "Guest checked in", reservation: { ...reservation, _id: reservation.reservation_id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const handleWalkIn = async (req, res) => {
    try {
        const { notes, tableId } = req.body;
        const guests = parseInt(req.body.guests, 10) || 1;
        const duration = 90;

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (duration * 60000));
        const bufferedStartTime = new Date(startTime.getTime() - (15 * 60000));
        const bufferedEndTime = new Date(endTime.getTime() + (15 * 60000));

        let assignedTable = null;

        if (tableId) {
            const tableResult = await pool.query('SELECT * FROM tables WHERE table_id = $1', [tableId]);
            if (tableResult.rows.length > 0) {
                assignedTable = { ...tableResult.rows[0], _id: tableResult.rows[0].table_id, name: tableResult.rows[0].label };
            }
        } else {
            assignedTable = await findBestFitTable(guests, bufferedStartTime, bufferedEndTime, true);
        }

        if (!assignedTable) {
            return res.status(400).json({ 
                success: false, 
                message: tableId ? "The selected table is invalid or not found." : "No available table can accommodate this party right now." 
            });
        }

        const insertQuery = `
            INSERT INTO reservations (table_id, customer_name, phone, party_size, date, start_time, duration, notes, status, created_by) 
            VALUES ($1, 'Walk-in Guest', 'N/A', $2, $3, $4, $5, $6, 'seated', $7) 
            RETURNING *
        `;
        const insertParams = [
            assignedTable._id,
            guests,
            getLocalDateString(startTime),
            startTime.toTimeString().split(' ')[0], // HH:MM:SS
            duration,
            notes || "Walk-in assignment",
            req.user?.user_id || null
        ];

        const resResult = await pool.query(insertQuery, insertParams);
        const r = resResult.rows[0];

        const mappedReservation = {
            ...r,
            status: capitalize(r.status),
            _id: r.reservation_id,
            bookedBy: r.customer_name,
            contact: r.phone,
            guests: r.party_size,
            startTime: new Date(`${getLocalDateString(r.date)}T${r.start_time}`)
        };

        await pool.query("UPDATE tables SET status = 'occupied' WHERE table_id = $1", [assignedTable._id]);
        assignedTable.status = 'Occupied';

        res.status(201).json({ 
            success: true, 
            message: "Walk-in guest seated", 
            reservation: mappedReservation, 
            table: assignedTable 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markNoShow = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE reservations SET status = 'no_show', cancelled_at = NOW(), cancelled_by = $1 WHERE reservation_id = $2 RETURNING *",
            [req.user?.user_id || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found" });
        }
        
        const reservation = result.rows[0];
        reservation.status = capitalize(reservation.status);
        
        // Revert table to available
        await pool.query("UPDATE tables SET status = 'available' WHERE table_id = $1", [reservation.table_id]);

        res.status(200).json({ success: true, message: "Reservation marked as No-Show", reservation: { ...reservation, _id: reservation.reservation_id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createReservation, getReservations, cancelReservation, checkInReservation, handleWalkIn, markNoShow };
