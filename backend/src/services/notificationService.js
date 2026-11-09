const Notification = require("../models/Notification");
const { sendPushToUser } = require("./pushService");

async function createAndDeliverNotification({ userId, title, body, category = "reminder", isUrgent = false, eventId = null }) {
  const notification = await Notification.create({ userId, title, body, category, isUrgent, eventId });
  try {
    await sendPushToUser(userId, {
      title,
      body,
      urgent: isUrgent,
      data: { notificationId: String(notification._id), eventId: eventId ? String(eventId) : undefined, category },
    });
  } catch (error) {
    // Persisting the in-app notification still succeeds if Expo is temporarily unavailable.
    console.warn("[Push] Delivery request failed:", error.message);
  }
  return notification;
}

module.exports = { createAndDeliverNotification };
