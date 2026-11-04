const fs = require("fs");
const path = require("path");

const backupPath = path.join(__dirname, "db.backup.json");
const dbPath = path.join(__dirname, "db.json");

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, dbPath);
  console.log("✅ Đã khôi phục dữ liệu ban đầu cho db.json thành công!");
} else {
  console.error("❌ Không tìm thấy file db.backup.json!");
}
