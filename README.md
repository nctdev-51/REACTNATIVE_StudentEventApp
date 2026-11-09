# StudentEventApp - Ứng dụng Quản lý Sự kiện Sinh viên IUH

Đồ án môn học Lập trình cho thiết bị di động (Nhóm 5 thành viên).

---

## 1. Cấu trúc dự án

Dự án gồm hai phần độc lập:

- `mobile-app` (thư mục hiện tại): ứng dụng React Native, Expo SDK 58.
- `backend/`: REST API Node.js, Express và MongoDB.

Thư mục `server/` chỉ là dữ liệu/tiện ích mock cũ; ứng dụng di động không còn khởi chạy hoặc phụ thuộc vào nó. Các thư viện backend như `jsonwebtoken` và `json-server` cũng không còn nằm trong dependencies của ứng dụng Expo.

---

## 2. Hướng dẫn cài đặt và chạy ứng dụng

### Bước 1: Khởi động Backend

Mở terminal ở thư mục `backend`, cài dependencies rồi chạy API:

```bash
cd backend
npm ci
npm run dev
```

API sẽ lắng nghe tại cổng `5000` trên `0.0.0.0`; kiểm tra bằng `http://localhost:5000/api/health`.

---

### Bước 2: Khởi động Frontend (StudentEventApp)

1. Mở một terminal mới, vào thư mục ứng dụng:
   ```bash
   cd StudentEventApp
   npm ci
   ```
2. Cấu hình kết nối Backend:
   - Android Emulator: ứng dụng tự dùng `http://10.0.2.2:5000/api`.
   - Điện thoại thật cùng Wi-Fi: Expo tự nhận IP LAN của máy; máy tính và điện thoại phải cùng mạng.
   - Điện thoại dùng 4G/khác Wi-Fi: cần public HTTPS URL cho **backend**. Mở terminal thứ hai trong `backend` và chạy:
     ```bash
     npx cloudflared tunnel --url http://127.0.0.1:5000
     ```
     Sao chép URL `https://...trycloudflare.com` được in ra, tạo/sửa file `.env` tại thư mục gốc:
     ```env
     EXPO_PUBLIC_API_URL=https://your-subdomain.trycloudflare.com/api
     ```
     > ⚠️ Chỉ giữ **một** file `.env` (không để file `.env.local` cũ tồn tại song song vì Expo ưu tiên `.env.local` đè lên `.env` khiến app gọi nhầm tunnel đã tắt).
     Không dán token Cloudflare Access hoặc một chuỗi bất kỳ vào biến này: giá trị phải bắt đầu bằng `https://`.
     Kiểm tra URL trước bằng trình duyệt điện thoại: `https://your-subdomain.trycloudflare.com/api/health` phải trả JSON `success: true`.
3. Chạy ứng dụng:
   ```bash
   npx expo start --tunnel -c
   ```

   Expo SDK 58 nạp biến `EXPO_PUBLIC_*` từ `.env`/`.env.local` tại thời điểm bundle; mỗi khi đổi URL trong `.env`, bắt buộc thêm cờ `-c` để xoá Metro cache và reload hoàn toàn Expo Go. `--tunnel` ở đây chỉ làm Expo Go truy cập Metro qua 4G; nó không tự public API Express, nên Cloudflare Tunnel vẫn cần chạy.

   - Nhấn `a` để chạy trên Android Emulator.
   - Nhấn `w` để chạy trên Web.
   - Hoặc quét mã QR bằng Expo Go trên điện thoại.

### Kiểm thử trước khi demo

```bash
npm test
npx tsc --noEmit
```

Ma trận 10 ca kiểm thử (bao gồm thành công, thất bại, quyền thiết bị, offline và gesture) cùng checklist cho Android compact và iPhone có notch nằm tại [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md).

---

## 3. Đồng bộ dữ liệu giữa nhiều máy

Ứng dụng chỉ đồng bộ khi mọi thiết bị gọi cùng một Express API và API đó dùng
một MongoDB Atlas/production database. Chế độ mock là cục bộ, không dùng cho
bản demo nhiều máy.

1. Tạo một cluster MongoDB Atlas và tạo database user có quyền `readWrite`.
2. Trên Render, tạo Blueprint từ repository này. File `render.yaml` đã trỏ
   đúng vào `backend/` và chạy Express API, không còn chạy JSON mock server.
3. Trong Render service, đặt biến môi trường bí mật `MONGO_URI` bằng connection
   string Atlas và deploy lại. Giữ `JWT_SECRET` do Render tự sinh.
4. Khi `https://<your-service>.onrender.com/api/health` trả về
   `"database": true`, đặt URL đó vào `.env` của mobile app:

   ```env
   EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api
   EXPO_PUBLIC_USE_STANDALONE_MOCK=false
   ```

5. Chạy `npx expo start -c` rồi reload hoàn toàn app trên cả máy A và B.

Kể từ thay đổi này, khi API hoặc MongoDB không hoạt động, thao tác đăng ký,
chỉnh sửa và điểm danh sẽ trả lỗi thay vì giả lập thành công tại máy đang dùng.
Do đó một thao tác thành công là thao tác đã đi qua database dùng chung.

## 4. Tài khoản thử nghiệm

Dữ liệu đã được tạo sẵn qua lệnh `npm run seed`:

| Vai trò              | Email                   | Mật khẩu   | Ghi chú                              |
| :------------------- | :---------------------- | :--------- | :----------------------------------- |
| Sinh viên (SV01)     | `sv01@iuh.edu.vn`       | `123456`   | Nguyễn Văn A, Khoa CNTT, 120 điểm    |
| Sinh viên (SV02)     | `sv02@iuh.edu.vn`       | `123456`   | Trần Thị Bích, Khoa Kinh tế, 85 điểm |
| Quản trị viên (AD01) | `admin.doan@iuh.edu.vn` | `admin123` | Ban Quản Trị Đoàn Hội, 500 điểm      |

---

## 5. Phân công nhiệm vụ các thành viên

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

## 6. Quy trình làm việc với Git

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
