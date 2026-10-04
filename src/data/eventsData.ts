import { Event } from "../types/event";

export const eventsData: Event[] = [
  {
    _id: "66f1e2010000000000000001",
    title:
      "Hội thảo Trí tuệ Nhân tạo và Ứng dụng trong Kỹ thuật 2026",
    faculty: "Khoa Công nghệ thông tin",
    category: "Học thuật",

    time: {
      start: "2026-10-15T08:00:00.000Z",
      end: "2026-10-15T11:30:00.000Z",
    },

    location:
      "Hội trường E4, Trường Đại học Công nghiệp TP.HCM",

    organizer:
      "Khoa Công nghệ thông tin và Đoàn Thanh niên IUH",

    description:
      "Hội thảo chuyên sâu về các tiến bộ mới nhất trong lĩnh vực GenAI, Machine Learning và định hướng nghề nghiệp kỹ sư AI cho sinh viên.",

    images: [
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    ],

    trainingPoints: 10,

    aiSummary: {
      what:
        "Hội thảo chuyên đề công nghệ AI và ứng dụng thực tiễn trong kỹ thuật.",
      when:
        "08:00 - 11:30 ngày 15/10/2026.",
      where:
        "Hội trường E4, cơ sở chính IUH.",
      benefits:
        "Cộng 10 điểm rèn luyện, cấp giấy chứng nhận tham gia, cơ hội nhận học bổng và kết nối doanh nghiệp.",
    },

    status: "upcoming",
  },

  {
    _id: "66f1e2020000000000000002",
    title:
      "Workshop Kỹ năng Thuyết trình & Đàm phán chuyên nghiệp",
    faculty: "Khoa Quản trị kinh doanh",
    category: "Kỹ năng",

    time: {
      start: "2026-09-25T13:30:00.000Z",
      end: "2026-09-25T16:30:00.000Z",
    },

    location:
      "Phòng Hội thảo B3.02, Tòa nhà B",

    organizer:
      "Trung tâm Hỗ trợ sinh viên IUH",

    description:
      "Trang bị bộ kỹ năng mềm then chốt giúp sinh viên tự tin làm việc nhóm, bảo vệ đồ án và phỏng vấn xin việc.",

    images: [
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    ],

    trainingPoints: 8,

    aiSummary: {
      what:
        "Buổi đào tạo thực hành kỹ năng thuyết trình, phản biện và giao tiếp chuyên nghiệp.",
      when:
        "13:30 - 16:30 ngày 25/09/2026.",
      where:
        "Phòng B3.02, Đại học Công nghiệp TP.HCM.",
      benefits:
        "Cộng 8 điểm rèn luyện, tài liệu độc quyền và thực hành trực tiếp với chuyên gia.",
    },

    status: "ongoing",
  },

  {
    _id: "66f1e2030000000000000003",
    title:
      "Giải Bóng đá Nam Sinh viên IUH Champions League 2026",
    faculty: "Toàn trường",
    category: "Thể thao",

    time: {
      start: "2026-11-01T07:00:00.000Z",
      end: "2026-11-15T17:00:00.000Z",
    },

    location:
      "Sân vận động Quân khu 7 / Sân bóng đá IUH",

    organizer:
      "Đoàn Thanh niên - Hội Sinh viên IUH",

    description:
      "Giải thể thao truyền thống quy tụ hơn 32 đội bóng đại diện các khoa viện, nhằm nâng cao tinh thần rèn luyện sức khỏe.",

    images: [
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    ],

    trainingPoints: 15,

    aiSummary: {
      what:
        "Giải bóng đá thường niên quy mô toàn trường dành cho sinh viên nam.",
      when:
        "Từ ngày 01/11/2026 đến 15/11/2026.",
      where:
        "Sân bóng đá trường ĐH Công nghiệp TP.HCM.",
      benefits:
        "Cộng 15 điểm rèn luyện cho VĐV/Cổ động viên tích cực, huy chương và cúp vô địch.",
    },

    status: "upcoming",
  },
];