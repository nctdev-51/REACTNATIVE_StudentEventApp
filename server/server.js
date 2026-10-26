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

const PORT = process.env.PORT || 3000;
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

// ─── Custom Check-In Endpoint ─────────────────────────────────────────────────
// POST /api/registrations/check-in & /registrations/check-in
server.post(["/api/registrations/check-in", "/registrations/check-in"], (req, res) => {
  const { eventId, userId, studentId } = req.body;

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
    const newRegId = generateId();
    registration = {
      id: newRegId,
      _id: newRegId,
      eventId: event.id,
      userId: user.id,
      participantRole: "attendee",
      status: "checked_in",
      qrCode: `EVENTMATE:${newRegId}`,
      registeredAt: now,
      checkInTime: now,
      checkOutTime: null,
    };
    router.db.get("registrations").push(registration).write();
  } else {
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
      .assign({ status: "checked_in", checkInTime: now })
      .write();
    registration = router.db.get("registrations").find({ id: registration.id }).value();
  }

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

// ─── ID auto-population middleware for POST ───────────────────────────────────
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
router.render = (req, res) => {
  const data = res.locals.data;

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
  console.log(`💡 Tip: Bạn có thể thêm ?envelope=true vào URL để nhận định dạng { success: true, data: [...] }`);
  console.log(`====================================================`);
});
