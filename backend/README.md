
### Bước 4: Khởi chạy máy chủ
```bash
npm start
# hoặc chạy chế độ tự động reload khi sửa code:
npm run dev
```

**Dấu hiệu máy chủ đã chạy chuẩn xác:**
```text
======================================================
🚀 [Bulletproof Backend] Đang lắng nghe tại:
   - Local:    http://localhost:5000
   - Network:  http://0.0.0.0:5000
   - Health:   http://localhost:5000/api/health
======================================================
✅ [Database] MongoDB Connected: localhost
```

---

## 3. Cách Kết Nối Điện Thoại Vào Backend Để Test & Demo

### Trường hợp A: Điện thoại và máy tính kết nối CHUNG 1 mạng Wi-Fi
1. Đảm bảo điện thoại và máy tính kết nối cùng Wi-Fi (hoặc điện thoại bật Hotspot cho máy tính kết nối vào).
2. Phía Mobile App: Chạy `npm start` ở thư mục gốc. App sẽ tự động nhận diện IP máy tính và kết nối thẳng vào cổng 5000.

### Trường hợp B: Điện thoại dùng mạng 4G/5G (Khác Wi-Fi)
1. Mở một terminal mới trên máy tính chạy Cloudflare Tunnel:
   ```bash
   npx cloudflared tunnel --url http://127.0.0.1:5000
   ```
2. Sao chép đường link có đuôi `.trycloudflare.com` (ví dụ `https://abc-xyz.trycloudflare.com`).
3. Dán vào file `.env` ở thư mục gốc của mobile app:
   ```env
   EXPO_PUBLIC_API_URL=https://abc-xyz.trycloudflare.com/api
   ```
4. Chạy lại Expo với cờ xóa cache:
   ```bash
   npx expo start -c --tunnel ngrok
   ```

---

## 4. Tài khoản Demo có sẵn

| Vai trò | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin.doan@iuh.edu.vn` | `admin123` | Quản lý sự kiện, phát hành QR đếm ngược 45s, duyệt ĐRL |
| **Sinh viên 1** | `sv01@iuh.edu.vn` | `123456` | Quét QR điểm danh, nhận ĐRL, gửi phản hồi |
| **Sinh viên 2** | `sv02@iuh.edu.vn` | `123456` | Đăng ký sự kiện, kiểm tra lịch trình |

---

## 5. Danh sách API Endpoints chính

### Xác thực & Người dùng (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới.
- `POST /api/auth/login`: Đăng nhập, nhận Access & Refresh Token.
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại.

### Sự kiện & QR Token (`/api/events`)
- `GET /api/events`: Lấy danh sách sự kiện (hỗ trợ tìm kiếm, lọc danh mục).
- `GET /api/events/:id`: Lấy chi tiết sự kiện kèm toạ độ GPS hội trường.
- `GET /api/events/:id/qr-token`: **Tạo mã JWT Dynamic QR có thời hạn 45 giây chống chụp ảnh gửi Zalo.**
- `POST /api/events`: Tạo sự kiện mới (Admin).

### Đăng ký & Check-in GPS (`/api/registrations`)
- `GET /api/registrations`: Lấy danh sách đăng ký (`?userId=...` hoặc `?eventId=...`).
- `POST /api/registrations`: Đăng ký tham gia sự kiện.
- `POST /api/registrations/check-in`: **Quét QR điểm danh, kiểm tra hạn 45s token, phát hiện Mock GPS, tính khoảng cách Haversine (bán kính $\le 300$m) và cộng điểm rèn luyện.**

---

## 6. Xử lý lỗi thường gặp (Troubleshooting)

1. **Lỗi `EADDRINUSE 5000` (Cổng 5000 đang bị chiếm)**:
   - Một tiến trình Node.js cũ vẫn đang chạy ngầm.
   - *Cách xử lý trên Windows:* Mở Task Manager -> End task tiến trình `Node.js`, hoặc đổi `PORT=5001` trong file `.env`.
2. **Lỗi `⚠️ [Database] Chưa thể kết nối MongoDB`**:
   - Dịch vụ MongoDB trên máy tính chưa được khởi động.
   - *Cách xử lý:* Bấm `Windows + R` -> gõ `services.msc` -> tìm `MongoDB Server` -> bấm **Start**. Hoặc thay `MONGO_URI` bằng chuỗi kết nối MongoDB Atlas Cloud.
3. **Điện thoại báo `Network Error`**:
   - Expo chưa nhận file `.env` mới.
   - *Cách xử lý:* Tắt Expo và chạy lại bằng `npx expo start -c` để xóa cache.
