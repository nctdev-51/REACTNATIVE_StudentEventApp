const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  createNotification,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.patch("/:id", markAsRead);
router.post("/", createNotification);

module.exports = router;
