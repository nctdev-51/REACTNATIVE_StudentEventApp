const path = require("path");
const fs = require("fs");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults({
  cors: true,
  logger: true,
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "studenteventapp_secret_key_2026";

// ─── Core Middlewares ──────────────────────────────────────────────────────────
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Helper to generate IDs
const generateId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = "xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
    ((Math.random() * 16) | 0).toString(16)
  );
  return (timestamp + random).substring(0, 24);
};

// ─── Real-time SSE Manager (Web Admin Dashboard) ──────────────────────────────
const sseClients = new Set();
const broadcastSSE = (eventType, payload) => {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
};

// Helper: Record Admin Audit Log
const recordAuditLog = (adminId, adminName, action, targetType, targetId, details) => {
  try {
    const logEntry = {
      id: generateId(),
      _id: generateId(),
      adminId: adminId || "66f1a1030000000000000003",
      adminName: adminName || "Ban Quản Trị Đoàn Hội",
      action,
      targetType,
      targetId,
      details: typeof details === "object" ? JSON.stringify(details) : details,
      timestamp: new Date().toISOString(),
    };
    router.db.get("auditLogs").push(logEntry).write();
  } catch (err) {
    console.error("Audit log write error:", err);
  }
};

// Helper: Get user from Authorization header
const getAuthUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = router.db
      .get("users")
      .find((u) => u.id === decoded.id || u._id === decoded.id)
      .value();
    return user || null;
  } catch (err) {
    return null;
  }
};

// ─── Health Check Endpoints ───────────────────────────────────────────────────
server.get(["/", "/api/health"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudentEventApp JSON-Server is running successfully!",
    version: "1.0.0",
    mode: "json-server",
    port: PORT,
    endpoints: [
      "/events",
      "/users",
      "/registrations",
      "/feedbacks",
      "/notifications",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/me",
      "/api/registrations/check-in"
    ],
    timestamp: new Date().toISOString()
  });
});

// ─── Custom Authentication Endpoints ──────────────────────────────────────────
// POST /api/auth/login & /auth/login
server.post(["/api/auth/login", "/auth/login"], (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ email và mật khẩu",
    });
  }

  const user = router.db
    .get("users")
    .find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
    .value();

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Email hoặc mật khẩu không chính xác",
    });
  }

  if (user.isActive === false || user.status === "inactive") {
    return res.status(403).json({
      success: false,
      message: "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt",
    });
  }

  const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  const { password: _, ...userSafe } = user;

  res.status(200).json({
    success: true,
    message: "Đăng nhập thành công",
    data: {
      user: userSafe,
      accessToken,
      refreshToken,
    },
    // Also include user at root for raw compatibility
    user: userSafe,
    token: accessToken,
  });
});

// POST /api/auth/register & /auth/register
server.post(["/api/auth/register", "/auth/register"], (req, res) => {
  const { name, email, password, studentId, role, faculty, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đủ Tên, Email và Mật khẩu",
    });
  }

  const existing = router.db
    .get("users")
    .find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
    .value();

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Email này đã được sử dụng bởi một tài khoản khác",
    });
  }

  const newId = generateId();
  const newUser = {
    id: newId,
    _id: newId,
    studentId: studentId || `SV${Math.floor(1000 + Math.random() * 9000)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    faculty: faculty || "Khoa Công nghệ thông tin",
    point: 0,
    role: role === "organizer" || role === "admin" ? role : "student",
    phone: phone || null,
    avatar: "https://i.pravatar.cc/300?img=12",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
    status: "active",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  router.db.get("users").push(newUser).write();

  const accessToken = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
  const refreshToken = jwt.sign({ id: newUser.id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  const { password: _, ...userSafe } = newUser;

  res.status(201).json({
    success: true,
    message: "Đăng ký tài khoản thành công",
    data: {
      user: userSafe,
      accessToken,
      refreshToken,
    },
    user: userSafe,
    token: accessToken,
  });
});

// GET /api/auth/me & /auth/me
server.get(["/api/auth/me", "/auth/me"], (req, res) => {
  const user = getAuthUser(req) || router.db.get("users").first().value();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thông tin tài khoản",
    });
  }

  const { password: _, ...userSafe } = user;
  res.status(200).json({
    success: true,
    data: { user: userSafe },
    user: userSafe,
  });
});

// PUT /api/auth/me & /auth/me
server.put(["/api/auth/me", "/auth/me"], (req, res) => {
  const currentUser = getAuthUser(req) || router.db.get("users").first().value();
  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập",
    });
  }

  const { name, studentId, avatar, faculty, phone } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (studentId !== undefined) updates.studentId = studentId;
  if (avatar !== undefined) {
    updates.avatar = avatar;
    updates.avatarUrl = avatar;
  }
  if (faculty !== undefined) updates.faculty = faculty;
  if (phone !== undefined) updates.phone = phone;

  router.db
    .get("users")
    .find({ id: currentUser.id })
    .assign(updates)
    .write();

  const updated = router.db.get("users").find({ id: currentUser.id }).value();
  const { password: _, ...userSafe } = updated;

  res.status(200).json({
    success: true,
    message: "Cập nhật hồ sơ thành công",
    data: { user: userSafe },
    user: userSafe,
  });
});

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

// ─── Web Admin Portal & Real-time SSE ─────────────────────────────────────────
server.get(["/admin", "/dashboard"], (req, res) => {
  const htmlPath = path.join(__dirname, "adminPortal.html");
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  res.send("Admin Portal HTML not found");
});

// Trình chiếu mã QR cho Máy Chiếu Hội Trường & Laptop (Demo Quét QR)
server.get(["/qr", "/projector"], (req, res) => {
  const htmlPath = path.join(__dirname, "qrProjector.html");
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  res.send("QR Projector HTML not found");
});

server.get("/api/admin/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (res.flushHeaders) res.flushHeaders();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", time: new Date() })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// ─── Dynamic QR Token Generation (Anti-Replay / Anti-Screensharing) ──────────
// GET /api/events/:id/qr-token & /events/:id/qr-token
server.get(["/api/events/:id/qr-token", "/events/:id/qr-token"], (req, res) => {
  const { id } = req.params;
  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  if (!event) {
    return res.status(404).json({ success: false, message: "Sự kiện không tồn tại" });
  }

  const TTL_SECONDS = 45; // Đổi mới mỗi 45 giây chống chụp màn hình
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + TTL_SECONDS;

  // Tạo chữ ký JWT với thời hạn 45 giây
  const token = jwt.sign(
    {
      eventId: event.id || event._id,
      title: event.title,
      type: "dynamic_qr",
      iat: now,
    },
    JWT_SECRET,
    { expiresIn: `${TTL_SECONDS}s` }
  );

  const eventIdentifier = event.id || event._id;
  const schemeUrl = `studentevent://checkin?eventId=${eventIdentifier}&token=${token}&exp=${expiresAt}`;
  const universalUrl = `https://studentevent.iuh.edu.vn/checkin?eventId=${eventIdentifier}&token=${token}&exp=${expiresAt}`;

  res.status(200).json({
    success: true,
    data: {
      eventId: eventIdentifier,
      eventTitle: event.title,
      token,
      expiresAt,
      ttlSeconds: TTL_SECONDS,
      schemeUrl,
      universalUrl,
      qrPayload: schemeUrl,
    },
  });
});

