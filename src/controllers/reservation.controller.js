const prisma = require("../config/db");

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const pad = (n) => n.toString().padStart(2, '0');
const getLocalDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const BUFFER_TIME_MINS = 15;

const findBestFitTable = async (guests, requestedStartTime, requestedEndTime, requireAvailableNow = false) => {
    let tables = await prisma.table.findMany({
        where: {
            capacity: { gte: guests },
            isActive: true,
            ...(requireAvailableNow ? { status: 'AVAILABLE' } : {})
        },
        orderBy: [
            { capacity: 'asc' }
        ]
    });


    tables.sort((a, b) => {
        if (a.capacity === b.capacity) {
            const numA = parseInt(a.label.replace(/\D/g, ''), 10);
            const numB = parseInt(b.label.replace(/\D/g, ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.label.localeCompare(b.label);
        }
        return 0; // capacity is already sorted correctly by Prisma
    });

    for (const table of tables) {
        const reqDateStr = getLocalDateString(requestedStartTime);
        const reqDate = new Date(`${reqDateStr}T00:00:00.000Z`);

        const dayReservations = await prisma.reservation.findMany({
            where: {
                tableId: table.id,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                date: {
                    gte: reqDate,
                    lt: new Date(reqDate.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        let hasOverlap = false;
        for (const res of dayReservations) {
            const start = new Date(res.startTime);
            const end = new Date(start.getTime() + res.duration * 60000);

            if (start < requestedEndTime && end > requestedStartTime) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            return { ...table, _id: table.id, name: table.label };
        }
    }
    return null;
};

const createReservation = async (req, res) => {
    try {
        const { bookedBy, contact, date, tableId, overrideWarningConfirmed, notes } = req.body;

        const guests = parseInt(req.body.guests, 10) || 1;
        const duration = parseInt(req.body.duration, 10) || 90;

        const startTime = new Date(date);
        const endTime = new Date(startTime.getTime() + (duration * 60000));

        const bufferedStartTime = new Date(startTime.getTime() - (BUFFER_TIME_MINS * 60000));
        const bufferedEndTime = new Date(endTime.getTime() + (BUFFER_TIME_MINS * 60000));

        let assignedTable = null;

        if (tableId) {
            const table = await prisma.table.findUnique({ where: { id: parseInt(tableId) } });
            if (!table || !table.isActive) {
                return res.status(404).json({ success: false, message: `Selected table not found.` });
            }
            assignedTable = { ...table, _id: table.id, name: table.label };

            if (guests > assignedTable.capacity) {
                if (!overrideWarningConfirmed) {
                    return res.status(409).json({
                        success: false,
                        message: `Capacity Warning: Party size (${guests}) exceeds Table ${assignedTable.name}'s capacity (${assignedTable.capacity}). Do you want to proceed and squeeze them in?`,
                        requiresOverride: true
                    });
                }
            }

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

            const reqDateStr = getLocalDateString(bufferedStartTime);
            const reqDate = new Date(`${reqDateStr}T00:00:00.000Z`);

            const overlapReservations = await prisma.reservation.findMany({
                where: {
                    tableId: assignedTable.id,
                    date: {
                        gte: reqDate,
                        lt: new Date(reqDate.getTime() + 24 * 60 * 60 * 1000)
                    },
                    status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] }
                }
            });

            let overlapping = null;
            for (let resRec of overlapReservations) {
                const start = new Date(resRec.startTime);
                const end = new Date(start.getTime() + resRec.duration * 60000);
                if (start < bufferedEndTime && end > bufferedStartTime) {
                    overlapping = { ...resRec, start, end };
                    break;
                }
            }

            if (overlapping) {
                const isStartingSoon = (bufferedStartTime.getTime() - Date.now()) < 30 * 60000;
                const alternativeTable = await findBestFitTable(guests, bufferedStartTime, bufferedEndTime, isStartingSoon);

                let suggestedTime = null;
                if (!alternativeTable || alternativeTable._id === assignedTable._id) {
                    suggestedTime = new Date(overlapping.end.getTime() + BUFFER_TIME_MINS * 60000);
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
                        message: `The table is booked. It is available later at ${suggestedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Book it for this time instead?`,
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

        const isWalkIn = req.body.isWalkIn === true;
        const initialStatus = isWalkIn ? 'SEATED' : 'PENDING';

        const reqDateStr = getLocalDateString(startTime);
        const reqDate = new Date(`${reqDateStr}T00:00:00.000Z`);

        const createdByUserId = req.user?.user_id ? parseInt(req.user.user_id) : 1; // Fallback to 1 if not set in some environments

        const reservation = await prisma.reservation.create({
            data: {
                tableId: assignedTable.id,
                customerName: bookedBy,
                phone: contact,
                partySize: guests,
                date: reqDate,
                startTime: startTime,
                duration: duration,
                notes: notes || null,
                status: initialStatus,
                createdById: createdByUserId
            }
        });

        if (isWalkIn) {
            await prisma.table.update({
                where: { id: assignedTable.id },
                data: { status: 'OCCUPIED' }
            });

            if (req.app.locals.io) {
                req.app.locals.io.emit('table:updated', { id: assignedTable.id, status: 'Occupied' });
            }
        }

        const mappedReservation = {
            ...reservation,
            status: capitalize(reservation.status),
            _id: reservation.id,
            bookedBy: reservation.customerName,
            contact: reservation.phone,
            guests: reservation.partySize,
            startTime: reservation.startTime
        };

        if (req.app.locals.io) {
            req.app.locals.io.emit('reservation:created', mappedReservation);
        }

        res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            reservation: mappedReservation,
            table: assignedTable
        });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getReservations = async (req, res) => {
    try {
        const reservationsData = await prisma.reservation.findMany({
            include: {
                table: { select: { label: true, capacity: true } }
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });

        const reservations = reservationsData.map(r => ({
            ...r,
            status: capitalize(r.status),
            _id: r.id,
            table: { _id: r.tableId, name: r.table.label, capacity: r.table.capacity },
            bookedBy: r.customerName,
            contact: r.phone,
            guests: r.partySize,
            startTime: r.startTime
        }));

        res.status(200).json({ success: true, reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.user_id ? parseInt(req.user.user_id) : null;

        const reservation = await prisma.reservation.update({
            where: { id: parseInt(id) },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledById: userId
            }
        });

        reservation.status = capitalize(reservation.status);

        if (req.app.locals.io) {
            req.app.locals.io.emit('reservation:updated', { ...reservation, _id: reservation.id });
        }

        res.status(200).json({ success: true, message: "Reservation cancelled", reservation: { ...reservation, _id: reservation.id } });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: "Reservation not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const checkInReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await prisma.reservation.update({
            where: { id: parseInt(id) },
            data: { status: 'SEATED' }
        });

        reservation.status = capitalize(reservation.status);

        await prisma.table.update({
            where: { id: reservation.tableId },
            data: { status: 'OCCUPIED' }
        });

        if (req.app.locals.io) {
            req.app.locals.io.emit('table:updated', { id: reservation.tableId, status: 'Occupied' });
            req.app.locals.io.emit('reservation:updated', { ...reservation, _id: reservation.id });
        }

        res.status(200).json({ success: true, message: "Guest checked in", reservation: { ...reservation, _id: reservation.id } });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: "Reservation not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const markNoShow = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.user_id ? parseInt(req.user.user_id) : null;

        const reservation = await prisma.reservation.update({
            where: { id: parseInt(id) },
            data: {
                status: 'NO_SHOW',
                cancelledAt: new Date(),
                cancelledById: userId
            }
        });

        reservation.status = capitalize(reservation.status);

        if (req.app.locals.io) {
            req.app.locals.io.emit('reservation:updated', { ...reservation, _id: reservation.id });
        }

        res.status(200).json({ success: true, message: "Reservation marked as No-Show", reservation: { ...reservation, _id: reservation.id } });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: "Reservation not found" });
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createReservation, getReservations, cancelReservation, checkInReservation, markNoShow };
