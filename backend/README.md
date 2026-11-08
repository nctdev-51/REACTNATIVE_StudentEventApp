# StudentEventApp Backend API

Máy chủ RESTful API phục vụ ứng dụng di động StudentEventApp.

---

## 1. Công nghệ sử dụng
- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB (Mongoose ODM)
- Bảo mật: JWT (JSON Web Tokens), Bcrypt.js, CORS

---

## 2. Hướng dẫn cài đặt và khởi chạy máy chủ

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình môi trường (.env)
File `.env` nằm tại thư mục gốc của `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/studenteventapp
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:8081
```

### Bước 3: Nạp dữ liệu mẫu ban đầu (Seed Database)
Chạy lệnh sau để nạp dữ liệu mẫu gồm 6 sự kiện, 3 người dùng, 3 đăng ký, feedbacks và notifications:
```bash
npm run seed
```

### Bước 4: Khởi chạy máy chủ
```bash
npm run dev    # Chạy với nodemon
# hoặc
npm start      # Chạy với node thông thường
```
Máy chủ chạy tại: `http://localhost:5000`

---

## 3. Danh sách API Endpoints

### Authentication & Profile (`/api/auth`)
| Method | Route | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | Public |
| `POST` | `/api/auth/login` | Đăng nhập nhận Access & Refresh Token | Public |
| `POST` | `/api/auth/refresh` | Cấp mới Access Token bằng Refresh Token | Public |
| `POST` | `/api/auth/logout` | Đăng xuất | Protected |
| `GET` | `/api/auth/me` | Lấy thông tin user hiện tại | Protected |
| `PUT` | `/api/auth/me` | Cập nhật thông tin profile | Protected |
| `PUT` | `/api/auth/change-password` | Đổi mật khẩu | Protected |

### Sự kiện (`/api/events`)
| Method | Route | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Lấy danh sách sự kiện (hỗ trợ lọc category, status, search) | Public |
| `GET` | `/api/events/:id` | Xem chi tiết 1 sự kiện | Public |
| `POST` | `/api/events` | Tạo sự kiện mới | Admin / Organizer |
| `PUT` | `/api/events/:id` | Cập nhật sự kiện | Admin / Organizer |
| `DELETE` | `/api/events/:id` | Xóa sự kiện | Admin |

### Đăng ký & Điểm danh QR (`/api/registrations`)
| Method | Route | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/registrations` | Lấy danh sách đăng ký (?userId=... hoặc ?eventId=...) | Public |
| `POST` | `/api/registrations` | Đăng ký tham gia sự kiện | Public / Protected |
| `PATCH` | `/api/registrations/:id` | Cập nhật trạng thái (checked_in, cancelled) | Public / Protected |
| `POST` | `/api/registrations/check-in` | Quét mã QR điểm danh, tự động cộng điểm rèn luyện | Public / Protected |

### Đánh giá Feedback (`/api/feedbacks`)
| Method | Route | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/feedbacks` | Lấy đánh giá của sự kiện (?eventId=...) | Public |
| `POST` | `/api/feedbacks` | Gửi đánh giá sao và nhận xét | Public / Protected |

### Thông báo (`/api/notifications`)
| Method | Route | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Lấy danh sách thông báo của user (?userId=...) | Public / Protected |
| `PATCH` | `/api/notifications/:id` | Đánh dấu thông báo đã đọc | Public / Protected |
| `POST` | `/api/notifications` | Tạo thông báo mới | Private |