// ─── Custom Check-In Endpoint (GPS Anti-Fraud & Passcode Fallback) ────────────
// POST /api/registrations/check-in & /registrations/check-in
server.post(["/api/registrations/check-in", "/registrations/check-in"], (req, res) => {
  const { eventId, userId, studentId, userLocation, method, passcode, token } = req.body;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Mã sự kiện (eventId) không được để trống",
    });
  }

  const event = router.db
    .get("events")
    .find((e) => e.id === eventId || e._id === eventId)
    .value();

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Sự kiện không tồn tại hoặc đã bị hủy",
    });
  }

  let finalMethod = method || "qr_scan";

  // Bảo mật 1: Xác thực Dynamic QR Token (Chữ ký JWT có hạn 45s)
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.eventId !== event.id && decoded.eventId !== event._id) {
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
          message: "Mã QR bảo mật đã hết hạn! Vui lòng quét mã QR mới đang chiếu trên màn hình (mã đổi mới mỗi 45s để chống chụp ảnh gửi người khác).",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Chữ ký mã QR không hợp lệ hoặc đã bị can thiệp trái phép!",
      });
    }
  }

  // Fallback 1: Check-in bằng Passcode dự phòng do BTC công bố tại hội trường
  if (method === "passcode" || passcode) {
    const expectedPasscode = event.checkInPasscode || "889900";
    if (String(passcode).trim() !== String(expectedPasscode).trim()) {
      return res.status(400).json({
        success: false,
        message: "Mã PIN dự phòng (Passcode) không chính xác. Vui lòng kiểm tra lại trên màn chiếu hội trường.",
      });
    }
    finalMethod = "passcode";
  } else {
    // Luồng GPS Anti-Fraud
    if (event.coordinates && event.coordinates.latitude && event.coordinates.longitude) {
      if (!userLocation || userLocation.latitude === undefined || userLocation.longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện này yêu cầu xác thực vị trí (GPS) để chống check-in giả mạo. Vui lòng cấp quyền vị trí trên thiết bị hoặc dùng mã Passcode dự phòng.",
        });
      }

      // 1. Kiểm tra Mock Location (Fake GPS)
      if (userLocation.isMockLocation === true || userLocation.mocked === true) {
        return res.status(403).json({
          success: false,
          message: "Gian lận vị trí (Mock GPS) bị phát hiện! Hệ thống từ chối điểm danh tự động.",
          isLocationError: true,
          antiFraudTriggered: true,
        });
      }

      // 2. Kiểm tra độ chính xác GPS (Accuracy)
      if (typeof userLocation.accuracy === "number" && userLocation.accuracy > 150) {
        return res.status(403).json({
          success: false,
          message: `Độ chính xác GPS không đủ tin cậy (sai số ${Math.round(userLocation.accuracy)}m > 150m). Vui lòng di chuyển ra nơi thoáng hoặc sử dụng mã Passcode dự phòng.`,
          isLocationError: true,
        });
      }

      // 3. Tính khoảng cách Haversine
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
          message: "Vị trí không hợp lệ! Bạn đang cách địa điểm sự kiện " + distText + " (vượt quá bán kính cho phép " + MAX_ALLOWED_DISTANCE_METERS + "m). Vui lòng có mặt tại địa điểm hoặc liên hệ BTC.",
          distanceMeters: distance,
          isLocationError: true,
        });
      }
    }
  }

  let user = null;
  if (userId) {
    user = router.db.get("users").find((u) => u.id === userId || u._id === userId).value();
  } else if (studentId) {
    user = router.db.get("users").find((u) => u.studentId === studentId).value();
  } else {
    user = getAuthUser(req) || router.db.get("users").first().value();
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy thông tin sinh viên",
    });
  }

  let registration = router.db
    .get("registrations")
    .find((r) => (r.eventId === event.id || r.eventId === event._id) && (r.userId === user.id || r.userId === user._id))
    .value();

  const now = new Date().toISOString();

  if (!registration) {
    return res.status(403).json({
      success: false,
      notRegistered: true,
      message: "Bạn chưa đăng ký tham gia sự kiện này! Vui lòng đăng ký trước khi điểm danh.",
    });
  }

  if (registration.status === "waitlist") {
    return res.status(403).json({
      success: false,
      isWaitlist: true,
      message: "Bạn đang ở trong Danh sách chờ (Waitlist). Chỉ sinh viên trong danh sách chính thức mới được phép điểm danh.",
    });
  }

  if (registration.status === "cancelled") {
    return res.status(403).json({
      success: false,
      isCancelled: true,
      message: "Bạn đã hủy đăng ký sự kiện này. Không thể điểm danh.",
    });
  }

  if (registration.status === "checked_in") {
    return res.status(200).json({
      success: true,
      message: "Sinh viên đã điểm danh sự kiện này trước đó",
      alreadyCheckedIn: true,
      data: { registration, event, user },
    });
  }

  router.db
    .get("registrations")
    .find({ id: registration.id })
    .assign({ status: "checked_in", checkInMethod: finalMethod, checkInTime: now, checkInLocation: userLocation || null })
    .write();
  registration = router.db.get("registrations").find({ id: registration.id }).value();

  // Cộng điểm rèn luyện
  const pointsToAdd = Number(event.trainingPoints) || 0;
  if (pointsToAdd > 0) {
    const currentPoint = Number(user.point) || 0;
    router.db
      .get("users")
      .find({ id: user.id })
      .assign({ point: currentPoint + pointsToAdd })
      .write();
    user = router.db.get("users").find({ id: user.id }).value();
  }

  // Phát tín hiệu Real-time cho Web Admin Dashboard
  broadcastSSE("checkin", {
    registration,
    event,
    user,
    timestamp: now,
  });

  recordAuditLog(
    "SYSTEM",
    "Check-in Engine",
    "CHECK_IN_SUCCESS",
    "REGISTRATION",
    registration.id,
    `Sinh viên ${user.name || user.studentId} check-in thành công qua ${finalMethod}`
  );

  res.status(200).json({
    success: true,
    message: "Điểm danh thành công!",
    data: {
      registration,
      event,
      user,
    },
  });
});

