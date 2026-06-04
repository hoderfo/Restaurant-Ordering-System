const express = require("express");
const router = express.Router();
const { createTable, getTables, updateTable, deleteTable } = require("../controllers/table.controller");
const { authenticateToken } = require("../middleware/auth");
const { requireRole, ROLES } = require("../middleware/rbac");

// All routes protected by Auth
router.use(authenticateToken);

router.get("/", getTables); 
router.post("/", requireRole(ROLES.MANAGEMENT), createTable);
router.put("/:id", requireRole(ROLES.FLOOR_AND_MANAGEMENT), updateTable);
router.delete("/:id", requireRole(ROLES.MANAGEMENT), deleteTable);

module.exports = router;
