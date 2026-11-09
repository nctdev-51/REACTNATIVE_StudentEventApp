const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");
const jwt = require("jsonwebtoken");

const resolveUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_SECRET || "studenteventapp_secret_key_2026";
      const decoded = jwt.verify(token, secret);
      if (decoded?.tokenType === "refresh") return null;
      return decoded?.id || decoded?._id || null;
    }
  } catch {
    return null;
  }
  return null;
};

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
// @access  Private / Student with attendance check
const createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment, userId } = req.body;
    const targetUserId = userId || req.user?._id || resolveUserIdFromToken(req);

    if (!eventId || !targetUserId || rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: "eventId, userId and rating are required",
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Số sao đánh giá phải là số nguyên từ 1 đến 5",
      });
    }

    const attendedReg = await Registration.findOne({
      eventId,
      userId: targetUserId,
      status: { $in: ["checked_in", "completed"] },
    });

    if (!attendedReg) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể đánh giá sự kiện sau khi đã điểm danh tham gia!",
      });
    }

    const existing = await Feedback.findOne({
      eventId,
      userId: targetUserId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Mỗi sự kiện chỉ được đánh giá 1 lần!",
      });
    }

    const feedback = await Feedback.create({
      eventId,
      userId: targetUserId,
      rating: numericRating,
      comment: String(comment || "").trim(),
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
