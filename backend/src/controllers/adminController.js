const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { createAndDeliverNotification } = require("../services/notificationService");
const AuditLog = require("../models/AuditLog");
const seedEvents = require("../data/seedEvents");
const {
  renumberWaitlist,
  promoteNextWaitlistIfSlotAvailable,
} = require("../services/waitlistService");

const findEventOrSeed = async (id) => {
  if (!id) return null;
  let event = null;
  if (String(id).match(/^[0-9a-fA-F]{24}$/)) {
    event = await Event.findById(id);
  }
  if (!event) {
    const seeded = seedEvents.find(
      (e) => String(e._id) === String(id) || String(e.id) === String(id)
    );
    if (seeded) {
      const { id: _idAlias, _id, ...rest } = seeded;
      event = await Event.findByIdAndUpdate(
        _id,
        { $setOnInsert: { _id, ...rest } },
        { upsert: true, new: true }
      );
    }
  }
  return event;
};

const updateQuota = async (req, res) => {
  try {
    const { maxSlots, waitlistSlots } = req.body;
    if (!Number.isInteger(maxSlots) || maxSlots < 1 || !Number.isInteger(waitlistSlots) || waitlistSlots < 0) {
      return res.status(400).json({ success: false, message: "Chỗ chính thức phải >= 1 và danh sách chờ không được âm" });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { maxSlots, waitlistSlots },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const promoted = await promoteNextWaitlistIfSlotAvailable(event._id, event);
    const promotedCount = promoted.length;
    res.json({
      success: true,
      message:
        promotedCount > 0
          ? `Đã cập nhật quota và tự động đôn ${promotedCount} sinh viên từ danh sách chờ lên chính thức!`
          : "Đã cập nhật quota",
      promotedCount,
      data: event,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addAttendee = async (req, res) => {
  try {
    const { studentIdOrEmail, fullName } = req.body;
    const event = await findEventOrSeed(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (!studentIdOrEmail || !String(studentIdOrEmail).trim()) {
      return res.status(400).json({ success: false, message: "studentIdOrEmail is required" });
    }

    const cleanInput = String(studentIdOrEmail).trim();
    let user = await User.findOne({
      $or: [
        { studentId: cleanInput.toUpperCase() },
        { studentId: cleanInput },
        { email: cleanInput.toLowerCase() },
      ],
    });
    if (!user) {
      user = await User.create({
        name: fullName || `Sinh viên ${cleanInput}`,
        studentId: cleanInput.toUpperCase(),
        email: `${cleanInput.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}@iuh.edu.vn`,
        password: "123456",
      });
    }

    const existing = await Registration.findOne({ eventId: event._id, userId: user._id });
    if (existing && existing.status !== "cancelled") {
      return res.status(409).json({
        success: false,
        message: "Sinh viên đã có trong danh sách tham gia hoặc đã điểm danh sự kiện này",
      });
    }

    const [registeredCount, waitlistCount] = await Promise.all([
      Registration.countDocuments({ eventId: event._id, status: { $in: ["registered", "checked_in", "completed"] } }),
      Registration.countDocuments({ eventId: event._id, status: "waitlist" }),
    ]);

    const maxSlots = typeof event.maxSlots === "number" ? event.maxSlots : 100;
    const waitlistSlots = typeof event.waitlistSlots === "number" ? event.waitlistSlots : 20;

    let status;
    let waitlistPosition = null;
    if (registeredCount < maxSlots) {
      status = "registered";
    } else if (waitlistCount < waitlistSlots) {
      status = "waitlist";
      waitlistPosition = waitlistCount + 1;
    } else {
      return res.status(409).json({
        success: false,
        message: "Sự kiện đã hết chỗ chính thức và danh sách chờ!",
      });
    }

    const registration = existing
      ? await Registration.findOneAndUpdate(
          { _id: existing._id, status: "cancelled" },
          { $set: { status, participantRole: "attendee", waitlistPosition, registeredAt: new Date(), checkInTime: null } },
          { new: true }
        )
      : await Registration.create({
          eventId: event._id,
          userId: user._id,
          participantRole: "attendee",
          status,
          waitlistPosition,
        });

    if (!registration) {
      return res.status(409).json({ success: false, message: "Sinh viên đã có trong danh sách sự kiện" });
    }

    try {
      await createAndDeliverNotification({
        userId: user._id,
        eventId: event._id,
        title: status === "registered" ? "Bạn đã được thêm vào sự kiện" : "Bạn đã được thêm vào danh sách chờ",
        body:
          status === "registered"
            ? `Ban Tổ chức đã thêm bạn vào danh sách chính thức sự kiện '${event.title}'.`
            : `Ban Tổ chức đã thêm bạn vào danh sách chờ (#${waitlistPosition}) sự kiện '${event.title}'.`,
        category: "schedule_change",
      });
    } catch {}

    res.status(existing ? 200 : 201).json({ success: true, message: "Đã thêm sinh viên", data: { registration, user } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const existing = await Registration.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Registration not found" });
    if (existing.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Đăng ký này đã bị hủy trước đó" });
    }

    const previousStatus = existing.status;
    const registration = await Registration.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: "cancelled" } },
      { $set: { status: "cancelled", waitlistPosition: null } },
      { new: true }
    );
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });

    let promoted = [];
    if (["registered", "checked_in", "completed"].includes(previousStatus)) {
      promoted = await promoteNextWaitlistIfSlotAvailable(registration.eventId);
    } else if (previousStatus === "waitlist") {
      await renumberWaitlist(registration.eventId);
    }

    res.json({
      success: true,
      message:
        promoted.length > 0
          ? `Đã xoá sinh viên khỏi danh sách và đôn ${promoted.length} sinh viên từ danh sách chờ lên chính thức!`
          : "Đã xoá sinh viên khỏi danh sách",
      data: { registration, promotedCount: promoted.length },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const quickCheckIn = async (req, res) => {
  try {
    const existing = await Registration.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Registration not found" });

    if (existing.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Không thể điểm danh đăng ký đã bị hủy" });
    }
    if (existing.status === "waitlist") {
      return res.status(400).json({ success: false, message: "Sinh viên đang ở danh sách chờ, chưa nằm trong danh sách chính thức" });
    }
    if (["checked_in", "completed"].includes(existing.status)) {
      return res.status(400).json({ success: false, message: "Sinh viên đã điểm danh sự kiện này trước đó" });
    }

    const registration = await Registration.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $nin: ["checked_in", "completed", "cancelled", "waitlist"] },
      },
      {
        $set: {
          status: "checked_in",
          checkInMethod: "manual_admin",
          checkInTime: new Date(),
        },
      },
      { new: true }
    );
    if (!registration) {
      return res.status(400).json({ success: false, message: "Sinh viên đã điểm danh sự kiện này trước đó" });
    }

    const event = await Event.findById(registration.eventId);
    if (event && event.trainingPoints > 0) {
      await User.findByIdAndUpdate(registration.userId, {
        $inc: { point: event.trainingPoints },
      });
    }

    res.json({ success: true, message: "Điểm danh nhanh thành công", data: registration });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const logs = await AuditLog.find()
      .populate("actorId", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateQuota, addAttendee, deleteRegistration, quickCheckIn, getAuditLogs };
