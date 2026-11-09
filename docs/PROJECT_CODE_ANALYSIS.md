# Phân tích mã nguồn tổng hợp — StudentEventApp

Ngày chốt: 09/11/2026

## 1. Mục tiêu và phạm vi

StudentEventApp là ứng dụng Expo/React Native hỗ trợ sinh viên khám phá sự
kiện, đăng ký, xem lịch cá nhân, nhận nhắc lịch, quét QR để check-in và gửi
đánh giá. Vai trò admin có thêm quản lý sự kiện, người dùng, quota/waitlist,
QR trình chiếu và báo cáo check-in. Backend Express/MongoDB là nguồn dữ liệu
dùng chung khi triển khai online.

Repository gồm mobile app ở thư mục gốc và backend tại `backend/`. Thư mục
`server/` là JSON mock cũ, không phải backend mà mobile app dùng khi cấu hình
API thật.

## 2. Kiến trúc tổng thể

```text
React Native / Expo SDK 58
  ├─ Screens + Components + Tamagui/theme
  ├─ React Navigation: auth, main tabs, admin tabs, QR stack
  ├─ Redux Toolkit: auth, events, registrations, feedbacks, notifications
  ├─ api.ts (Axios, Bearer token, response mapping)
  ├─ Expo Camera / Location / Notifications / Linking
  └─ AsyncStorage: session, theme, local reminder settings
             │ HTTPS /api
             ▼
Express backend
  ├─ Routes → Controllers → Mongoose models
  ├─ JWT authentication and role authorization
  ├─ Dynamic QR + GPS validation + waitlist
  ├─ In-app notification + Expo Push delivery
  └─ MongoDB / MongoDB Atlas
```

## 3. Mobile app

### Điểm vào và điều hướng

- `App.tsx`: Provider Redux, Tamagui, SafeArea, theme, drawer và deep link.
- `RootNavigator.tsx`: phục hồi session, đặt Axios token, kiểm tra profile từ
  server và chuyển Auth/Main/Admin theo vai trò.
- `AuthStack.tsx`: Login, Register, ForgotPassword.
- `MainStack.tsx`: tab Home/Lịch/Check-in/Cá nhân và các màn phụ.
- `AdminStack.tsx`: dashboard, sự kiện, check-in report, QR và người dùng.
- Scheme `studentevent://` hỗ trợ link check-in; HTTPS deep link được khai báo
  cho `studentevent.iuh.edu.vn/checkin`.

### State và dữ liệu

- `src/store/index.ts` lắp Redux reducers.
- `authSlice`: login/register/restore session/profile.
- `eventsSlice`: tải, lọc, tìm kiếm sự kiện.
- `registrationsSlice`: danh sách cá nhân, đăng ký, hủy, check-in.
- `feedbacksSlice`, `notificationsSlice`: dữ liệu phản hồi và notification.
- `api.ts` là lớp duy nhất nên dùng để gọi REST API. Nó map dữ liệu backend về
  các type `User`, `Event`, `Registration`, `Feedback`, `Notification`.

### Chức năng sinh viên

1. Đăng ký/đăng nhập và duy trì session cục bộ.
2. Home có tìm kiếm, lọc, danh sách `FlatList` và tải thêm.
3. Xem chi tiết, đăng ký/huỷ đăng ký, xử lý waitlist và lịch cá nhân.
4. Quét QR check-in, xác minh token QR động, GPS, độ chính xác vị trí và
   khoảng cách cho phép.
5. Đánh giá sau khi tham dự; mỗi người một phản hồi trên mỗi sự kiện.
6. Local reminder trước sự kiện; remote push được chuẩn bị khi backend và EAS
   credentials hoạt động.
7. Cập nhật profile, đổi giao diện sáng/tối, đổi email OTP và quên mật khẩu OTP.

### Chức năng admin

1. Dashboard KPI/charts.
2. Tạo, chỉnh sửa, ẩn/xóa sự kiện; đặt vị trí/radius GPS.
3. QR động, danh sách đăng ký/check-in và thao tác check-in thủ công.
4. Quản lý quota, waitlist, người dùng và notification.
5. Audit log cho các request ghi dữ liệu qua admin routes.

### UI, Expo và AI

- Reanimated có scan-line và khung scanner; Pan gesture ở QR scanner.
- Expo Camera, Location, Notifications, Linking; app xin quyền và hiển thị
  phản hồi khi người dùng từ chối.
