require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Event = require("./models/Event");
const Registration = require("./models/Registration");
const Notification = require("./models/Notification");
const Feedback = require("./models/Feedback");

const users = [
  {
    _id: "66f1a1010000000000000001",
    studentId: "SV01",
    name: "Nguyễn Văn A",
    email: "sv01@iuh.edu.vn",
    password: "123456",
    faculty: "Khoa Công nghệ thông tin",
    point: 120,
    role: "student",
    avatar: "https://i.pravatar.cc/300?img=12",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
    status: "active",
  },
  {
    _id: "66f1a1020000000000000002",
    studentId: "SV02",
    name: "Trần Thị Bích",
    email: "sv02@iuh.edu.vn",
    password: "123456",
    faculty: "Khoa Kinh tế",
    point: 85,
    role: "student",
    avatar: "https://i.pravatar.cc/300?img=47",
    avatarUrl: "https://i.pravatar.cc/300?img=47",
    status: "active",
  },
  {
    _id: "66f1a1030000000000000003",
    studentId: "AD01",
    name: "Ban Quản Trị Đoàn Hội",
    email: "admin.doan@iuh.edu.vn",
    password: "admin123",
    faculty: "Phòng Công tác sinh viên",
    point: 500,
    role: "admin",
    avatar: "https://i.pravatar.cc/300?img=5",
    avatarUrl: "https://i.pravatar.cc/300?img=5",
    status: "active",
  },
];

const events = require("./data/seedEvents");

const registrations = [
  {
    _id: "66f1b3010000000000000001",
    eventId: "66f1e2010000000000000001",
    userId: "66f1a1010000000000000001",
    participantRole: "attendee",
    status: "registered",
    qrCode: "EVENTMATE:66f1b3010000000000000001",
    registeredAt: new Date("2026-09-20T10:00:00.000Z"),
    checkInTime: new Date("2026-10-15T08:30:00.000Z"),
    checkOutTime: null,
  },
  {
    _id: "66f1b3020000000000000002",
    eventId: "66f1e2020000000000000002",
    userId: "66f1a1010000000000000001",
    participantRole: "volunteer",
    status: "checked_in",
    qrCode: "EVENTMATE:66f1b3020000000000000002",
    registeredAt: new Date("2026-09-20T11:00:00.000Z"),
    checkInTime: new Date("2026-09-25T13:45:00.000Z"),
    checkOutTime: null,
  },
  {
    _id: "66f1b3030000000000000003",
    eventId: "66f1e2040000000000000004",
    userId: "66f1a1010000000000000001",
    participantRole: "attendee",
    status: "completed",
    qrCode: "EVENTMATE:66f1b3030000000000000003",
    registeredAt: new Date("2026-08-01T09:30:00.000Z"),
    checkInTime: new Date("2026-08-10T08:15:30.000Z"),
    checkOutTime: new Date("2026-08-20T16:55:00.000Z"),
  },
];

const feedbacks = [
  {
    _id: "66f1f4010000000000000001",
    eventId: "66f1e2040000000000000004",
    userId: "66f1a1020000000000000002",
    rating: 5,
    comment:
      "Cuộc thi tổ chức rất chuyên nghiệp, ban giám khảo góp ý rất chi tiết cho sản phẩm nghiên cứu của nhóm mình!",
    createdAt: new Date("2026-08-21T09:00:00.000Z"),
  },
  {
    _id: "66f1f4020000000000000002",
    eventId: "66f1e2050000000000000005",
    userId: "66f1a1020000000000000002",
    rating: 4,
    comment:
      "Các bạn tình nguyện viên hướng dẫn nhiệt tình, chỉ tiếc là thời gian xếp hàng hơi lâu một chút.",
    createdAt: new Date("2026-07-05T14:30:00.000Z"),
  },
];

const notifications = [
  {
    _id: "66f1c5010000000000000001",
    userId: "66f1a1010000000000000001",
    title: "Đăng ký sự kiện thành công",
    body: "Bạn đã đăng ký tham gia 'Hội thảo Trí tuệ Nhân tạo và Ứng dụng trong Kỹ thuật 2026' thành công.",
    isRead: false,
    createdAt: new Date("2026-09-20T10:00:00.000Z"),
  },
  {
    _id: "66f1c5020000000000000002",
    userId: "66f1a1010000000000000001",
    title: "Nhắc nhở sự kiện sắp diễn ra",
    body: "Workshop 'Kỹ năng Thuyết trình & Đàm phán chuyên nghiệp' sẽ bắt đầu vào 13:30 ngày mai.",
    isRead: true,
    createdAt: new Date("2026-09-24T08:00:00.000Z"),
  },
  {
    _id: "66f1c5030000000000000003",
    userId: "66f1a1020000000000000002",
    title: "Cập nhật điểm rèn luyện",
    body: "Bạn vừa được cộng 15 điểm rèn luyện từ sự kiện 'Ngày hội Hiến máu Tình nguyện - Giọt Hồng IUH'.",
    isRead: false,
    createdAt: new Date("2026-07-06T09:00:00.000Z"),
  },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/studenteventapp";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing
    await Event.deleteMany({});
    await User.deleteMany({});
    await Registration.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});

    // Seed Users
    for (const u of users) {
      await User.create(u);
    }
    console.log(`Seeded ${users.length} users successfully (SV01, SV02, AD01).`);

    // Seed Events
    const createdEvents = await Event.insertMany(events);
    console.log(`Seeded ${createdEvents.length} events successfully.`);

    // Seed Registrations
    const createdRegs = await Registration.insertMany(registrations);
    console.log(`Seeded ${createdRegs.length} registrations successfully.`);

    // Seed Feedbacks
    const createdFeedbacks = await Feedback.insertMany(feedbacks);
    console.log(`Seeded ${createdFeedbacks.length} feedbacks successfully.`);

    // Seed Notifications
    const createdNotifs = await Notification.insertMany(notifications);
    console.log(`Seeded ${createdNotifs.length} notifications successfully.`);

    console.log("Seeding completed 100% matching team schema!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedData();
