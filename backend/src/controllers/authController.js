const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper: Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, (process.env.JWT_SECRET || "studenteventapp_secret_key_2026"), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, (process.env.JWT_SECRET || "studenteventapp_secret_key_2026"), {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, studentId, role, faculty, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      studentId: studentId || null,
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select("+password +refreshToken");
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
    const user = await User.findById(req.user._id).select("+refreshToken");
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
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
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
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

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
};
