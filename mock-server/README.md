# Mock REST API Server - StudentEventApp

Mock backend sử dụng `json-server` (port `3000`) dành cho dự án React Native StudentEventApp, phục vụ cho 5 thành viên phát triển frontend song song trước khi hoàn thiện backend Node.js + Express + MongoDB.

---

## 1. Cài đặt và khởi chạy Server

### Cách 1: Chạy qua `npm` trong thư mục `mock-server` (Khuyên dùng)

Mở terminal tại thư mục gốc của dự án hoặc tại thư mục `mock-server`:

```bash
cd mock-server
npm install
npm start
```

Server sẽ khởi chạy tại: `http://0.0.0.0:3000` (hoặc `http://localhost:3000`).

Nếu muốn tự động reload khi sửa file `db.json`:
```bash
npm run watch
```

### Cách 2: Chạy trực tiếp bằng `npx` (không cần cài trước)

Từ thư mục `mock-server`:
```bash
npx json-server --watch db.json --port 3000 --host 0.0.0.0
```

---

## 2. Hướng dẫn kết nối từ React Native / Expo

Tùy theo môi trường chạy ứng dụng, bạn cần cấu hình `BASE_URL` trong `src/services/api.ts`:

| Môi trường chạy App | Địa chỉ URL gọi API | Ghi chú |
| :--- | :--- | :--- |
| **iOS Simulator** | `http://localhost:3000` | Trực tiếp trên máy Mac |
| **Android Emulator** | `http://10.0.2.2:3000` | Loopback đặc biệt của Android Emulator |
| **Thiết bị thật (Expo Go)** | `http://<IP_LAN_CUA_MAY_TINH>:3000` | Ví dụ: `http://192.168.1.15:3000` |
| **Web Browser** | `http://localhost:3000` | Khi chạy `npm run web` |

> **Cách lấy IP máy tính trên Windows:**
> 1. Mở PowerShell hoặc Command Prompt.
> 2. Gõ lệnh: `ipconfig`
> 3. Tìm dòng **IPv4 Address** (thường có dạng `192.168.x.x` hoặc `10.x.x.x`).
> 4. Đảm bảo điện thoại và máy tính kết nối **chung một mạng Wi-Fi**.

---

## 3. Danh sách Collections & REST API Endpoints

### 3.1. Users (`/users`)
- `GET /users`: Lấy danh sách toàn bộ người dùng.
- `GET /users/:id`: Lấy chi tiết người dùng theo `id` hoặc `_id`.

**User mẫu trong `db.json`:**
* `SV01` (Student): `email: sv01@iuh.edu.vn`, `password: 123456`
* `SV02` (Student): `email: sv02@iuh.edu.vn`, `password: 123456`
* `AD01` (Admin): `email: admin.doan@iuh.edu.vn`, `password: admin123`

---

### 3.2. Events (`/events`)
- `GET /events`: Lấy danh sách tất cả sự kiện.
- `GET /events/:id`: Xem chi tiết 1 sự kiện.
- `GET /events?category=Học thuật`: Lọc theo danh mục (`Học thuật`, `Kỹ năng`, `Thể thao`).
- `GET /events?status=upcoming`: Lọc theo trạng thái (`upcoming`, `ongoing`, `completed`, `cancelled`).

---

### 3.3. Registrations (`/registrations`)
- `GET /registrations`: Lấy tất cả lượt đăng ký.
- `GET /registrations?userId=:userId`: Lấy các sự kiện người dùng đã đăng ký.
- `GET /registrations?eventId=:eventId`: Lấy danh sách sinh viên đăng ký một sự kiện.
- `POST /registrations`: Đăng ký tham gia sự kiện mới.
  - Body:
    ```json
    {
      "eventId": "66f1e2010000000000000001",
      "userId": "66f1a1010000000000000001",
      "participantRole": "attendee",
      "status": "registered",
      "checkInTime": null
    }
    ```
- `PATCH /registrations/:id`: Cập nhật trạng thái điểm danh hoặc hủy đăng ký.
  - Điểm danh: `{ "status": "checked_in", "checkInTime": "2026-09-22T19:55:00.000Z" }`
  - Hủy đăng ký: `{ "status": "cancelled" }`

---

### 3.4. Feedbacks (`/feedbacks`)
- `GET /feedbacks`: Lấy danh sách đánh giá.
- `GET /feedbacks?eventId=:eventId`: Lấy đánh giá của một sự kiện cụ thể.
- `POST /feedbacks`: Gửi đánh giá mới.
  - Body:
    ```json
    {
      "eventId": "66f1e2010000000000000001",
      "userId": "66f1a1010000000000000001",
      "rating": 5,
      "comment": "Sự kiện rất ý nghĩa và bổ ích!",
      "createdAt": "2026-09-22T19:55:00.000Z"
    }
    ```

---

### 3.5. Notifications (`/notifications`)
- `GET /notifications`: Lấy danh sách thông báo.
- `GET /notifications?userId=:userId`: Lấy thông báo gửi riêng cho sinh viên / ban quản trị.
- `PATCH /notifications/:id`: Đánh dấu đã đọc (`{ "isRead": true }`).

---

## 4. Quy ước ID tương thích MongoDB

Tất cả các bản ghi đều chứa cả `id` và `_id` đồng nhất dạng chuỗi 24 ký tự hex (chuẩn BSON ObjectId):
```json
{
  "id": "66f1a1010000000000000001",
  "_id": "66f1a1010000000000000001"
}
```
* **Tại sao cần điều này?**
  * `json-server` tự động dùng trường `id` để định tuyến các route `/resource/:id`.
  * Sau này khi backend thật dùng MongoDB, các document mặc định có `_id`. Bằng cách cung cấp song song cả `id` và `_id`, frontend có thể truy cập `item.id` hoặc `item._id` mà không sợ lỗi undefined khi chuyển giao sang backend thật.