- Tamagui có Button/Input/Card/Modal tái sử dụng; `ThemeContext` quản lý
  theme sáng/tối.
- AI summary chạy qua backend `geminiService` với trạng thái loading/error và
  fallback local. Không nên đưa email, token, GPS hoặc dữ liệu nhận diện vào
  input AI.

## 4. Backend

### Lớp code

- `src/app.js`: Express, CORS, JSON parser, health check, database guard và
  mount `/api/*` routes.
- `config/db.js`: kết nối MongoDB từ `MONGO_URI`; health chỉ báo healthy khi
  Mongoose thật sự connected.
- `middleware/auth.js`: đọc Bearer JWT, lấy user và kiểm tra role.
- `controllers/`: quy tắc nghiệp vụ.
- `models/`: User, Event, Registration, Feedback, Notification, PushToken,
  AuditLog.

### Dữ liệu chính

- `User`: identity, role, điểm, preferences, refresh token và trạng thái OTP.
- `Event`: thời gian, quota, waitlist, GPS, QR/passcode, điểm rèn luyện.
- `Registration`: ràng buộc unique `{eventId, userId}`, trạng thái đăng ký,
  check-in, waitlist và appeal.
- `Feedback`: điểm 1–5, nhận xét, event/user.
- `Notification`: inbox notification trong app.
- `PushToken`: Expo token theo thiết bị; token `DeviceNotRegistered` bị vô hiệu.
- `AuditLog`: hành động admin đã thay đổi dữ liệu.

### Endpoints tiêu biểu

| Nhóm | Route chính | Mục đích |
| --- | --- | --- |
| Auth | `/api/auth/register`, `/login`, `/me`, `/change-password` | account/session/profile |
| OTP | `/forgot-password`, `/reset-password`, `/change-email/*` | quên mật khẩu, đổi email |
| Events | `/api/events` | đọc/quản lý sự kiện, QR, AI summary, ICS |
| Registrations | `/api/registrations` | đăng ký, huỷ, QR check-in, appeal |
| Admin | `/api/admin/*` | quota, attendee, manual check-in, audit logs |
| Notifications | `/api/notifications` | inbox/read/create notification |
| Push | `/api/users/me/push-tokens` | đăng ký/vô hiệu Expo Push Token |

## 5. Đồng bộ và môi trường chạy

### Chế độ đồng bộ thật

Mọi thiết bị phải dùng cùng `EXPO_PUBLIC_API_URL` trỏ đến Express API public,
và API phải dùng một `MONGO_URI` chung. Khi `EXPO_PUBLIC_USE_STANDALONE_MOCK`
không phải `true`, thao tác ghi lỗi sẽ trả lỗi thay vì giả thành công tại máy
cục bộ. Health endpoint phải trả `database: true`.

### Expo tunnel

`npx expo start -c --tunnel ngrok` chỉ giúp điện thoại tải Metro bundle. Nó
không public backend Express. Muốn test bằng máy khác mạng cần backend public
(ví dụ Render) hoặc một tunnel riêng cho backend, rồi khai báo URL vào `.env`.

### Biến môi trường

| Biến | Nơi đặt | Vai trò |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | root `.env` | URL API public; an toàn để bundle |
| `EXPO_PUBLIC_USE_STANDALONE_MOCK` | root `.env` | chỉ dùng mock độc lập khi demo offline |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | root `.env` | Expo project ID cho remote push |
| `MONGO_URI` | Render/backend secret | MongoDB Atlas dùng chung |
| `JWT_SECRET` | Render/backend secret | ký JWT |
| `RESEND_API_KEY`, `EMAIL_FROM` | Render/backend secret | gửi OTP email thật |
| `EXPO_ACCESS_TOKEN` | Render/backend secret, optional | Expo enhanced push security |

Không commit `.env`, Mongo URI, JWT secret, API key Resend, Expo access token
hoặc snapshot backup. Mẫu an toàn nằm ở `.env.example` và `backend/.env.example`.

## 6. OTP email: trạng thái chốt

Luồng code đã hoàn thành, nhưng nhóm quyết định không cấu hình/test email thật
trên Render trong giai đoạn chốt. Vì vậy:

