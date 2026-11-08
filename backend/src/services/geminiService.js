const { GoogleGenAI, Type } = require("@google/genai");

/**
 * Định dạng thời gian thân thiện cho sinh viên Việt Nam
 */
const formatDateTime = (dateVal) => {
  if (!dateVal) return "Chưa có thông tin";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Chưa có thông tin";
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa có thông tin";
  }
};

/**
 * Bộ tạo tóm tắt thông minh dự phòng (Deterministic AI Fallback Generator)
 * Đảm bảo 100% người dùng luôn nhận được tóm tắt sự kiện chất lượng cao
 * ngay cả khi API Key chưa cấu hình, mạng gián đoạn hoặc Gemini hết quota.
 */
const generateFallbackSummary = (event) => {
  if (!event) {
    return {
      what: "Sự kiện sinh viên Đại học Công nghiệp TP.HCM (IUH).",
      when: "Xem chi tiết tại thẻ thời gian.",
      where: "Khuôn viên trường ĐH Công nghiệp TP.HCM.",
      benefits: "Cộng điểm rèn luyện và trau dồi kỹ năng mềm.",
    };
  }

  const startTime = formatDateTime(event.time?.start);
  const endTime = formatDateTime(event.time?.end);

  let whenStr = "Chưa có thông tin thời gian cụ thể";
  if (startTime !== "Chưa có thông tin" && endTime !== "Chưa có thông tin") {
    whenStr = `${startTime} — ${endTime}`;
  } else if (startTime !== "Chưa có thông tin") {
    whenStr = `Bắt đầu lúc ${startTime}`;
  }

  let whatStr = "";
  if (event.description && event.description.trim().length > 10) {
    const cleanDesc = event.description.trim().replace(/\s+/g, " ");
    whatStr = cleanDesc.length > 250 ? `${cleanDesc.slice(0, 247)}...` : cleanDesc;
  } else {
    whatStr = `Sự kiện "${event.title || "Chưa đặt tên"}" do ${
      event.organizer || event.faculty || "Đoàn Thanh niên - Hội Sinh viên IUH"
    } tổ chức thuộc danh mục ${event.category || "hoạt động phong trào"}.`;
  }

  const whereStr =
    event.location ||
    "Hội trường E4 / Khuôn viên Trường Đại học Công nghiệp TP.HCM (IUH)";

  const pointsText = event.trainingPoints
    ? `+${event.trainingPoints} điểm rèn luyện (ĐRL)`
    : "Ghi nhận tham gia tích cực";
  const benefitsStr = `${pointsText}, mở rộng kiến thức chuyên môn, hoàn thiện kỹ năng và giao lưu kết nối cùng bạn bè sinh viên IUH.`;

  return {
    what: whatStr,
    when: whenStr,
    where: whereStr,
    benefits: benefitsStr,
  };
};

/**
 * Tóm tắt sự kiện bằng Google Gemini AI (với fallback tự động an toàn)
 */
const summarizeEventWithGemini = async (event) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[GeminiService] GEMINI_API_KEY chưa được cấu hình, dùng fallback summary.");
    return generateFallbackSummary(event);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const startTime = formatDateTime(event.time?.start);
    const endTime = formatDateTime(event.time?.end);

    const prompt = `
Bạn là trợ lý ảo hỗ trợ sinh viên Trường Đại học Công nghiệp TP.HCM (IUH).

Hãy tóm tắt ngắn gọn và chuẩn xác thông tin sự kiện sau bằng tiếng Việt:
- Tiêu đề: ${event.title || "Chưa có"}
- Đơn vị / Khoa: ${event.faculty || "Toàn trường"}
- Phân loại: ${event.category || "Sự kiện sinh viên"}
- Bắt đầu: ${startTime}
- Kết thúc: ${endTime}
- Địa điểm: ${event.location || "IUH"}
- Ban tổ chức: ${event.organizer || "IUH"}
- Mô tả chi tiết: ${event.description || "Chưa có mô tả"}
- Điểm rèn luyện: ${event.trainingPoints ?? 0}

Yêu cầu xuất ra JSON hợp lệ với đúng 4 trường:
{
  "what": "Sự kiện này là gì, mục đích và nội dung cốt lõi (1-2 câu ngắn gọn)",
  "when": "Thời gian diễn ra cụ thể",
  "where": "Địa điểm tổ chức",
  "benefits": "Quyền lợi tham gia, điểm rèn luyện và kỹ năng đạt được"
}
Không thêm bất kỳ định dạng Markdown hay nội dung nào ngoài JSON thuần.
`;

    // Giới hạn timeout 8 giây để không làm treo giao diện mobile
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timeout (8s)")), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            what: { type: Type.STRING },
            when: { type: Type.STRING },
            where: { type: Type.STRING },
            benefits: { type: Type.STRING },
          },
          required: ["what", "when", "where", "benefits"],
        },
        temperature: 0.2,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(response.text);

    return {
      what: parsed.what || generateFallbackSummary(event).what,
      when: parsed.when || generateFallbackSummary(event).when,
      where: parsed.where || generateFallbackSummary(event).where,
      benefits: parsed.benefits || generateFallbackSummary(event).benefits,
    };
  } catch (error) {
    console.warn("[GeminiService] Lỗi khi gọi Gemini AI, chuyển sang bộ tóm tắt thông minh dự phòng:", error.message);
    return generateFallbackSummary(event);
  }
};

module.exports = {
  summarizeEventWithGemini,
  generateFallbackSummary,
};
