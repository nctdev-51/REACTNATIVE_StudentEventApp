const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const controller = require("../controllers/adminController");

router.use(protect, authorize("admin"));
router.patch("/events/:id/quota", controller.updateQuota);
router.post("/events/:id/attendees", controller.addAttendee);
router.delete("/registrations/:id", controller.deleteRegistration);
router.post("/registrations/:id/quick-checkin", controller.quickCheckIn);

module.exports = router;