- Development không có Resend: backend log OTP, API có thể trả `demoCode`.
- Production không có `RESEND_API_KEY` + `EMAIL_FROM`: OTP không được gửi và
  cũng không trả code; người dùng không thể hoàn tất luồng.
- Không tuyên bố tính năng OTP đã nghiệm thu production trong báo cáo/bảo vệ
  nếu chưa có chứng cứ test email thật.

## 7. Push notification: trạng thái chốt

Code đã lưu Expo push token và backend gửi notification qua Expo Push Service.
Để nhận push thật khi app nền/đóng cần EAS project ID, FCM V1 Android, APNs iOS
và development/production build. Expo Go/tunnel không là bằng chứng remote push
production. Local notification/reminder vẫn dùng để demo nếu chưa có credential.

## 8. Kiểm thử và chất lượng mã

Đã chạy khi chốt:

```bash
npx tsc --noEmit
npm test
```

Kết quả: 33 test pass, 2 test legacy skip, 0 fail. Hai legacy feedback HTTP
test được skip vì phụ thuộc server `localhost:5000`; thay vào đó có skeleton
integration test `backend/tests/mongo.integration.test.js`, chỉ chạy thật khi
đặt `TEST_MONGO_URI` là database test riêng.

Các lưu ý test còn lại:

- Cần test thật trên tối thiểu hai kích thước/thiết bị theo `docs/TEST_MATRIX.md`.
- Cần test hai máy với cùng cloud database cho đăng ký, hủy, check-in và cập
  nhật profile.
- Cần test build thật cho push, camera/location permission và deep link.

## 9. Build, release và vận hành

- `eas.json` có profile `preview` (APK internal) và `production` (AAB).
- Trước build cần chạy `eas build:configure` trong Expo account của nhóm để
  sinh project ID; chỉ chạy khi nhóm đã sẵn sàng liên kết account.
- `docs/RELEASE_CHECKLIST.md` là checklist đóng gói.
- Render health check dùng `/api/health`; có thể dùng uptime monitor ngoài.
- `npm --prefix backend run backup` tạo backup; restore yêu cầu `--confirm`.
  Xem `docs/OPERATIONS.md`.

## 10. Đối chiếu yêu cầu học phần

Ứng dụng đáp ứng phần code cho các CLO chính: React Native/Expo, UI nhiều màn,
Axios/API, Redux, Camera/Location/Notifications, Reanimated/Gesture, Tamagui,
AI summary và build profile. Chi tiết tại `docs/RUBRIC_EVIDENCE.md`.

Các đầu ra không thể được tạo thay hoặc làm giả bằng code, nhóm cần bổ sung bằng
chứng thật trước khi nộp:

1. khảo sát/xác nhận nhu cầu từ ít nhất 3 người dùng;
2. ít nhất 5 lượt usability test;
3. proposal, backlog/phân công, design dossier, final report, slides/video;
4. nhật ký đóng góp theo tuần và công bố dùng AI;
5. build cài được, tag Git `v1.0.0`, README chạy từ đầu.

Template: `AI_DISCLOSURE_TEMPLATE.md`, `USABILITY_TEST_TEMPLATE.md`,
`CONTRIBUTION_LOG_TEMPLATE.md`.

## 11. Rủi ro và giới hạn cần nêu khi bảo vệ

- Backend cloud/Atlas phải running để sync cross-device; mock mode không sync.
- OTP email và remote push chưa có bằng chứng production nếu chưa cấu hình
  credentials cloud.
- CORS đang mở để hỗ trợ demo nhiều môi trường; production thật cần giới hạn
  origin/rate limiting và rà soát phân quyền endpoint.
- `AsyncStorage` hiện giữ session metadata/token; bản production nên chuyển token
  sang storage bảo mật hơn.
- `server/` mock cũ cần được giải thích là utility legacy, không phải nguồn dữ
  liệu production.

## 12. Hướng dẫn bàn giao nhanh

1. Commit toàn bộ thay đổi đã kiểm tra, không thêm `.env`.
2. Push branch, mở PR và review diff.
3. Chạy `npm ci`, `npm --prefix backend ci`, `npx tsc --noEmit`, `npm test`.
4. Dùng `.env.example`/`backend/.env.example` để mỗi thành viên tạo env riêng.
5. Nếu demo offline, nêu rõ dữ liệu là mock cục bộ; nếu demo đồng bộ, dùng một
   API/MongoDB chung và kiểm tra health trước.