// ─── Check-In Appeal Endpoints (Fallback & Dispute Flow) ──────────────────────
// POST /api/registrations/appeal
server.post(["/api/registrations/appeal", "/registrations/appeal"], (req, res) => {
  const { eventId, userId, studentId, studentName, reason, proofImageUrl } = req.body;

  if (!eventId || !reason) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp mã sự kiện và lý do khiếu nại",
    });
  }

  const event = router.db.get("events").find((e) => e.id === eventId || e._id === eventId).value();
  const user = userId ? router.db.get("users").find((u) => u.id === userId || u._id === userId).value() : null;

  const newAppeal = {
    id: generateId(),
    _id: generateId(),
    eventId,
    eventTitle: event?.title || "Sự kiện",
    userId: userId || user?.id || "anonymous",
    studentId: studentId || user?.studentId || "SV",
    studentName: studentName || user?.name || "Sinh viên",
    reason: reason.trim(),
    proofImageUrl: proofImageUrl || null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!router.db.has("appeals").value()) {
    router.db.set("appeals", []).write();
  }
  router.db.get("appeals").push(newAppeal).write();

  broadcastSSE("appeal", { appeal: newAppeal, timestamp: new Date() });
  recordAuditLog(user?.id, studentName || "Sinh viên", "CREATE_APPEAL", "APPEAL", newAppeal.id, reason);

  res.status(201).json({
    success: true,
    message: "Gửi khiếu nại thành công! Ban Tổ chức sẽ xem xét và phản hồi sớm.",
    data: newAppeal,
  });
});

// GET /api/admin/appeals
server.get("/api/admin/appeals", (req, res) => {
  const appeals = router.db.get("appeals").value() || [];
  res.status(200).json({ success: true, data: appeals });
});

// POST /api/admin/appeals/:id/review
server.post("/api/admin/appeals/:id/review", (req, res) => {
  const { id } = req.params;
  const { action, reviewerNote } = req.body; // action: 'approve' | 'reject'

  const appeal = router.db.get("appeals").find((a) => a.id === id || a._id === id).value();
  if (!appeal) {
    return res.status(404).json({ success: false, message: "Không tìm thấy đơn khiếu nại" });
  }

  const now = new Date().toISOString();
  const newStatus = action === "approve" ? "approved" : "rejected";

  router.db.get("appeals").find({ id: appeal.id }).assign({
    status: newStatus,
    reviewerNote: reviewerNote || null,
    reviewedAt: now,
  }).write();

  if (action === "approve") {
    // Duyệt khiếu nại: Đổi registration thành checked_in và cộng điểm rèn luyện
    let reg = router.db.get("registrations").find((r) =>
      r.eventId === appeal.eventId && (r.userId === appeal.userId || r.studentId === appeal.studentId)
    ).value();

    if (!reg) {
      const regId = generateId();
      reg = {
        id: regId,
        _id: regId,
        eventId: appeal.eventId,
        userId: appeal.userId,
        participantRole: "attendee",
        status: "checked_in",
        checkInMethod: "appeal",
        registeredAt: now,
        checkInTime: now,
      };
      router.db.get("registrations").push(reg).write();
    } else {
      router.db.get("registrations").find({ id: reg.id }).assign({
        status: "checked_in",
        checkInMethod: "appeal",
        checkInTime: now,
      }).write();
    }

    // Cộng điểm
    const event = router.db.get("events").find((e) => e.id === appeal.eventId || e._id === appeal.eventId).value();
    const user = router.db.get("users").find((u) => u.id === appeal.userId || u._id === appeal.userId).value();
    if (event && user && event.trainingPoints) {
      router.db.get("users").find({ id: user.id }).assign({
        point: (Number(user.point) || 0) + Number(event.trainingPoints),
      }).write();
    }

    // Gửi thông báo cho sinh viên
    const notif = {
      id: generateId(),
      _id: generateId(),
      userId: appeal.userId,
      title: "✅ Khiếu nại điểm danh đã được phê duyệt!",
      body: `Đơn khiếu nại điểm danh sự kiện "${appeal.eventTitle}" của bạn đã được Ban Tổ chức chấp thuận. Điểm rèn luyện đã được cộng.`,
      isRead: false,
      createdAt: now,
    };
    router.db.get("notifications").push(notif).write();
    broadcastSSE("checkin", { registration: reg, event, user, timestamp: now });
  }

  recordAuditLog("ADMIN", "Ban Quản Trị", action === "approve" ? "APPROVE_APPEAL" : "REJECT_APPEAL", "APPEAL", id, reviewerNote || "");

  res.status(200).json({
    success: true,
    message: action === "approve" ? "Đã duyệt khiếu nại và điểm danh cho sinh viên!" : "Đã từ chối khiếu nại.",
  });
});

