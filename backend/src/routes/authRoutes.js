const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);
router.post("/change-email/request", protect, requestEmailChange);
router.post("/change-email/confirm", protect, confirmEmailChange);

module.exports = router;
