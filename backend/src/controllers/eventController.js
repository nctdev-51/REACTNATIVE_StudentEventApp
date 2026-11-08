const Event = require("../models/Event");
const jwt = require("jsonwebtoken");
const { summarizeEventWithGemini } = require("../services/geminiService");
// @desc    Get all events with optional filters (category, status, search)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category && category !== "Tất cả") {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(filter).sort({ "time.start": 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching events",
      error: error.message,
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching event detail",
      error: error.message,
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin / Organizer)
const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin / Organizer)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Event deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate AI summary for an event
// @route   POST /api/events/:id/summarize
// @access  Public
const summarizeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const summary = await summarizeEventWithGemini(event);

    return res.status(200).json({
      success: true,
      message: "Event summarized successfully",
      data: summary,
    });
  } catch (error) {
    console.error("AI Summary Error:", error);

    return res.status(502).json({
      success: false,
      message: "Không thể tạo tóm tắt sự kiện bằng AI. Vui lòng thử lại sau.",
    });
  }
};

// @desc    Tạo Dynamic QR Token có thời hạn 45 giây chống chụp màn hình
// @route   GET /api/events/:id/qr-token
// @access  Public / Admin
const getEventQrToken = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại hoặc đã bị gỡ bỏ",
      });
    }

    const TTL_SECONDS = 45; // Mã QR tự làm mới mỗi 45s (Anti-Screensharing)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + TTL_SECONDS;
    const secret = process.env.JWT_SECRET || "studenteventapp_secret_key_2026";

    const token = jwt.sign(
      {
        eventId: event._id.toString(),
        title: event.title,
        type: "dynamic_qr",
        iat: now,
      },
      secret,
      { expiresIn: `${TTL_SECONDS}s` }
    );

    const eventIdStr = event._id.toString();
    const schemeUrl = `studentevent://checkin?eventId=${eventIdStr}&token=${token}&exp=${expiresAt}`;
    const universalUrl = `https://studentevent.iuh.edu.vn/checkin?eventId=${eventIdStr}&token=${token}&exp=${expiresAt}`;

    res.status(200).json({
      success: true,
      message: "Tạo Dynamic QR Token bảo mật thành công",
      data: {
        eventId: eventIdStr,
        eventTitle: event.title,
        token,
        expiresAt,
        ttlSeconds: TTL_SECONDS,
        schemeUrl,
        universalUrl,
        qrPayload: schemeUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi tạo QR Token: " + error.message,
    });
  }
};

const getCalendarIcs = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    const toIcsDate = (date) => new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const escapeIcs = (value = "") => String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StudentEventApp//VI",
      "BEGIN:VEVENT",
      `UID:${event._id}@studenteventapp`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(event.time.start)}`,
      `DTEND:${toIcsDate(event.time.end)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.location)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    res.type("text/calendar; charset=utf-8");
    res.attachment(`event-${event._id}.ics`);
    res.send(`${lines.join("\r\n")}\r\n`);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  summarizeEvent,
  getEventQrToken,
  getCalendarIcs,
};
