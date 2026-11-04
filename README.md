# StudentEventApp - Ứng dụng Quản lý Sự kiện Sinh viên IUH

Đồ án môn học Lập trình cho thiết bị di động (Nhóm 5 thành viên).

---

## 1. Cấu trúc dự án

Dự án gồm 2 phần:

- `StudentEventApp/`: Ứng dụng di động (React Native, Expo SDK 57, Redux Toolkit).
- `backend/`: Máy chủ API (Node.js, Express, MongoDB, JWT).

---

## 2. Hướng dẫn cài đặt và chạy ứng dụng

### Bước 1: Khởi động Backend

1. Đảm bảo MongoDB đang chạy trên máy (mặc định cổng 27017) hoặc có connection string MongoDB Atlas.
2. Mở terminal, vào thư mục backend:
   ```bash
   cd backend
   npm install
   ```
3. Kiểm tra file `.env` tại thư mục `backend/`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/studenteventapp
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```
4. Nạp dữ liệu mẫu ban đầu vào cơ sở dữ liệu:
   ```bash
   npm run seed
   ```
   _(Lệnh này tạo sẵn 6 sự kiện, 3 người dùng, 3 đăng ký mẫu, feedbacks và thông báo)._
5. Khởi động server:
   ```bash
   npm run dev
   ```
   Server chạy tại: `http://localhost:5000`

---

### Bước 2: Khởi động Frontend (StudentEventApp)

1. Mở một terminal mới, vào thư mục ứng dụng:
   ```bash
   cd StudentEventApp
   npm install
   ```
2. Cấu hình IP kết nối Backend trong file `src/services/api.ts`:
   - Chạy trên Web hoặc iOS Simulator: Giữ nguyên mặc định `http://localhost:5000/api`.
   - Chạy trên Android Emulator: Giữ nguyên mặc định `http://10.0.2.2:5000/api`.
   - Chạy trên điện thoại thật (Expo Go qua Wi-Fi):
     - Mở cmd gõ `ipconfig` lấy IPv4 của máy tính (ví dụ: `192.168.1.15`).
     - Đổi giá trị `DEV_LAN_IP` trong `src/services/api.ts` thành IP đó:
       ```typescript
       export const DEV_LAN_IP = "192.168.1.15";
       ```
3. Chạy ứng dụng:
   ```bash
   npm start
   ```

   - Nhấn `a` để chạy trên Android Emulator.
   - Nhấn `w` để chạy trên Web.
   - Hoặc quét mã QR bằng Expo Go trên điện thoại.

---

## 3. Tài khoản thử nghiệm

Dữ liệu đã được tạo sẵn qua lệnh `npm run seed`:

| Vai trò              | Email                   | Mật khẩu   | Ghi chú                              |
| :------------------- | :---------------------- | :--------- | :----------------------------------- |
| Sinh viên (SV01)     | `sv01@iuh.edu.vn`       | `123456`   | Nguyễn Văn A, Khoa CNTT, 120 điểm    |
| Sinh viên (SV02)     | `sv02@iuh.edu.vn`       | `123456`   | Trần Thị Bích, Khoa Kinh tế, 85 điểm |
| Quản trị viên (AD01) | `admin.doan@iuh.edu.vn` | `admin123` | Ban Quản Trị Đoàn Hội, 500 điểm      |

---

## 4. Phân công nhiệm vụ các thành viên

### Hà (Nhiệm vụ 7)

- Đã hoàn thành:
  - Cấu hình Redux Toolkit store và các slices (auth, events, registrations, feedbacks, notifications).
  - Xây dựng Core API Service (`src/services/api.ts`) với Axios interceptors, token refresh, timeout.
  - Giao diện tóm tắt AI (AISummary, AILoading, AIError).
- Cần làm tiếp:
  - Tích hợp API Gemini/ChatGPT để tạo tóm tắt sự kiện tự động theo thời gian thực.

### Nguyên (Nhiệm vụ 4, 5, 6)

- Đã hoàn thành:
  - Cấu hình Navigation System (RootNavigator, MainStack, AuthStack, Bottom Tabs).
  - Màn hình HomeScreen, EventDetailScreen, FilterScreen, SearchBar, CategoryChip.
- Cần làm tiếp:
  - Cấu hình Deep Link (`studenteventapp://event/:id`) trong App.tsx và tính năng chia sẻ link.
  - Chuyển danh sách sự kiện ở HomeScreen sang FlatList có lazy loading / phân trang.

### Tâm (Nhiệm vụ 11, 12)

- Đã hoàn thành:
  - Luồng quét mã QR bằng Expo Camera (QRScannerScreen, CheckInSuccessScreen, CheckInFailedScreen).
  - Tích hợp API điểm danh backend (`/api/registrations/check-in`) và tự động cộng điểm rèn luyện.
- Cần làm tiếp:
  - Tích hợp kiểm tra toạ độ vị trí (Expo Location) để chống điểm danh giả mạo (khoảng cách <= 500m).
  - Tạo module Permission Handler chung (`src/utils/permissionHandler.ts`) để đồng bộ xin quyền Camera, Location.

### Bảo (Nhiệm vụ 8, 9, 10)

- Đã hoàn thành:
  - Giao diện lịch cá nhân MyScheduleScreen kết nối Redux và Backend (lọc Sắp diễn ra / Đã tham gia).
  - Tích hợp Expo Notifications với màn hình thử nghiệm NotificationReminderScreen.
- Cần làm tiếp:
  - Tự động lập lịch Local Notification trước 30 phút khi sinh viên đăng ký sự kiện thành công.
  - Xây dựng các Core Component tái sử dụng bằng Tamagui (Button, Input, Card, Modal) trong `src/components/common/`.

### Nhi (Nhiệm vụ 13, 14)

- Đã hoàn thành:
  - Màn hình ProfileScreen hiển thị thông tin thực tế từ backend, đếm sự kiện, điểm tích luỹ, đăng xuất.
  - Màn hình FeedbackScreen gửi đánh giá sao và nhận xét lưu vào cơ sở dữ liệu.
  - Cấu hình Design Tokens (`src/theme/index.ts`).
- Cần làm tiếp:
  - Thêm Animation & Gesture bằng Reanimated (Skeleton loading khi tải dữ liệu, vuốt Card để xóa/hủy).
  - Hoàn thiện Tamagui Tokens & Themes trong `tamagui.config.ts` để hỗ trợ đổi giao diện Sáng / Tối toàn app.

---

## 5. Quy trình làm việc với Git

1. Lấy code mới nhất từ nhánh `main`:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Tạo nhánh tính năng riêng:
   ```bash
   git checkout -b feature/<ten-thanh-vien>
   ```
3. Sau khi hoàn thành, commit và đẩy lên GitHub:
   ```bash
   git add .
   git commit -m "feat: mô tả công việc hoàn thành"
   git push origin feature/<ten-thanh-vien>
   ```
4. Tạo Pull Request trên GitHub vào nhánh `main` để nhóm kiểm tra trước khi gộp.
