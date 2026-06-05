const express = require("express");
const router = express.Router();
const { createReservation, getReservations, cancelReservation, checkInReservation, markNoShow } = require("../controllers/reservation.controller");
const { authenticateToken } = require("../middleware/auth");
const { requireRole, ROLES } = require("../middleware/rbac");

router.use(authenticateToken);

router.get("/", requireRole(ROLES.FLOOR_AND_MANAGEMENT), getReservations);
router.post("/", requireRole(ROLES.FLOOR_AND_MANAGEMENT), createReservation);
router.put("/:id/cancel", requireRole(ROLES.FLOOR_AND_MANAGEMENT), cancelReservation);
router.put("/:id/checkin", requireRole(ROLES.FLOOR_AND_MANAGEMENT), checkInReservation);
router.put("/:id/noshow", requireRole(ROLES.FLOOR_AND_MANAGEMENT), markNoShow);


module.exports = router;
