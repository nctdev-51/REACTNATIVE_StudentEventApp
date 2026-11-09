const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const { createAndDeliverNotification } = require("../services/notificationService");
const seedEvents = require("../data/seedEvents");
const jwt = require("jsonwebtoken");
const {
  renumberWaitlist,
  promoteNextWaitlistIfSlotAvailable,
} = require("../services/waitlistService");

// Helper: Extract userId from Authorization Bearer token if protect middleware wasn't mounted
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

const isAdminRequester = async (req) => {
  if (req.user?.role === "admin") return true;
  const tokenUserId = resolveUserIdFromToken(req);
  if (!tokenUserId || !String(tokenUserId).match(/^[0-9a-fA-F]{24}$/)) return false;
  try {
    const requester = await User.findById(tokenUserId).select("role isActive");
    return !!requester && requester.isActive && requester.role === "admin";
  } catch {
    return false;
  }
};

// Helper: Find event in MongoDB or auto-seed from seedEvents if it's a built-in demo event
const findOrSeedEvent = async (eventId) => {
  if (!eventId) return null;
  const cleanId = String(eventId).trim();
  let event = null;
  if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      event = await Event.findById(cleanId);
    } catch {}
  }
  if (!event) {
    const seeded = seedEvents.find(
      (e) => String(e._id) === cleanId || String(e.id) === cleanId
    );
    if (seeded) {
      try {
        const { id, _id, ...rest } = seeded;
        event = await Event.findByIdAndUpdate(
          _id,
          { $setOnInsert: { _id, ...rest } },
          { upsert: true, new: true }
        );
      } catch {
        event = seeded;
      }
    }
  }
  return event;
};

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
    const { userId, eventId, studentId } = req.query;
    const filter = {};

    if (userId) {
      filter.userId = userId;
    } else if (studentId) {
      const matchedUser = await User.findOne({ studentId });
      if (matchedUser) {
        filter.userId = matchedUser._id;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }
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
    const { eventId, userId, studentId, participantRole, status: requestedStatus, checkInMethod, checkInTime, note } = req.body;
    let targetUserId = userId || req.user?._id || resolveUserIdFromToken(req);

    if ((!targetUserId || !String(targetUserId).match(/^[0-9a-fA-F]{24}$/)) && studentId) {
      const userByStudentId = await User.findOne({ studentId });
      if (userByStudentId) targetUserId = userByStudentId._id;
    }

    if (!eventId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "eventId and userId are required",
      });
    }

    // Check if event exists (or auto-seed built-in event)
    const event = await findOrSeedEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const resolvedEventId = event._id || eventId;
    const isAdminManualCreate =
      requestedStatus === "checked_in" &&
      checkInMethod === "admin_manual" &&
      (await isAdminRequester(req));

    if (!isAdminManualCreate) {
      if (["draft", "pending_approval", "cancelled"].includes(event.status)) {
        return res.status(400).json({
          success: false,
          message:
            event.status === "cancelled"
              ? "Sự kiện đã bị hủy, không thể đăng ký."
              : "Sự kiện chưa được mở đăng ký.",
        });
      }
      if (event.status === "registration_closed") {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã đóng cổng đăng ký.",
        });
      }
      if (
        event.status === "completed" ||
        event.status === "past" ||
        (event.time?.end && new Date(event.time.end) <= new Date())
      ) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã kết thúc, không thể đăng ký.",
        });
      }
    }

    // Check existing registration
    let existing = await Registration.findOne({
      eventId: resolvedEventId,
      userId: targetUserId,
    });

    if (existing && existing.status !== "cancelled") {
      return res.status(409).json({
        success: false,
        message:
          existing.status === "checked_in" || existing.status === "completed"
            ? "Bạn đã điểm danh sự kiện này rồi."
            : "Bạn đã đăng ký sự kiện này rồi.",
      });
    }

    if (isAdminManualCreate) {
      const checkedInAt = checkInTime ? new Date(checkInTime) : new Date();
      let saved;
      if (existing && existing.status === "cancelled") {
        saved = await Registration.findOneAndUpdate(
          { _id: existing._id, status: "cancelled" },
          {
            $set: {
              status: "checked_in",
              participantRole: participantRole || "attendee",
              checkInMethod: "admin_manual",
              checkInTime: checkedInAt,
              waitlistPosition: null,
              note: note || "Admin xác nhận tham dự thủ công tại hội trường",
            },
          },
          { new: true }
        );
      } else {
        saved = await Registration.create({
          eventId: resolvedEventId,
          userId: targetUserId,
          participantRole: participantRole || "attendee",
          status: "checked_in",
          checkInMethod: "admin_manual",
          checkInTime: checkedInAt,
          waitlistPosition: null,
          note: note || "Admin xác nhận tham dự thủ công tại hội trường",
        });
      }

      if (saved && event.trainingPoints > 0) {
        await User.findByIdAndUpdate(targetUserId, {
          $inc: { point: event.trainingPoints },
        });
      }

      return res.status(existing ? 200 : 201).json({
        success: true,
        message: "Điểm danh bù thủ công thành công",
        data: saved,
      });
    }

    const maxSlots = typeof event.maxSlots === "number" ? event.maxSlots : 100;
    const waitlistSlots = typeof event.waitlistSlots === "number" ? event.waitlistSlots : 20;

    const [confirmedCount, waitlistCount] = await Promise.all([
      Registration.countDocuments({
        eventId: resolvedEventId,
        status: { $in: ["registered", "checked_in", "completed"] },
      }),
      Registration.countDocuments({
        eventId: resolvedEventId,
        status: "waitlist",
      }),
    ]);

    let status;
    let waitlistPosition = null;
    if (confirmedCount < maxSlots) {
      status = "registered";
    } else if (waitlistCount < waitlistSlots) {
      status = "waitlist";
      waitlistPosition = waitlistCount + 1;
    } else {
      return res.status(409).json({
        success: false,
        message: "Sự kiện đã hết vé chính thức và danh sách chờ!",
      });
    }

    let registration;
    if (existing && existing.status === "cancelled") {
      registration = await Registration.findOneAndUpdate(
        { _id: existing._id, status: "cancelled" },
        {
          $set: {
            status,
            participantRole: participantRole || "attendee",
            waitlistPosition,
            registeredAt: new Date(),
            checkInTime: null,
          },
        },
        { new: true }
      );
      if (!registration) {
        return res.status(409).json({
          success: false,
          message: "Bạn đã đăng ký sự kiện này rồi.",
        });
      }
    } else {
      registration = await Registration.create({
        eventId: resolvedEventId,
        userId: targetUserId,
        participantRole: participantRole || "attendee",
        status,
        waitlistPosition,
      });
    }

    await createAndDeliverNotification({
      userId: targetUserId,
      eventId: resolvedEventId,
      title: status === "registered" ? "Đăng ký sự kiện thành công" : "Bạn đã vào danh sách chờ",
      body:
        status === "registered"
          ? `Bạn đã đăng ký tham gia '${event.title}' thành công.`
          : `'${event.title}' đã đủ chỗ. Vị trí chờ của bạn là #${waitlistPosition}.`,
      category: "reminder",
    });

    res.status(existing ? 200 : 201).json({
      success: true,
      message: status === "registered" ? "Đăng ký sự kiện thành công" : "Đã thêm vào danh sách chờ",
      data: registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Bạn đã đăng ký sự kiện này rồi.",
      });
    }
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
    if (!eventId || !reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: "eventId and reason are required" });
    }
    const event = await findOrSeedEvent(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Sự kiện không tồn tại" });
    }

    const tokenUserId = resolveUserIdFromToken(req);
    const resolvedUserId = userId || req.user?._id || tokenUserId;
    let user = resolvedUserId && String(resolvedUserId).match(/^[0-9a-fA-F]{24}$/)
      ? await User.findById(resolvedUserId)
      : null;
    if (!user && studentId) user = await User.findOne({ studentId });
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên" });

    const existing = await Registration.findOne({
      eventId: event._id || eventId,
      userId: user._id,
    });

    if (!existing || existing.status === "cancelled" || existing.status === "waitlist") {
      return res.status(403).json({
        success: false,
        message: "Chỉ sinh viên đã nằm trong danh sách đăng ký chính thức mới có thể gửi khiếu nại điểm danh.",
      });
    }

    const registration = await Registration.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          appeal: { reason: String(reason).trim(), proofImageUrl, status: "pending" },
          note: `Khiếu nại của ${studentName || user.name}`,
        },
      },
      { new: true, runValidators: true }
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
    const { status, checkInTime, checkInMethod, note } = req.body;
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const previousStatus = registration.status;
    const event = await Event.findById(registration.eventId);

    if (status === "cancelled") {
      if (["checked_in", "completed"].includes(previousStatus)) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy đăng ký sau khi đã điểm danh.",
        });
      }
      if (previousStatus === "cancelled") {
        return res.status(200).json({
          success: true,
          message: "Đăng ký đã được hủy trước đó",
          data: registration,
        });
      }
      if (
        event &&
        (event.status === "completed" ||
          event.status === "past" ||
          (event.time?.end && new Date(event.time.end) <= new Date()))
      ) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã kết thúc, không thể hủy đăng ký.",
        });
      }
      if (event?.cancellationDeadline && new Date() > new Date(event.cancellationDeadline)) {
        return res.status(400).json({
          success: false,
          message: "Đã quá thời hạn cho phép hủy đăng ký sự kiện này.",
        });
      }

      const cancelledReg = await Registration.findOneAndUpdate(
        { _id: req.params.id, status: { $nin: ["cancelled", "checked_in", "completed"] } },
        { $set: { status: "cancelled", waitlistPosition: null } },
        { new: true }
      );
      if (!cancelledReg) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy đăng ký ở trạng thái hiện tại.",
        });
      }

      if (previousStatus === "registered") {
        await promoteNextWaitlistIfSlotAvailable(registration.eventId, event);
      } else if (previousStatus === "waitlist") {
        await renumberWaitlist(registration.eventId);
      }

      return res.status(200).json({
        success: true,
        message: "Hủy đăng ký thành công",
        data: cancelledReg,
      });
    }

    if (status === "checked_in") {
      const isAdminManual = checkInMethod === "admin_manual" && (await isAdminRequester(req));
      if (previousStatus === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Không thể điểm danh đăng ký đã bị hủy.",
        });
      }
      if (previousStatus === "waitlist" && !isAdminManual) {
        return res.status(403).json({
          success: false,
          message: "Sinh viên đang ở danh sách chờ, chưa thể điểm danh.",
        });
      }

      const updateFields = {
        status: "checked_in",
        waitlistPosition: null,
        checkInTime: checkInTime ? new Date(checkInTime) : registration.checkInTime || new Date(),
      };
      if (checkInMethod) updateFields.checkInMethod = checkInMethod;
      if (note !== undefined) updateFields.note = note;

      const updatedReg = await Registration.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $nin: ["checked_in", "completed", "cancelled"] },
        },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedReg) {
        const latest = await Registration.findById(req.params.id);
        return res.status(200).json({
          success: true,
          alreadyCheckedIn: true,
          message: "Sinh viên đã điểm danh sự kiện này trước đó",
          data: latest || registration,
        });
      }

      if (event && event.trainingPoints > 0) {
        await User.findByIdAndUpdate(registration.userId, {
          $inc: { point: event.trainingPoints },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật điểm danh thành công",
        data: updatedReg,
      });
    }

    if (status) registration.status = status;
    if (checkInTime) registration.checkInTime = new Date(checkInTime);
    if (checkInMethod) registration.checkInMethod = checkInMethod;
    if (note !== undefined) registration.note = note;

    await registration.save();

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

    const event = await findOrSeedEvent(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại hoặc đã bị hủy",
      });
    }

    if (["draft", "pending_approval", "cancelled"].includes(event.status)) {
      return res.status(403).json({
        success: false,
        message:
          event.status === "cancelled"
            ? "Sự kiện đã bị hủy, cổng điểm danh đã đóng."
            : "Sự kiện chưa được phát hành để điểm danh.",
      });
    }

    if (
      event.status === "completed" ||
      event.status === "past" ||
      (event.time?.end && new Date(event.time.end) <= new Date())
    ) {
      return res.status(403).json({
        success: false,
        message: "Sự kiện đã kết thúc thời gian diễn ra. Cổng điểm danh đã đóng.",
      });
    }

    let finalMethod = method || "qr_scan";
    const secret = process.env.JWT_SECRET || "studenteventapp_secret_key_2026";

    // A GPS position alone is never proof of attendance. Automatic check-in
    // must originate from a currently displayed, signed QR code. The only
    // exception is the organiser's passcode fallback below.
    if (!token && method !== "passcode" && !passcode) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng quét mã QR đang hiển thị tại sự kiện trước khi điểm danh.",
      });
    }

    // 1. Bảo mật: Xác thực Dynamic QR Token (Chữ ký JWT 45s)
    if (token) {
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded.eventId !== event._id.toString() || (decoded.type && decoded.type !== "dynamic_qr")) {
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
      if (!passcode || String(passcode).trim() !== String(expectedPasscode).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Mã PIN dự phòng (Passcode) không chính xác. Vui lòng kiểm tra lại trên màn chiếu hội trường.",
        });
      }
      finalMethod = "passcode";
    } else {
      // 3. Cơ chế GPS Anti-Fraud & Khoảng cách Haversine
      if (event.coordinates && event.coordinates.latitude != null && event.coordinates.longitude != null) {
        const lat = Number(userLocation?.latitude);
        const lon = Number(userLocation?.longitude);
        if (!userLocation || !Number.isFinite(lat) || !Number.isFinite(lon)) {
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
          lat,
          lon,
          event.coordinates.latitude,
          event.coordinates.longitude
        );

        const MAX_ALLOWED_DISTANCE_METERS = event.coordinates.radiusMeters || 500;
        if (!Number.isFinite(distance) || distance > MAX_ALLOWED_DISTANCE_METERS) {
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

    // 4. Xác định thông tin người dùng (ưu tiên req.body.userId, JWT token, req.user, studentId)
    const tokenUserId = resolveUserIdFromToken(req);
    const candidateUsers = [];
    const seenUserIds = new Set();

    const addCandidateUser = (u) => {
      if (u && u._id && !seenUserIds.has(String(u._id))) {
        seenUserIds.add(String(u._id));
        candidateUsers.push(u);
      }
    };

    if (userId && String(userId).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        addCandidateUser(await User.findById(userId));
      } catch {}
    }
    if (tokenUserId && String(tokenUserId).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        addCandidateUser(await User.findById(tokenUserId));
      } catch {}
    }
    if (req.user) {
      addCandidateUser(req.user);
    }
    if (studentId) {
      try {
        addCandidateUser(await User.findOne({ studentId }));
      } catch {}
    }
    if (candidateUsers.length === 0) {
      addCandidateUser(await User.findOne());
    }

    if (candidateUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // 5. Kiểm tra và cập nhật bản ghi Registration
    let user = candidateUsers[0];
    let registration = null;

    for (const candidate of candidateUsers) {
      const foundActive = await Registration.findOne({
        eventId: event._id,
        userId: candidate._id,
        status: { $ne: "cancelled" },
      }).sort({ createdAt: -1 });
      if (foundActive) {
        user = candidate;
        registration = foundActive;
        break;
      }
    }

    if (!registration) {
      registration = await Registration.findOne({
        eventId: event._id,
        userId: user._id,
      }).sort({ createdAt: -1 });
    }

    const distanceMeters =
      userLocation &&
      Number.isFinite(Number(userLocation.latitude)) &&
      Number.isFinite(Number(userLocation.longitude)) &&
      event.coordinates?.latitude != null
        ? calculateDistanceMeters(
            Number(userLocation.latitude),
            Number(userLocation.longitude),
            event.coordinates.latitude,
            event.coordinates.longitude
          )
        : null;

    if (!registration || registration.status === "cancelled") {
      return res.status(403).json({
        success: false,
        notRegistered: true,
        message: "Bạn chưa đăng ký tham gia sự kiện này hoặc đã hủy đăng ký.",
      });
    } else if (registration.status === "waitlist") {
      return res.status(403).json({
        success: false,
        isWaitlist: true,
        message: "Bạn đang ở trong danh sách chờ (Waitlist). Chỉ sinh viên trong danh sách chính thức mới được phép điểm danh.",
      });
    } else if (registration.status === "checked_in" || registration.status === "completed") {
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

    const checkInUpdate = {
      status: "checked_in",
      checkInMethod: finalMethod,
      checkInTime: new Date(),
    };
    if (
      userLocation &&
      Number.isFinite(Number(userLocation.latitude)) &&
      Number.isFinite(Number(userLocation.longitude))
    ) {
      checkInUpdate.userLocation = {
        latitude: Number(userLocation.latitude),
        longitude: Number(userLocation.longitude),
        distanceMeters,
        accuracy: userLocation.accuracy,
        verified: true,
      };
    }

    // Atomic state transition prevents double-awarding points under concurrent QR scans
    const checkedInReg = await Registration.findOneAndUpdate(
      {
        _id: registration._id,
        status: { $nin: ["checked_in", "completed", "cancelled", "waitlist"] },
      },
      { $set: checkInUpdate },
      { new: true }
    );

    if (!checkedInReg) {
      const latestReg = await Registration.findById(registration._id);
      return res.status(200).json({
        success: true,
        message: "Sinh viên đã điểm danh sự kiện này trước đó",
        alreadyCheckedIn: true,
        data: {
          registration: latestReg || registration,
          event,
          user,
          distanceMeters,
          checkInMethod: latestReg?.checkInMethod || finalMethod,
        },
      });
    }

    // 6. Cộng điểm rèn luyện (chỉ 1 lần duy nhất khi atomic transition thành công)
    if (event.trainingPoints > 0) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { point: event.trainingPoints },
      });
    }

    res.status(200).json({
      success: true,
      message: "Điểm danh thành công!",
      data: {
        registration: checkedInReg,
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
