const User = require("../models/User");

const publicUser = (user) => user?.toJSON ? user.toJSON() : user;

const getUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(publicUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, fullName, email, password = "123456", studentId, faculty, phone, point, role } = req.body;
    const user = await User.create({
      name: name || fullName,
      email,
      password,
      studentId,
      faculty,
      phone,
      point: Number.isFinite(Number(point)) ? Number(point) : 0,
      role: role === "admin" ? "admin" : "student",
    });
    res.status(201).json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowed = ["name", "fullName", "studentId", "faculty", "phone", "point", "role", "status", "isActive", "avatar", "avatarUrl"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key === "fullName" ? "name" : key] = req.body[key];
    if (update.point !== undefined) {
      const parsedPoint = Number(update.point);
      if (!Number.isFinite(parsedPoint) || parsedPoint < 0) {
        return res.status(400).json({ success: false, message: "Điểm rèn luyện phải là số không âm" });
      }
      update.point = parsedPoint;
    }
    if (update.role && !["student", "admin", "organizer"].includes(update.role)) delete update.role;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { userId: String(user._id), ...user.preferences.toObject() } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const allowed = ["enablePush", "enableEmail", "notifyScheduleChange", "notifyUrgent", "notifyReminders", "quietHoursEnabled", "quietHoursStart", "quietHoursEnd", "reminderMinutesBefore"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[`preferences.${key}`] = req.body[key];
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { userId: String(user._id), ...user.preferences.toObject() } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, getPreferences, updatePreferences };
