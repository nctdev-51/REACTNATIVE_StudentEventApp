const Feedback = require("../models/Feedback");

// @desc    Get feedbacks by eventId
// @route   GET /api/feedbacks
// @access  Public
const getFeedbacks = async (req, res) => {
  try {
    const { eventId, userId } = req.query;
    const filter = {};
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;

    const feedbacks = await Feedback.find(filter)
      .populate("userId", "name avatar studentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching feedbacks",
      error: error.message,
    });
  }
};

// @desc    Create new feedback
// @route   POST /api/feedbacks
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment, userId } = req.body;
    const targetUserId = userId || req.user?._id;

    if (!eventId || !rating) {
      return res.status(400).json({
        success: false,
        message: "eventId and rating are required",
      });
    }

    const feedback = await Feedback.create({
      eventId,
      userId: targetUserId,
      rating,
      comment: comment || "",
    });

    res.status(201).json({
      success: true,
      message: "Gửi đánh giá thành công",
      data: feedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getFeedbacks,
  createFeedback,
};
