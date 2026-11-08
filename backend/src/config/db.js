const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/studenteventapp";
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ [Database] Chưa thể kết nối MongoDB (${error.message}).`);
    console.warn(`👉 Server Express vẫn đang chạy để phục vụ Health check & API.`);
    console.warn(`👉 Vui lòng khởi động service MongoDB hoặc cập nhật MONGO_URI (MongoDB Atlas) trong backend/.env.`);
  }
};

module.exports = connectDB;
