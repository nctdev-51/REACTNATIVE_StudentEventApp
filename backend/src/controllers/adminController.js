const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");

const updateQuota = async (req, res) => {
  try {
    const { maxSlots, waitlistSlots } = req.body;
    if (!Number.isInteger(maxSlots) || maxSlots < 0 || !Number.isInteger(waitlistSlots) || waitlistSlots < 0) {
      return res.status(400).json({ success: false, message: "Quota phải là số nguyên không âm" });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, { maxSlots, waitlistSlots }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Đã cập nhật quota", data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addAttendee = async (req, res) => {
  try {
    const { studentIdOrEmail, fullName } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (!studentIdOrEmail) return res.status(400).json({ success: false, message: "studentIdOrEmail is required" });

    let user = await User.findOne({ $or: [{ studentId: studentIdOrEmail }, { email: String(studentIdOrEmail).toLowerCase() }] });
    if (!user) {
      const clean = String(studentIdOrEmail).trim();
      user = await User.create({
        name: fullName || `Sinh viên ${clean}`,
        studentId: clean.toUpperCase(),
        email: `${clean.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}@iuh.edu.vn`,
        password: "123456",
      });
    }

    const registeredCount = await Registration.countDocuments({ eventId: event._id, status: { $in: ["registered", "checked_in", "completed"] } });
    const existing = await Registration.findOne({ eventId: event._id, userId: user._id });
    const status = registeredCount < event.maxSlots ? "registered" : "waitlist";
    const registration = existing
      ? await Registration.findByIdAndUpdate(existing._id, { status, participantRole: "attendee" }, { new: true })
      : await Registration.create({ eventId: event._id, userId: user._id, participantRole: "attendee", status, waitlistPosition: status === "waitlist" ? await Registration.countDocuments({ eventId: event._id, status: "waitlist" }) + 1 : null });
    res.status(existing ? 200 : 201).json({ success: true, message: "Đã thêm sinh viên", data: { registration, user } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(req.params.id, { status: "cancelled" }, { new: true });
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
    res.json({ success: true, message: "Đã xoá sinh viên khỏi danh sách", data: registration });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const quickCheckIn = async (req, res) => {
  try {
    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status: "checked_in", checkInMethod: "manual_admin", checkInTime: new Date() },
      { new: true },
    );
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
    res.json({ success: true, message: "Điểm danh nhanh thành công", data: registration });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { updateQuota, addAttendee, deleteRegistration, quickCheckIn };