// ─── Registration Cancellation with Waitlist Promotion ────────────────────────
// POST /api/registrations/:id/cancel
server.post(["/api/registrations/:id/cancel", "/registrations/:id/cancel"], (req, res) => {
  const { id } = req.params;
  const reg = router.db.get("registrations").find((r) => r.id === id || r._id === id).value();

  if (!reg) {
    return res.status(404).json({ success: false, message: "Không tìm thấy thông tin đăng ký" });
  }

  const now = new Date().toISOString();
  router.db.get("registrations").find({ id: reg.id }).assign({
    status: "cancelled",
    cancelledAt: now,
  }).write();

  // Đôn người đầu tiên trong Waitlist lên CONFIRMED
  const nextInWaitlist = router.db.get("registrations").find((r) =>
    r.eventId === reg.eventId && r.status === "waitlist" && r.waitlistPosition === 1
  ).value();

  if (nextInWaitlist) {
    router.db.get("registrations").find({ id: nextInWaitlist.id }).assign({
      status: "registered",
      waitlistPosition: null,
      promotedAt: now,
    }).write();

    // Giảm waitlistPosition của các bạn còn lại
    const remainingWaitlist = router.db.get("registrations").filter((r) =>
      r.eventId === reg.eventId && r.status === "waitlist"
    ).value();

    remainingWaitlist.forEach((w) => {
      if (w.waitlistPosition && w.waitlistPosition > 1) {
        router.db.get("registrations").find({ id: w.id }).assign({
          waitlistPosition: w.waitlistPosition - 1,
        }).write();
      }
    });

    const event = router.db.get("events").find((e) => e.id === reg.eventId || e._id === reg.eventId).value();
    // Bắn thông báo cho bạn được đôn lên
    const notif = {
      id: generateId(),
      _id: generateId(),
      userId: nextInWaitlist.userId,
      title: "🎉 Bạn đã nhận được vé chính thức!",
      body: `Có một slot trống tại sự kiện "${event?.title || "Sự kiện"}" và bạn đã được tự động đôn lên danh sách tham gia chính thức.`,
      isRead: false,
      createdAt: now,
    };
    router.db.get("notifications").push(notif).write();
  }

  recordAuditLog(reg.userId, "Student", "CANCEL_REGISTRATION", "REGISTRATION", reg.id, "Sinh viên chủ động hủy vé");

  res.status(200).json({
    success: true,
    message: "Hủy vé thành công. Vị trí trống đã được tự động chuyển cho người tiếp theo trong Waitlist.",
  });
});

// ─── Event State Machine Endpoints ───────────────────────────────────────────
// PUT /api/admin/events/:id/status
server.put("/api/admin/events/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["draft", "pending_approval", "published", "registration_closed", "ongoing", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(", ")}` });
  }

  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  if (!event) {
    return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
  }

  router.db.get("events").find({ id: event.id }).assign({
    status,
    updatedAt: new Date().toISOString(),
  }).write();

  recordAuditLog("ADMIN", "Ban Quản Trị", "EVENT_STATE_CHANGE", "EVENT", event.id, `Chuyển trạng thái từ ${event.status} sang ${status}`);
  broadcastSSE("event_status_change", { eventId: event.id, status, timestamp: new Date() });

  res.status(200).json({
    success: true,
    message: `Đã cập nhật trạng thái sự kiện sang "${status}" thành công`,
    data: { id: event.id, status },
  });
});

// ─── iCalendar (.ICS) Endpoint for Calendar Integration ───────────────────────
// GET /api/events/:id/calendar.ics
server.get("/api/events/:id/calendar.ics", (req, res) => {
  const { id } = req.params;
  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();

  if (!event) {
    return res.status(404).send("Event not found");
  }

  const formatIcsDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "20261015T080000Z" : d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const startIcs = formatIcsDate(event.time?.start || new Date());
  const endIcs = formatIcsDate(event.time?.end || new Date(Date.now() + 3 * 3600 * 1000));
  const nowIcs = formatIcsDate(new Date());

  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IUH//StudentEventApp//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id || event._id}@iuh.edu.vn`,
    `DTSTAMP:${nowIcs}`,
    `DTSTART:${startIcs}`,
    `DTEND:${endIcs}`,
    `SUMMARY:${(event.title || "Sự kiện sinh viên IUH").replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${(event.location || "Đại học Công nghiệp TP.HCM").replace(/\n/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="event-${id}.ics"`);
  res.send(icsData);
});

// ─── Notification Preferences & Push Dispatcher ──────────────────────────────
// GET /api/users/:id/preferences
server.get("/api/users/:id/preferences", (req, res) => {
  const { id } = req.params;
  if (!router.db.has("preferences").value()) {
    router.db.set("preferences", []).write();
  }
  let pref = router.db.get("preferences").find((p) => p.userId === id).value();
  if (!pref) {
    pref = {
      userId: id,
      enablePush: true,
      enableEmail: true,
      notifyScheduleChange: true,
      notifyUrgent: true,
      notifyReminders: true,
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "06:00",
      reminderMinutesBefore: 60,
    };
  }
  res.status(200).json({ success: true, data: pref });
});

// PUT /api/users/:id/preferences
server.put("/api/users/:id/preferences", (req, res) => {
  const { id } = req.params;
  if (!router.db.has("preferences").value()) {
    router.db.set("preferences", []).write();
  }
  const existing = router.db.get("preferences").find((p) => p.userId === id).value();
  const updatedPref = {
    userId: id,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    router.db.get("preferences").find({ userId: id }).assign(updatedPref).write();
  } else {
    router.db.get("preferences").push(updatedPref).write();
  }

  res.status(200).json({ success: true, message: "Cập nhật tùy chọn thông báo thành công", data: updatedPref });
});

// POST /api/notifications/broadcast
server.post("/api/notifications/broadcast", (req, res) => {
  const { eventId, title, body, category, isUrgent } = req.body;
  if (!eventId || !title || !body) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp eventId, title và body" });
  }

  const registrations = router.db.get("registrations").filter((r) => r.eventId === eventId && r.status !== "cancelled").value() || [];
  const now = new Date();
  let deliveredCount = 0;

  registrations.forEach((reg) => {
    const pref = router.db.get("preferences").find((p) => p.userId === reg.userId).value() || {};

    // Quiet Hours Filter
    let skipQuiet = false;
    if (pref.quietHoursEnabled && !isUrgent) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = (pref.quietHoursStart || "22:00").split(":").map(Number);
      const [eh, em] = (pref.quietHoursEnd || "06:00").split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (startMin > endMin) {
        if (currentMin >= startMin || currentMin < endMin) skipQuiet = true;
      } else {
        if (currentMin >= startMin && currentMin < endMin) skipQuiet = true;
      }
    }

    if (!skipQuiet) {
      const notif = {
        id: generateId(),
        _id: generateId(),
        userId: reg.userId,
        eventId,
        title,
        body,
        category: category || "general",
        isUrgent: !!isUrgent,
        isRead: false,
        createdAt: now.toISOString(),
      };
      router.db.get("notifications").push(notif).write();
      deliveredCount++;
    }
  });

  recordAuditLog("ADMIN", "Notification Engine", "BROADCAST_NOTIFICATION", "EVENT", eventId, `Gửi thông báo đến ${deliveredCount} sinh viên: ${title}`);

  res.status(200).json({
    success: true,
    message: `Đã phát thông báo thành công tới ${deliveredCount} sinh viên (áp dụng bộ lọc Giờ yên lặng)`,
    deliveredCount,
  });
});

