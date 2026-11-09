const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendOtpEmail } = require("../services/emailService");

const OTP_LIFETIME_MS = 15 * 60 * 1000;
const createOtp = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

// Helper: Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id, tokenType: "access" }, (process.env.JWT_SECRET || "studenteventapp_secret_key_2026"), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id, tokenType: "refresh" }, (process.env.JWT_SECRET || "studenteventapp_secret_key_2026"), {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, studentId, role, faculty, phone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedStudentId = studentId ? String(studentId).trim() : null;

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    if (normalizedStudentId) {
      const existingStudent = await User.findOne({ studentId: normalizedStudentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists",
        });
      }
    }

    // Create user
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      studentId: normalizedStudentId,
      faculty: faculty || null,
      phone: phone || null,
      role: role === "organizer" ? "organizer" : "student",
      point: 0,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or Student ID already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated. Contact support.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    if (req.user?._id) {
      const user = await User.findById(req.user._id).select("+refreshToken");
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(token, (process.env.JWT_SECRET || "studenteventapp_secret_key_2026"));
    if (decoded.tokenType && decoded.tokenType !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token type",
      });
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || !user.isActive || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const { name, studentId, avatar, faculty, phone } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (studentId !== undefined) updateData.studentId = studentId;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (faculty !== undefined) updateData.faculty = faculty;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during password change",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordResetCodeHash +passwordResetExpiresAt");
    if (!user) return res.status(200).json({ success: true, message: "Nếu email tồn tại, mã xác nhận đã được gửi." });
    const code = createOtp();
    user.passwordResetCodeHash = hashOtp(code);
    user.passwordResetExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
    await user.save({ validateBeforeSave: false });
    const delivery = await sendOtpEmail({ to: user.email, code, purpose: "reset" });
    res.status(200).json({ success: true, message: "Mã xác nhận đã được gửi.", ...(delivery.demoCode ? { demoCode: delivery.demoCode } : {}) });
  } catch {
    res.status(500).json({ success: false, message: "Không thể gửi mã xác nhận." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();
    const newPassword = String(req.body.newPassword || "");
    if (!/^\d{6}$/.test(code) || newPassword.length < 6) return res.status(400).json({ success: false, message: "Mã gồm 6 chữ số và mật khẩu phải có ít nhất 6 ký tự." });
    const user = await User.findOne({ email }).select("+password +passwordResetCodeHash +passwordResetExpiresAt +refreshToken");
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date() || user.passwordResetCodeHash !== hashOtp(code)) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn." });
    }
    user.password = newPassword;
    user.passwordResetCodeHash = null;
    user.passwordResetExpiresAt = null;
    user.refreshToken = null;
    await user.save();
    res.status(200).json({ success: true, message: "Đặt lại mật khẩu thành công. Hãy đăng nhập lại." });
  } catch {
    res.status(500).json({ success: false, message: "Không thể đặt lại mật khẩu." });
  }
};

const requestEmailChange = async (req, res) => {
  try {
    const newEmail = String(req.body.newEmail || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    if (newEmail === req.user.email) return res.status(400).json({ success: false, message: "Đây đã là email hiện tại." });
    if (await User.exists({ email: newEmail })) return res.status(409).json({ success: false, message: "Email này đã được sử dụng." });
    const code = createOtp();
    req.user.pendingEmail = newEmail;
    req.user.emailChangeCodeHash = hashOtp(code);
    req.user.emailChangeExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS);
    await req.user.save({ validateBeforeSave: false });
    const delivery = await sendOtpEmail({ to: newEmail, code, purpose: "email-change" });
    res.status(200).json({ success: true, message: "Mã xác nhận đã được gửi đến email mới.", ...(delivery.demoCode ? { demoCode: delivery.demoCode } : {}) });
  } catch {
    res.status(500).json({ success: false, message: "Không thể gửi mã xác nhận." });
  }
};

const confirmEmailChange = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim();
    const user = await User.findById(req.user._id).select("+pendingEmail +emailChangeCodeHash +emailChangeExpiresAt");
    if (!user?.pendingEmail || !user.emailChangeExpiresAt || user.emailChangeExpiresAt < new Date() || user.emailChangeCodeHash !== hashOtp(code)) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn." });
    }
    if (await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })) return res.status(409).json({ success: false, message: "Email này đã được sử dụng." });
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeCodeHash = null;
    user.emailChangeExpiresAt = null;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: "Đổi email thành công.", data: { user: user.toJSON() } });
  } catch {
    res.status(500).json({ success: false, message: "Không thể đổi email." });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  requestPasswordReset,
  resetPassword,
  requestEmailChange,
  confirmEmailChange,
};
