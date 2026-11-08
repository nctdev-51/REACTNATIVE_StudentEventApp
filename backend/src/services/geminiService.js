const { GoogleGenAI } = require("@google/genai");

const summarizeEventWithGemini = async (event) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const startTime = event.time?.start
    ? new Date(event.time.start).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
    : "Chưa có thông tin";

  const endTime = event.time?.end
    ? new Date(event.time.end).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
    : "Chưa có thông tin";

  const prompt = `
Bạn là trợ lý hỗ trợ sinh viên tìm hiểu sự kiện.

Hãy tóm tắt sự kiện dưới đây bằng tiếng Việt.
Chỉ sử dụng thông tin được cung cấp, không tự suy đoán.

Thông tin sự kiện:
- Tên: ${event.title}
- Khoa: ${event.faculty}
- Danh mục: ${event.category}
- Thời gian bắt đầu: ${startTime}
- Thời gian kết thúc: ${endTime}
- Địa điểm: ${event.location}
- Đơn vị tổ chức: ${event.organizer}
- Mô tả: ${event.description || "Chưa có mô tả"}
- Điểm rèn luyện: ${event.trainingPoints}

Trả về JSON hợp lệ với đúng 4 trường:
{
  "what": "Sự kiện này là gì?",
  "when": "Thời gian diễn ra",
  "where": "Địa điểm tổ chức",
  "benefits": "Lợi ích khi tham gia"
}

Mỗi trường viết ngắn gọn, dễ hiểu.
Nếu thiếu thông tin, ghi "Chưa có thông tin".
Không thêm nội dung ngoài JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const result = JSON.parse(response.text);

  return {
    what: result.what || "Chưa có thông tin",
    when: result.when || "Chưa có thông tin",
    where: result.where || "Chưa có thông tin",
    benefits: result.benefits || "Chưa có thông tin",
  };
};

module.exports = { summarizeEventWithGemini };
