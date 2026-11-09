const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");

const renumberWaitlist = async (eventId) => {
  if (!eventId) return;
  const waitlistEntries = await Registration.find({
    eventId,
    status: "waitlist",
  }).sort({ waitlistPosition: 1, createdAt: 1 });

  for (let i = 0; i < waitlistEntries.length; i += 1) {
    const nextPos = i + 1;
    if (waitlistEntries[i].waitlistPosition !== nextPos) {
      await Registration.updateOne(
        { _id: waitlistEntries[i]._id, status: "waitlist" },
        { $set: { waitlistPosition: nextPos } }
      );
    }
  }
};

const promoteNextWaitlistIfSlotAvailable = async (eventId, eventDoc = null) => {
  if (!eventId) return [];
  const event = eventDoc || (await Event.findById(eventId));
  const maxSlots = typeof event?.maxSlots === "number" ? event.maxSlots : 100;

  let confirmedCount = await Registration.countDocuments({
    eventId,
    status: { $in: ["registered", "checked_in", "completed"] },
  });

  const promoted = [];

  while (confirmedCount < maxSlots) {
    const next = await Registration.findOneAndUpdate(
      { eventId, status: "waitlist" },
      { $set: { status: "registered", waitlistPosition: null } },
      { sort: { waitlistPosition: 1, createdAt: 1 }, new: true }
    );
    if (!next) break;

    confirmedCount += 1;
    promoted.push(next);

    try {
      await Notification.create({
        userId: next.userId,
        eventId: next.eventId,
        title: "Bạn đã được chuyển lên danh sách chính thức!",
        body: `Có suất trống mới cho sự kiện '${event?.title || "Sự kiện sinh viên"}'. Bạn đã được tự động chuyển từ danh sách chờ lên danh sách chính thức.`,
        category: "schedule_change",
        isUrgent: true,
      });
    } catch {}
  }

  await renumberWaitlist(eventId);
  return promoted;
};

module.exports = {
  renumberWaitlist,
  promoteNextWaitlistIfSlotAvailable,
};