// ─── Bulk Export/Import & Certificates & Training Points ───────────────────────
// GET /api/admin/events/:id/export (CSV UTF-8 BOM)
server.get("/api/admin/events/:id/export", (req, res) => {
  const { id } = req.params;
  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  const regs = router.db.get("registrations").filter((r) => r.eventId === id).value() || [];
  const users = router.db.get("users").value() || [];

  let csv = "\uFEFFMSSV,Họ và tên,Khoa,Trạng thái,Thời gian check-in,Phương thức điểm danh,Ghi chú\n";

  regs.forEach((r) => {
    const u = users.find((user) => user.id === r.userId || user._id === r.userId) || {};
    const mssv = u.studentId || "SV";
    const name = `"${(u.name || u.fullName || "").replace(/"/g, '""')}"`;
    const faculty = `"${(u.faculty || "").replace(/"/g, '""')}"`;
    const status = r.status === "checked_in" ? "Đã tham gia" : r.status === "registered" ? "Đã đăng ký (chưa đến)" : r.status;
    const checkInTime = r.checkInTime ? new Date(r.checkInTime).toLocaleString("vi-VN") : "N/A";
    const method = r.checkInMethod || "N/A";
    csv += `${mssv},${name},${faculty},${status},${checkInTime},${method},\n`;
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-event-${id}.csv"`);
  res.send(csv);
});

// POST /api/admin/events/:id/import-attendees
server.post("/api/admin/events/:id/import-attendees", (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "Danh sách MSSV không hợp lệ" });
  }

  let imported = 0;
  const now = new Date().toISOString();

  studentIds.forEach((sid) => {
    const studentIdClean = String(sid).trim();
    if (!studentIdClean) return;

    let user = router.db.get("users").find((u) => u.studentId === studentIdClean).value();
    if (!user) {
      const newUserId = generateId();
      user = {
        id: newUserId,
        _id: newUserId,
        studentId: studentIdClean,
        name: `Sinh viên ${studentIdClean}`,
        email: `${studentIdClean.toLowerCase()}@iuh.edu.vn`,
        password: "changeme",
        role: "student",
        point: 0,
        status: "active",
        isActive: true,
        createdAt: now,
      };
      router.db.get("users").push(user).write();
    }

    const existingReg = router.db.get("registrations").find((r) => r.eventId === id && r.userId === user.id).value();
    if (!existingReg) {
      const newRegId = generateId();
      router.db.get("registrations").push({
        id: newRegId,
        _id: newRegId,
        eventId: id,
        userId: user.id,
        participantRole: "attendee",
        status: "registered",
        registeredAt: now,
      }).write();
      imported++;
    }
  });

  recordAuditLog("ADMIN", "Ban Quản Trị", "IMPORT_STUDENTS", "EVENT", id, `Import thành công ${imported} sinh viên`);

  res.status(200).json({
    success: true,
    message: `Đã import thành công ${imported} sinh viên vào sự kiện.`,
    importedCount: imported,
  });
});

// POST /api/admin/events/:id/attendees (Thêm sinh viên tham gia đơn lẻ)
server.post(["/api/admin/events/:id/attendees", "/admin/events/:id/attendees"], (req, res) => {
  const { id } = req.params;
  const { studentIdOrEmail, fullName, note } = req.body;

  if (!studentIdOrEmail || !String(studentIdOrEmail).trim()) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập MSSV hoặc Email của sinh viên." });
  }

  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  if (!event) {
    return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện." });
  }

  const cleanQuery = String(studentIdOrEmail).trim().toLowerCase();
  let user = router.db.get("users").find((u) =>
    (u.studentId && u.studentId.toLowerCase() === cleanQuery) ||
    (u.email && u.email.toLowerCase() === cleanQuery)
  ).value();

  const now = new Date().toISOString();

  if (!user) {
    const newUserId = generateId();
    const isEmail = cleanQuery.includes("@");
    const generatedStudentId = isEmail ? cleanQuery.split("@")[0].toUpperCase() : cleanQuery.toUpperCase();
    const generatedEmail = isEmail ? cleanQuery : `${cleanQuery}@iuh.edu.vn`;

    user = {
      id: newUserId,
      _id: newUserId,
      studentId: generatedStudentId,
      name: fullName || `Sinh viên ${generatedStudentId}`,
      fullName: fullName || `Sinh viên ${generatedStudentId}`,
      email: generatedEmail,
      password: "changeme",
      role: "student",
      point: 100,
      faculty: event.faculty || "Khoa Công nghệ thông tin",
      status: "active",
      isActive: true,
      createdAt: now,
    };
    router.db.get("users").push(user).write();
  }

  const existingReg = router.db.get("registrations").find((r) =>
    (r.eventId === id || r.eventId === event._id) &&
    (r.userId === user.id || r.userId === user._id)
  ).value();

  if (existingReg && existingReg.status !== "cancelled") {
    return res.status(400).json({
      success: false,
      message: `Sinh viên ${user.fullName || user.name} (${user.studentId}) đã có trong danh sách (trạng thái: ${existingReg.status}).`,
    });
  }

  // Quota check
  const activeRegs = router.db.get("registrations").filter((r) =>
    (r.eventId === id || r.eventId === event._id) &&
    r.status !== "cancelled" &&
    r.status !== "waitlist"
  ).value() || [];

  const maxSlots = Number(event.maxSlots) || 100;
  let targetStatus = "registered";
  let waitlistPos = null;

  if (activeRegs.length >= maxSlots) {
    // Nếu hết chỗ chính thức -> vào waitlist
    const waitlistRegs = router.db.get("registrations").filter((r) =>
      (r.eventId === id || r.eventId === event._id) && r.status === "waitlist"
    ).value() || [];
    targetStatus = "waitlist";
    waitlistPos = waitlistRegs.length + 1;
  }

  let finalReg;
  if (existingReg && existingReg.status === "cancelled") {
    router.db.get("registrations").find({ id: existingReg.id }).assign({
      status: targetStatus,
      waitlistPosition: waitlistPos,
      registeredAt: now,
      note: note || "Admin thêm lại vào danh sách",
    }).write();
    finalReg = router.db.get("registrations").find({ id: existingReg.id }).value();
  } else {
    const newRegId = generateId();
    finalReg = {
      id: newRegId,
      _id: newRegId,
      eventId: id,
      userId: user.id,
      participantRole: "attendee",
      status: targetStatus,
      waitlistPosition: waitlistPos,
      qrCode: `EVENTMATE:${newRegId}`,
      registeredAt: now,
      note: note || "Admin thêm trực tiếp vào danh sách",
    };
    router.db.get("registrations").push(finalReg).write();
  }

  recordAuditLog("ADMIN", "Ban Quản Trị", "ADD_ATTENDEE", "REGISTRATION", finalReg.id, `Thêm ${user.studentId} vào sự kiện ${event.title} (${targetStatus})`);

  res.status(201).json({
    success: true,
    message: targetStatus === "registered"
      ? `Đã thêm thành công sinh viên ${user.fullName || user.name} (${user.studentId}) vào danh sách chính thức!`
      : `Đã thêm sinh viên ${user.fullName || user.name} vào Danh sách chờ (vị trí #${waitlistPos}) do sự kiện đã đủ quota.`,
    data: {
      registration: finalReg,
      user,
      event,
    },
  });
});

