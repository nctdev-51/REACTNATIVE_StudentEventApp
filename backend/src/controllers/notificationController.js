const Notification = require("../models/Notification");
const { createAndDeliverNotification } = require("../services/notificationService");

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private / Public (with userId query)
const getNotifications = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching notifications",
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id
// @access  Private
const markAsRead = async (req, res) => {
  try {
    if (!String(req.params.id || "").match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (System / Admin)
const createNotification = async (req, res) => {
  try {
    const { userId, title, body, category, isUrgent, eventId } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "userId, title and body are required",
      });
    }
    const notification = await createAndDeliverNotification({
      userId,
      title: String(title).trim(),
      body: String(body).trim(),
      category: category || "reminder",
      isUrgent: !!isUrgent,
      eventId: eventId || null,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
};
