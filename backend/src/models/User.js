const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "organizer", "admin"],
      default: "student",
    },
    studentId: {
      type: String,
      trim: true,
      default: null,
    },
    faculty: {
      type: String,
      trim: true,
      default: null,
    },
    point: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetCodeHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    pendingEmail: { type: String, default: null, select: false },
    emailChangeCodeHash: { type: String, default: null, select: false },
    emailChangeExpiresAt: { type: Date, default: null, select: false },
    preferences: {
      enablePush: { type: Boolean, default: true },
      enableEmail: { type: Boolean, default: false },
      notifyScheduleChange: { type: Boolean, default: true },
      notifyUrgent: { type: Boolean, default: true },
      notifyReminders: { type: Boolean, default: true },
      quietHoursEnabled: { type: Boolean, default: false },
      quietHoursStart: { type: String, default: "22:00" },
      quietHoursEnd: { type: String, default: "06:00" },
      reminderMinutesBefore: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  // Sync avatar and avatarUrl
  if (obj.avatarUrl && !obj.avatar) obj.avatar = obj.avatarUrl;
  if (obj.avatar && !obj.avatarUrl) obj.avatarUrl = obj.avatar;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
