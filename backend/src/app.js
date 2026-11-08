require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, isDatabaseConnected } = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
// Cấu hình CORS mở toàn bộ để chấp nhận kết nối từ mọi thiết bị di động (4G, Wi-Fi, Web, Tunnel)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware chống crash khi Client gửi body JSON sai cú pháp
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu JSON gửi lên không đúng định dạng!",
    });
  }
  next(err);
});

// ─── Health Check Route ───────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudentEventApp API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get(["/api", "/api/health"], (req, res) => {
  const database = isDatabaseConnected();
  res.status(database ? 200 : 503).json({
    success: database,
    message: database ? "Server and database are healthy" : "Server is running but MongoDB is unavailable",
    data: { database },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Hỗ trợ cả /api/* và root /* để tránh 404 cho mọi loại client
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/events", eventRoutes);
app.use("/events", eventRoutes);

app.use("/api/registrations", registrationRoutes);
app.use("/registrations", registrationRoutes);

app.use("/api/feedbacks", feedbackRoutes);
app.use("/feedbacks", feedbackRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

app.use("/api/users", userRoutes);
app.use("/users", userRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Start Server (0.0.0.0 để nhận kết nối từ mọi thiết bị ngoại mạng / 4G / Tunnel) ───
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [Bulletproof Backend] Đang lắng nghe tại:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Network:  http://${HOST}:${PORT} (0.0.0.0)`);
  console.log(`   - Health:   http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

module.exports = app;
