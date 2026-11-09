const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  summarizeEvent,
  getEventQrToken,
  getCalendarIcs,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");
const { auditAdminRequest } = require("../middleware/audit");

router.get("/", getEvents);
router.get("/:id/qr-token", getEventQrToken);
router.get("/:id/calendar.ics", getCalendarIcs);
router.get("/:id", getEventById);
router.post("/", protect, authorize("admin", "organizer"), auditAdminRequest, createEvent);
router.put("/:id", protect, authorize("admin", "organizer"), auditAdminRequest, updateEvent);
router.patch("/:id", protect, authorize("admin", "organizer"), auditAdminRequest, updateEvent);
router.delete("/:id", protect, authorize("admin"), auditAdminRequest, deleteEvent);

// AI summary
router.post("/:id/summarize", summarizeEvent);

module.exports = router;
