const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, "Faculty is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    time: {
      start: {
        type: Date,
        required: [true, "Start time is required"],
      },
      end: {
        type: Date,
        required: [true, "End time is required"],
      },
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    coordinates: {
      latitude: { type: Number, default: 10.82216 },
      longitude: { type: Number, default: 106.68761 },
      radiusMeters: { type: Number, default: 300 },
    },
    checkInPasscode: {
      type: String,
      default: "889900",
    },
    maxSlots: {
      type: Number,
      default: 100,
    },
    waitlistSlots: {
      type: Number,
      default: 20,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    trainingPoints: {
      type: Number,
      default: 0,
    },
    aiSummary: {
      what: { type: String, default: "" },
      when: { type: String, default: "" },
      where: { type: String, default: "" },
      benefits: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "published", "registration_closed", "upcoming", "ongoing", "completed", "cancelled", "past"],
      default: "upcoming",
    },
    semesterId: { type: String, default: null },
    qrCode: { type: String, default: null },
    targetFaculties: { type: [String], default: [] },
    targetCohorts: { type: [String], default: [] },
    cancellationDeadline: { type: Date, default: null },
    livestreamUrl: { type: String, default: null },
    attachments: {
      type: [{ name: String, url: String }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
