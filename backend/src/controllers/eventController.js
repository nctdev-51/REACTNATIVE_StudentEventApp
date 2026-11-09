const Event = require("../models/Event");
const jwt = require("jsonwebtoken");
const seedEvents = require("../data/seedEvents");
const { summarizeEventWithGemini, generateFallbackSummary } = require("../services/geminiService");
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

    let events = [];
    try {
      events = await Event.find(filter).sort({ "time.start": 1 });
    } catch (dbErr) {
      console.warn("[getEvents] DB offline/error, using seedEvents fallback:", dbErr.message);
      events = seedEvents;
    }

    if (!events || events.length === 0) {
      events = seedEvents;
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: seedEvents.length,
      data: seedEvents,
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    let event = null;
    const requestedId = req.params.id;

    if (requestedId && requestedId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        event = await Event.findById(requestedId);
      } catch (dbErr) {
        console.warn("[getEventById] DB lookup error:", dbErr.message);
      }
    }

    if (!event) {
      event = seedEvents.find(
        (e) => String(e._id) === String(requestedId) || String(e.id) === String(requestedId)
      );
    }

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
    const fallback = seedEvents.find(
      (e) => String(e._id) === String(req.params.id) || String(e.id) === String(req.params.id)
    );
    if (fallback) {
      return res.status(200).json({
        success: true,
        data: fallback,
      });
    }
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
    // Fail immediately with an actionable response when MongoDB is unavailable.
    // Without this guard Mongoose buffers the write and the mobile app receives
    // an unhelpful timeout after several seconds.
    if (Event.db.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Không thể tạo sự kiện vì cơ sở dữ liệu chưa kết nối. Vui lòng kiểm tra MONGO_URI và khởi động MongoDB.",
      });
    }

    // Never trust a client-created `_id`; Mongoose must generate the ObjectId.
    // This keeps old Expo bundles from crashing the API with `evt_<timestamp>`.
    const { _id, id, createdAt, updatedAt, aiSummary, ...payload } = req.body;
    const start = new Date(payload.time?.start);
    const end = new Date(payload.time?.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: "Thời gian bắt đầu/kết thúc không hợp lệ.",
      });
    }

    const maxSlots = Number(payload.maxSlots ?? 100);
    const waitlistSlots = Number(payload.waitlistSlots ?? 20);
    const trainingPoints = Number(payload.trainingPoints ?? 0);
    if (!Number.isInteger(maxSlots) || maxSlots < 1 || !Number.isInteger(waitlistSlots) || waitlistSlots < 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng chính thức phải lớn hơn 0 và danh sách chờ không được âm.",
      });
    }
    if (!Number.isFinite(trainingPoints) || trainingPoints < 0) {
      return res.status(400).json({
        success: false,
        message: "Điểm rèn luyện không hợp lệ.",
      });
    }

    // The authenticated account, rather than a client-supplied string, owns the
    // organizer field. This also preserves compatibility with older app builds
    // that did not include the required field.
    const organizer = req.user?.name || req.user?.fullName || payload.organizer || "Ban Chấp hành Đoàn trường";
    const event = await Event.create({
      ...payload,
      organizer,
      maxSlots,
      waitlistSlots,
      trainingPoints,
      time: { start, end },
    });
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
    const existing = await Event.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const { _id, id, createdAt, updatedAt, ...updatePayload } = req.body;

    if (updatePayload.time) {
      const nextStart = new Date(updatePayload.time.start ?? existing.time?.start);
      const nextEnd = new Date(updatePayload.time.end ?? existing.time?.end);
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime()) || nextEnd <= nextStart) {
        return res.status(400).json({
          success: false,
          message: "Thời gian bắt đầu/kết thúc không hợp lệ.",
        });
      }
      updatePayload.time = { start: nextStart, end: nextEnd };
    }

    if (updatePayload.maxSlots !== undefined) {
      const maxSlots = Number(updatePayload.maxSlots);
      if (!Number.isInteger(maxSlots) || maxSlots < 1) {
        return res.status(400).json({
          success: false,
          message: "Số lượng chính thức phải lớn hơn 0.",
        });
      }
      updatePayload.maxSlots = maxSlots;
    }

    if (updatePayload.waitlistSlots !== undefined) {
      const waitlistSlots = Number(updatePayload.waitlistSlots);
      if (!Number.isInteger(waitlistSlots) || waitlistSlots < 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng danh sách chờ không được âm.",
        });
      }
      updatePayload.waitlistSlots = waitlistSlots;
    }

    if (updatePayload.trainingPoints !== undefined) {
      const trainingPoints = Number(updatePayload.trainingPoints);
      if (!Number.isFinite(trainingPoints) || trainingPoints < 0) {
        return res.status(400).json({
          success: false,
          message: "Điểm rèn luyện không được âm.",
        });
      }
      updatePayload.trainingPoints = trainingPoints;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });
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
    let event = null;
    const requestedId = req.params.id;

    // 1. Thử tìm event trong database (nếu MongoDB đang chạy)
    if (requestedId && requestedId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        event = await Event.findById(requestedId).lean();
      } catch (dbErr) {
        console.warn("[summarizeEvent] DB lookup error:", dbErr.message);
      }
    }

    // 2. Nếu DB không có hoặc lỗi, thử dùng dữ liệu event được client gửi trong body
    if (!event && req.body && (req.body.event || req.body.title)) {
      event = req.body.event || req.body;
    }

    // 3. Nếu vẫn không có, tìm trong danh mục seedEvents
    if (!event && requestedId) {
      event = seedEvents.find(
        (e) => String(e._id) === String(requestedId) || String(e.id) === String(requestedId)
      );
    }

    // 4. Fallback cuối: tự tạo event giả định với tiêu đề nếu có
    if (!event) {
      event = {
        title: req.body?.title || "Sự kiện sinh viên IUH",
        faculty: "Đại học Công nghiệp TP.HCM",
        category: "Hoạt động sinh viên",
        location: "Khuôn viên trường IUH",
        organizer: "Đoàn - Hội IUH",
        trainingPoints: 5,
        description: "Sự kiện dành cho sinh viên IUH nâng cao trải nghiệm học tập và rèn luyện kỹ năng.",
      };
    }

    const summary = await summarizeEventWithGemini(event);

    return res.status(200).json({
      success: true,
      message: "Event summarized successfully",
      data: summary,
    });
  } catch (error) {
    console.error("AI Summary Error:", error);

    // Không bao giờ trả về lỗi 502 làm vỡ màn hình di động, luôn fallback an toàn
    const fallbackSummary = generateFallbackSummary(
      req.body?.event || req.body || { title: "Sự kiện sinh viên IUH" }
    );

    return res.status(200).json({
      success: true,
      message: "Event summarized successfully (fallback mode)",
      data: fallbackSummary,
    });
  }
};

// @desc    Tạo Dynamic QR Token có thời hạn 45 giây chống chụp màn hình
// @route   GET /api/events/:id/qr-token
// @access  Public / Admin
const getEventQrToken = async (req, res) => {
  try {
    const { id } = req.params;
    let event = null;
    if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        event = await Event.findById(id);
      } catch {}
    }
    if (!event && id) {
      event = seedEvents.find(
        (e) => String(e._id) === String(id) || String(e.id) === String(id)
      );
    }

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
    let event = null;
    if (req.params.id && String(req.params.id).match(/^[0-9a-fA-F]{24}$/)) {
      try {
        event = await Event.findById(req.params.id);
      } catch {}
    }
    if (!event && req.params.id) {
      event = seedEvents.find(
        (e) => String(e._id) === String(req.params.id) || String(e.id) === String(req.params.id)
      );
    }
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (!event.time?.start || !event.time?.end) {
      return res.status(400).json({ success: false, message: "Event time is missing" });
    }
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
