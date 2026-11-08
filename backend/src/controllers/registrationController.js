const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Helper: Haversine distance in meters
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// @desc    Get registrations (filtered by userId or eventId)
// @route   GET /api/registrations
// @access  Public / Private
const getRegistrations = async (req, res) => {
  try {
    const { userId, eventId } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (eventId) filter.eventId = eventId;

    const registrations = await Registration.find(filter)
      .populate("eventId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching registrations",
      error: error.message,
    });
  }
};

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
const registerEvent = async (req, res) => {
  try {
    const { eventId, userId, participantRole } = req.body;
    const targetUserId = userId || req.user?._id;

    if (!eventId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "eventId and userId are required",
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check existing registration
    let existing = await Registration.findOne({
      eventId,
      userId: targetUserId,
    });

    if (existing) {
      if (existing.status === "cancelled") {
        existing.status = "registered";
        existing.participantRole = participantRole || "attendee";
        await existing.save();
        return res.status(200).json({
          success: true,
          message: "Re-registered successfully",
          data: existing,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Bạn đã đăng ký sự kiện này rồi",
      });
    }

    const confirmedCount = await Registration.countDocuments({
      eventId,
      status: { $in: ["registered", "checked_in", "completed"] },
    });
    const status = confirmedCount < event.maxSlots ? "registered" : "waitlist";
    const waitlistPosition = status === "waitlist"
      ? await Registration.countDocuments({ eventId, status: "waitlist" }) + 1
      : null;
    const registration = await Registration.create({
      eventId,
      userId: targetUserId,
      participantRole: participantRole || "attendee",
      status,
      waitlistPosition,
    });

    await Notification.create({
      userId: targetUserId,
      eventId,
      title: status === "registered" ? "Đăng ký sự kiện thành công" : "Bạn đã vào danh sách chờ",
      body: status === "registered"
        ? `Bạn đã đăng ký tham gia '${event.title}' thành công.`
        : `'${event.title}' đã đủ chỗ. Vị trí chờ của bạn là ${waitlistPosition}.`,
      category: "reminder",
    });

    res.status(201).json({
      success: true,
      message: status === "registered" ? "Đăng ký sự kiện thành công" : "Đã thêm vào danh sách chờ",
      data: registration,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Persist a student's check-in appeal when camera or GPS fails
// @route   POST /api/registrations/appeal
const submitAppeal = async (req, res) => {
  try {
    const { eventId, userId, studentId, studentName, reason, proofImageUrl } = req.body;
    if (!eventId || !reason) return res.status(400).json({ success: false, message: "eventId and reason are required" });
    let user = userId ? await User.findById(userId) : null;
    if (!user && studentId) user = await User.findOne({ studentId });
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên" });

    const registration = await Registration.findOneAndUpdate(
      { eventId, userId: user._id },
      {
        $setOnInsert: { participantRole: "attendee", status: "registered" },
        $set: {
          appeal: { reason, proofImageUrl, status: "pending" },
          note: `Khiếu nại của ${studentName || user.name}`,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );
    res.status(201).json({ success: true, message: "Đã gửi khiếu nại điểm danh", data: registration });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update registration status (e.g., check_in, cancelled)
// @route   PATCH /api/registrations/:id
// @access  Private
const updateRegistration = async (req, res) => {
  try {
    const { status, checkInTime } = req.body;
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (status) registration.status = status;
    if (checkInTime) registration.checkInTime = new Date(checkInTime);
    if (status === "checked_in" && !registration.checkInTime) {
      registration.checkInTime = new Date();
    }

    await registration.save();

    // If checked in, reward training points to user
    if (status === "checked_in") {
      const event = await Event.findById(registration.eventId);
      if (event && event.trainingPoints) {
        await User.findByIdAndUpdate(registration.userId, {
          $inc: { point: event.trainingPoints },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đăng ký thành công",
      data: registration,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    QR Check-in endpoint với Dynamic QR (JWT) & GPS Haversine Anti-Fraud
// @route   POST /api/registrations/check-in
// @access  Public / Private
const checkIn = async (req, res) => {
  try {
    const { eventId, userId, studentId, userLocation, method, passcode, token } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Mã sự kiện (eventId) không được để trống",
      });
    }

    let event = null;
    try {
      event = await Event.findById(eventId);
    } catch {
      // Bỏ qua lỗi định dạng ObjectId MongoDB
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại hoặc đã bị hủy",
      });
    }

    let finalMethod = method || "qr_scan";
    const secret = process.env.JWT_SECRET || "studenteventapp_secret_key_2026";

    // 1. Bảo mật: Xác thực Dynamic QR Token (Chữ ký JWT 45s)
    if (token) {
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded.eventId !== event._id.toString()) {
          return res.status(400).json({
            success: false,
            message: "Mã QR bảo mật không khớp với sự kiện này!",
          });
        }
        finalMethod = "dynamic_qr";
      } catch (tokenErr) {
        if (tokenErr.name === "TokenExpiredError") {
          return res.status(403).json({
            success: false,
            isExpired: true,
            message:
              "Mã QR bảo mật đã hết hạn! Vui lòng quét mã QR mới đang chiếu trên màn hình (mã đổi mới mỗi 45s để chống chụp ảnh gửi người khác).",
          });
        }
        return res.status(400).json({
          success: false,
          message: "Chữ ký mã QR không hợp lệ hoặc đã bị can thiệp trái phép!",
        });
      }
    }

    // 2. Cơ chế cứu nguy / Fallback: Passcode dự phòng do BTC công bố
    if (method === "passcode" || passcode) {
      const expectedPasscode = event.checkInPasscode || "889900";
      if (String(passcode).trim() !== String(expectedPasscode).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Mã PIN dự phòng (Passcode) không chính xác. Vui lòng kiểm tra lại trên màn chiếu hội trường.",
        });
      }
      finalMethod = "passcode";
    } else {
      // 3. Cơ chế GPS Anti-Fraud & Khoảng cách Haversine
      if (event.coordinates && event.coordinates.latitude && event.coordinates.longitude) {
        if (!userLocation || userLocation.latitude === undefined || userLocation.longitude === undefined) {
          return res.status(400).json({
            success: false,
            message:
              "Sự kiện này yêu cầu xác thực vị trí (GPS) để chống check-in giả mạo. Vui lòng cấp quyền vị trí trên thiết bị hoặc dùng mã Passcode dự phòng.",
          });
        }

        // a. Kiểm tra Mock Location / Fake GPS
        if (userLocation.isMockLocation === true || userLocation.mocked === true) {
          return res.status(403).json({
            success: false,
            message: "Gian lận vị trí (Mock GPS) bị phát hiện! Hệ thống từ chối điểm danh tự động.",
            isLocationError: true,
            antiFraudTriggered: true,
          });
        }

        // b. Kiểm tra sai số GPS (Indoor GPS Drift)
        if (typeof userLocation.accuracy === "number" && userLocation.accuracy > 150) {
          return res.status(403).json({
            success: false,
            message: `Độ chính xác GPS không đủ tin cậy (sai số ${Math.round(userLocation.accuracy)}m > 150m). Vui lòng di chuyển ra nơi thoáng hoặc sử dụng mã Passcode dự phòng.`,
            isLocationError: true,
          });
        }

        // c. Tính khoảng cách Haversine
        const distance = calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          event.coordinates.latitude,
          event.coordinates.longitude
        );

        const MAX_ALLOWED_DISTANCE_METERS = event.coordinates.radiusMeters || 500;
        if (distance > MAX_ALLOWED_DISTANCE_METERS) {
          const distText = distance < 1000 ? distance + "m" : (distance / 1000).toFixed(1) + "km";
          return res.status(403).json({
            success: false,
            message: `Vị trí không hợp lệ! Bạn đang cách địa điểm sự kiện ${distText} (vượt quá bán kính cho phép ${MAX_ALLOWED_DISTANCE_METERS}m). Vui lòng có mặt tại địa điểm hoặc liên hệ BTC.`,
            distanceMeters: distance,
            isLocationError: true,
          });
        }
      }
    }

    // 4. Xác định thông tin người dùng
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch {}
    }
    if (!user && studentId) {
      user = await User.findOne({ studentId });
    }
    if (!user && req.user) {
      user = req.user;
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // 5. Kiểm tra và cập nhật bản ghi Registration
    let registration = await Registration.findOne({
      eventId: event._id,
      userId: user._id,
    });

    const distanceMeters =
      userLocation && event.coordinates?.latitude
        ? calculateDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            event.coordinates.latitude,
            event.coordinates.longitude
          )
        : null;

    if (!registration) {
      registration = await Registration.create({
        eventId: event._id,
        userId: user._id,
        status: "checked_in",
        checkInMethod: finalMethod,
        userLocation: userLocation
          ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              distanceMeters,
              accuracy: userLocation.accuracy,
              verified: true,
            }
          : undefined,
        checkInTime: new Date(),
      });
    } else {
      if (registration.status === "checked_in") {
        return res.status(200).json({
          success: true,
          message: "Sinh viên đã điểm danh sự kiện này trước đó",
          alreadyCheckedIn: true,
          data: {
            registration,
            event,
            user,
            distanceMeters,
            checkInMethod: registration.checkInMethod || finalMethod,
          },
        });
      }
      registration.status = "checked_in";
      registration.checkInMethod = finalMethod;
      registration.checkInTime = new Date();
      if (userLocation) {
        registration.userLocation = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          distanceMeters,
          accuracy: userLocation.accuracy,
          verified: true,
        };
      }
      await registration.save();
    }

    // 6. Cộng điểm rèn luyện
    if (event.trainingPoints > 0) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { point: event.trainingPoints },
      });
    }

    res.status(200).json({
      success: true,
      message: "Điểm danh thành công!",
      data: {
        registration,
        event,
        user,
        locationVerified: !!userLocation,
        distanceMeters,
        checkInMethod: finalMethod,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý điểm danh: " + error.message,
    });
  }
};

module.exports = {
  getRegistrations,
  registerEvent,
  updateRegistration,
  checkIn,
  submitAppeal,
};