// DELETE /api/admin/registrations/:id (Xoá / Hủy người tham gia sự kiện và tự động đôn Waitlist)
server.delete(["/api/admin/registrations/:id", "/admin/registrations/:id"], (req, res) => {
  const { id } = req.params;
  const reg = router.db.get("registrations").find((r) => r.id === id || r._id === id).value();

  if (!reg) {
    return res.status(404).json({ success: false, message: "Không tìm thấy thông tin đăng ký." });
  }

  const now = new Date().toISOString();
  const wasOfficial = reg.status === "registered" || reg.status === "checked_in";

  // Cập nhật trạng thái thành cancelled
  router.db.get("registrations").find({ id: reg.id }).assign({
    status: "cancelled",
    cancelledAt: now,
    cancelledBy: "ADMIN",
  }).write();

  let promotedStudent = null;

  // Nếu người bị xoá là chính thức -> Tự động đôn người đầu tiên trong Waitlist lên
  if (wasOfficial) {
    const nextInWaitlist = router.db.get("registrations")
      .filter((r) => r.eventId === reg.eventId && r.status === "waitlist")
      .sortBy("waitlistPosition")
      .value()[0];

    if (nextInWaitlist) {
      router.db.get("registrations").find({ id: nextInWaitlist.id }).assign({
        status: "registered",
        waitlistPosition: null,
        promotedAt: now,
      }).write();

      promotedStudent = router.db.get("registrations").find({ id: nextInWaitlist.id }).value();

      // Gửi thông báo đến sinh viên được đôn lên
      const notif = {
        id: generateId(),
        _id: generateId(),
        userId: nextInWaitlist.userId,
        eventId: reg.eventId,
        title: "🎉 Bạn đã được đôn lên Danh sách chính thức!",
        body: "Một chỗ trống vừa xuất hiện tại sự kiện bạn đang chờ. Bạn đã chính thức có vé tham gia và có thể check-in khi sự kiện diễn ra!",
        isRead: false,
        createdAt: now,
      };
      router.db.get("notifications").push(notif).write();
    }
  }

  recordAuditLog("ADMIN", "Ban Quản Trị", "REMOVE_ATTENDEE", "REGISTRATION", id, `Xoá sinh viên khỏi sự kiện ${reg.eventId}. Đôn waitlist: ${promotedStudent ? promotedStudent.userId : 'Không có'}`);

  res.status(200).json({
    success: true,
    message: promotedStudent
      ? "Đã xoá sinh viên khỏi sự kiện! Hệ thống đã tự động đôn 01 sinh viên từ Danh sách chờ lên chính thức."
      : "Đã xoá sinh viên khỏi sự kiện thành công!",
    data: {
      cancelledRegistrationId: id,
      promotedStudent,
    },
  });
});

// PATCH /api/admin/events/:id/quota (Cập nhật số lượng tham gia Quota & Waitlist)
server.patch(["/api/admin/events/:id/quota", "/admin/events/:id/quota"], (req, res) => {
  const { id } = req.params;
  const { maxSlots, waitlistSlots } = req.body;

  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  if (!event) {
    return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện." });
  }

  const newMax = maxSlots !== undefined ? Math.max(1, Number(maxSlots)) : (event.maxSlots || 100);
  const newWaitlist = waitlistSlots !== undefined ? Math.max(0, Number(waitlistSlots)) : (event.waitlistSlots || 20);

  router.db.get("events").find({ id: event.id }).assign({
    maxSlots: newMax,
    waitlistSlots: newWaitlist,
    updatedAt: new Date().toISOString(),
  }).write();

  // Nếu tăng quota, kiểm tra xem có thể đôn sinh viên từ waitlist lên không
  const activeCount = router.db.get("registrations").filter((r) =>
    (r.eventId === event.id || r.eventId === event._id) &&
    r.status !== "cancelled" &&
    r.status !== "waitlist"
  ).value().length;

  let promotedCount = 0;
  const availableSlots = newMax - activeCount;

  if (availableSlots > 0) {
    const waitlisted = router.db.get("registrations")
      .filter((r) => (r.eventId === event.id || r.eventId === event._id) && r.status === "waitlist")
      .sortBy("waitlistPosition")
      .take(availableSlots)
      .value() || [];

    const now = new Date().toISOString();
    waitlisted.forEach((w) => {
      router.db.get("registrations").find({ id: w.id }).assign({
        status: "registered",
        waitlistPosition: null,
        promotedAt: now,
      }).write();
      promotedCount++;

      router.db.get("notifications").push({
        id: generateId(),
        _id: generateId(),
        userId: w.userId,
        eventId: event.id,
        title: "🎉 Quota sự kiện mở rộng - Bạn đã có vé chính thức!",
        body: `Ban Tổ chức vừa tăng số lượng chỗ cho sự kiện "${event.title}". Bạn đã được chuyển từ Waitlist sang danh sách chính thức!`,
        isRead: false,
        createdAt: now,
      }).write();
    });
  }

  const updatedEvent = router.db.get("events").find({ id: event.id }).value();
  recordAuditLog("ADMIN", "Ban Quản Trị", "UPDATE_QUOTA", "EVENT", id, `Cập nhật quota: ${newMax} slots (Waitlist: ${newWaitlist}). Đôn ${promotedCount} sinh viên.`);

  res.status(200).json({
    success: true,
    message: promotedCount > 0
      ? `Đã cập nhật Quota thành ${newMax} chỗ. Đã tự động đôn ${promotedCount} sinh viên từ Danh sách chờ lên chính thức!`
      : `Đã cập nhật Quota: ${newMax} chỗ chính thức, ${newWaitlist} chỗ chờ.`,
    data: updatedEvent,
    promotedCount,
  });
});

