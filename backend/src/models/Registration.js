const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participantRole: {
      type: String,
      enum: ["attendee", "volunteer"],
      default: "attendee",
    },
    status: {
      type: String,
      enum: ["registered", "waitlist", "checked_in", "completed", "cancelled", "absent"],
      default: "registered",
    },
    checkInMethod: {
      type: String,
      enum: ["qr_scan", "dynamic_qr", "passcode", "manual_admin", "admin_manual", "appeal"],
      default: "qr_scan",
    },
    userLocation: {
      latitude: Number,
      longitude: Number,
      distanceMeters: Number,
      accuracy: Number,
      verified: Boolean,
    },
    qrCode: {
      type: String,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    waitlistPosition: { type: Number, default: null },
    note: { type: String, default: "" },
    certificateCode: { type: String, default: null },
    appeal: {
      reason: String,
      proofImageUrl: String,
      status: { type: String, enum: ["pending", "approved", "rejected"], default: null },
      reviewerNote: String,
      reviewedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

module.exports = Registration;
