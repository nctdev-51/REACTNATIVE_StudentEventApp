const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const controller = require("../controllers/adminController");
const { auditAdminRequest } = require("../middleware/audit");

router.use(protect, authorize("admin"));
router.use(auditAdminRequest);
router.get("/audit-logs", controller.getAuditLogs);
router.patch("/events/:id/quota", controller.updateQuota);
router.post("/events/:id/attendees", controller.addAttendee);
router.delete("/registrations/:id", controller.deleteRegistration);
router.post("/registrations/:id/quick-checkin", controller.quickCheckIn);

module.exports = router;