// POST /api/admin/registrations/:id/quick-checkin (1-Tap Check-In bởi Admin)
server.post(["/api/admin/registrations/:id/quick-checkin", "/admin/registrations/:id/quick-checkin"], (req, res) => {
  const { id } = req.params;
  const reg = router.db.get("registrations").find((r) => r.id === id || r._id === id).value();

  if (!reg) {
    return res.status(404).json({ success: false, message: "Không tìm thấy thông tin đăng ký." });
  }

  if (reg.status === "checked_in") {
    return res.status(200).json({ success: true, message: "Sinh viên này đã được điểm danh trước đó rồi." });
  }

  const now = new Date().toISOString();
  router.db.get("registrations").find({ id: reg.id }).assign({
    status: "checked_in",
    checkInMethod: "admin_manual",
    checkInTime: now,
  }).write();

  // Cộng điểm rèn luyện
  const event = router.db.get("events").find((e) => e.id === reg.eventId || e._id === reg.eventId).value();
  const user = router.db.get("users").find((u) => u.id === reg.userId || u._id === reg.userId).value();

  if (event && user && event.trainingPoints) {
    router.db.get("users").find({ id: user.id }).assign({
      point: (Number(user.point) || 0) + Number(event.trainingPoints),
    }).write();
  }

  const updatedReg = router.db.get("registrations").find({ id: reg.id }).value();
  broadcastSSE("checkin", { registration: updatedReg, event, user, timestamp: now });
  recordAuditLog("ADMIN", "Ban Quản Trị", "QUICK_CHECK_IN", "REGISTRATION", id, `Admin điểm danh nhanh cho ${user ? user.studentId : reg.userId}`);

  res.status(200).json({
    success: true,
    message: `Điểm danh thành công cho sinh viên ${user?.fullName || user?.name || ''}! (+${event?.trainingPoints || 5} điểm rèn luyện)`,
    data: updatedReg,
  });
});

// POST /api/events/:id/certificates (Cấp chứng nhận điện tử)
server.post("/api/events/:id/certificates", (req, res) => {
  const { id } = req.params;
  const event = router.db.get("events").find((e) => e.id === id || e._id === id).value();
  const attendees = router.db.get("registrations").filter((r) => r.eventId === id && r.status === "checked_in").value() || [];
  const users = router.db.get("users").value() || [];

  if (!router.db.has("certificates").value()) {
    router.db.set("certificates", []).write();
  }

  let generated = 0;
  const now = new Date().toISOString();

  attendees.forEach((r, idx) => {
    const existingCert = router.db.get("certificates").find((c) => c.registrationId === r.id || (c.eventId === id && c.userId === r.userId)).value();
    if (!existingCert) {
      const user = users.find((u) => u.id === r.userId || u._id === r.userId) || {};
      const certCode = `IUH-CERT-2026-${(1000 + idx + 1)}`;
      const cert = {
        id: generateId(),
        _id: generateId(),
        registrationId: r.id,
        eventId: id,
        eventTitle: event?.title || "Sự kiện",
        userId: r.userId,
        studentId: user.studentId || "SV",
        studentName: user.name || user.fullName || "Sinh viên",
        certificateCode: certCode,
        issueDate: now,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      };
      router.db.get("certificates").push(cert).write();
      generated++;
    }
  });

  recordAuditLog("ADMIN", "Certificate Authority", "GENERATE_CERTIFICATES", "EVENT", id, `Phát hành ${generated} chứng nhận điện tử`);

  res.status(200).json({
    success: true,
    message: `Đã phát hành ${generated} chứng nhận điện tử có mã số xác thực!`,
    generatedCount: generated,
  });
});

// GET /api/certificates/:code (Xác thực chứng nhận)
server.get("/api/certificates/:code", (req, res) => {
  const { code } = req.params;
  const cert = router.db.get("certificates").find((c) => c.certificateCode === code).value();
  if (!cert) {
    return res.status(404).json({ success: false, message: "Mã chứng nhận không tồn tại hoặc không hợp lệ" });
  }
  res.status(200).json({ success: true, valid: true, data: cert });
});

// POST /api/admin/training-points/batch-approve
server.post("/api/admin/training-points/batch-approve", (req, res) => {
  if (!router.db.has("trainingPointApprovals").value()) {
    router.db.set("trainingPointApprovals", []).write();
  }
  router.db.get("trainingPointApprovals").filter({ status: "pending" }).each((item) => {
    router.db.get("trainingPointApprovals").find({ id: item.id }).assign({ status: "approved", approvedAt: new Date().toISOString() }).write();
  }).write();

  recordAuditLog("ADMIN", "Phòng CTSV", "APPROVE_TRAINING_POINTS", "ALL", "batch", "Duyệt toàn bộ điểm rèn luyện đợt hiện tại");

  res.status(200).json({
    success: true,
    message: "Đã 1-Click phê duyệt toàn bộ điểm rèn luyện cho sinh viên tham gia đầy đủ!",
  });
});

// ─── AI Summary (demo-safe deterministic fallback) ──────────────────────────
// This mock endpoint deliberately never calls an external AI provider. It lets
// the mobile UI demonstrate the AI flow without exposing an API key or sending
// student data to a third party. A production service can replace this route.
server.post(["/api/events/:eventId/summarize", "/events/:eventId/summarize"], (req, res) => {
  const event = router.db
    .get("events")
    .find((item) => item.id === req.params.eventId || item._id === req.params.eventId)
    .value();

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy sự kiện để tóm tắt.",
    });
  }

  const start = new Date(event.time?.start);
  const when = Number.isNaN(start.getTime())
    ? "Thời gian sẽ được ban tổ chức cập nhật."
    : `Bắt đầu lúc ${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${start.toLocaleDateString("vi-VN")}.`;
  const summary = event.aiSummary || {
    what: event.description || `Sự kiện ${event.title}.`,
    when,
    where: event.location || "Địa điểm sẽ được ban tổ chức cập nhật.",
    benefits: event.trainingPoints
      ? `Người tham gia được cộng ${event.trainingPoints} điểm rèn luyện.`
      : "Cơ hội cập nhật kiến thức và kết nối cùng cộng đồng sinh viên.",
  };

  return res.status(200).json({
    success: true,
    mode: event.aiSummary ? "seeded-summary" : "deterministic-fallback",
    data: summary,
  });
});

// ─── ID auto-population middleware for POST ───────────────────────────────────
// A registration represents one student's participation in one event. Enforce
// that invariant on the server too; UI state alone cannot prevent concurrent
// or replayed requests from creating duplicates.
server.use((req, res, next) => {
  if (req.method !== "POST" || !["/registrations", "/api/registrations"].includes(req.path)) {
    return next();
  }

  const { eventId, userId } = req.body || {};
  if (!eventId || !userId) return next();

  const existing = router.db
    .get("registrations")
    .find((registration) =>
      (registration.eventId === eventId || registration.eventId?._id === eventId) &&
      (registration.userId === userId || registration.userId?._id === userId) &&
      registration.status !== "cancelled",
    )
    .value();

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Bạn đã đăng ký hoặc check-in sự kiện này rồi.",
    });
  }

  // Quota & Waitlist Management
  const event = router.db.get("events").find((e) => e.id === eventId || e._id === eventId).value();
  if (event) {
    const confirmedCount = router.db.get("registrations").filter((r) =>
      (r.eventId === eventId || r.eventId?._id === eventId) &&
      (r.status === "registered" || r.status === "checked_in")
    ).value().length;

    const maxSlots = event.maxSlots || 100;
    const waitlistSlots = event.waitlistSlots || 20;

    if (confirmedCount >= maxSlots) {
      const currentWaitlist = router.db.get("registrations").filter((r) =>
        (r.eventId === eventId || r.eventId?._id === eventId) &&
        r.status === "waitlist"
      ).value();

      if (currentWaitlist.length < waitlistSlots) {
        req.body.status = "waitlist";
        req.body.waitlistPosition = currentWaitlist.length + 1;
      } else {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã hết toàn bộ vé chính thức và danh sách chờ (Waitlist đã đầy).",
        });
      }
    }
  }

  next();
});

server.use((req, res, next) => {
  if (req.method === "POST" && req.body && typeof req.body === "object") {
    if (!req.body.id && !req.body._id) {
      const newId = generateId();
      req.body.id = newId;
      req.body._id = newId;
    } else if (req.body.id && !req.body._id) {
      req.body._id = req.body.id;
    } else if (!req.body.id && req.body._id) {
      req.body.id = req.body._id;
    }

    if (!req.body.createdAt) {
      req.body.createdAt = new Date().toISOString();
    }
  }
  next();
});

// ─── Route Rewriting for /api/* prefix ─────────────────────────────────────────
// Allows requests to /api/events, /api/users etc. to be routed directly to json-server router
server.use(jsonServer.rewriter({
  "/api/*": "/$1",
}));

// ─── Custom Response Envelope Formatter (Hybrid Support) ──────────────────────
// Supports both raw json-server format [ ... ] AND wrapped format { success: true, data: [ ... ] }

const syncSrcDbFeedbacks = () => {
  try {
    const srcDbPath = path.join(__dirname, "..", "src", "data", "db.json");
    if (fs.existsSync(srcDbPath)) {
      const srcDb = JSON.parse(fs.readFileSync(srcDbPath, "utf8"));
      srcDb.feedbacks = router.db.get("feedbacks").value();
      fs.writeFileSync(srcDbPath, JSON.stringify(srcDb, null, 2), "utf8");
    }
  } catch (err) {
    // Ignore sync error silently
  }
};

router.render = (req, res) => {
  const data = res.locals.data;

  // Auto-sync feedbacks to src/data/db.json on mutations so app bundle stays up to date
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
    if (req.url && req.url.includes("feedbacks")) {
      syncSrcDbFeedbacks();
    }
  }

  // If query specifies envelope=true or if requested with header x-envelope: true
  if (req.query.envelope === "true" || req.headers["x-envelope"] === "true") {
    return res.jsonp({
      success: true,
      count: Array.isArray(data) ? data.length : undefined,
      data: data,
    });
  }

  // Default: Standard json-server response (pure arrays and objects)
  res.jsonp(data);
};

// ─── Mount JSON-Server Router ─────────────────────────────────────────────────
server.use(router);

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 JSON-Server is running on port ${PORT}!`);
  console.log(`📡 Local:            http://localhost:${PORT}`);
  console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`====================================================`);
  console.log(`📋 Available Resources:`);
  console.log(`   - GET/POST        http://localhost:${PORT}/events`);
  console.log(`   - GET/POST        http://localhost:${PORT}/users`);
  console.log(`   - GET/POST        http://localhost:${PORT}/registrations`);
  console.log(`   - GET/POST        http://localhost:${PORT}/feedbacks`);
  console.log(`   - GET/POST        http://localhost:${PORT}/notifications`);
  console.log(`🔐 Auth Endpoints:`);
  console.log(`   - POST            http://localhost:${PORT}/api/auth/login`);
  console.log(`   - POST            http://localhost:${PORT}/api/auth/register`);
  console.log(`   - GET/PUT         http://localhost:${PORT}/api/auth/me`);
  console.log(`   - POST            http://localhost:${PORT}/api/registrations/check-in`);
  console.log(`💻 Web Admin Dashboard (Đoàn - Hội):`);
  console.log(`   - Portal URL:     http://localhost:${PORT}/admin`);
  console.log(`   - Realtime SSE:   http://localhost:${PORT}/api/admin/stream`);
  console.log(`💡 Tip: Bạn có thể thêm ?envelope=true vào URL để nhận định dạng { success: true, data: [...] }`);
  console.log(`====================================================`);
});
