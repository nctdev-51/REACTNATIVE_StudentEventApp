# Vận hành demo production

## Health và cảnh báo

- Render dùng `/api/health` làm health check; chỉ HTTP 200 khi MongoDB kết nối.
- Trong Render, bật email alert cho deploy fail/service unavailable.
- Dùng một uptime monitor ngoài (ví dụ UptimeRobot) gọi URL `/api/health` mỗi
  5 phút và gửi cảnh báo khi status khác 200.
- Không ghi mật khẩu, JWT, `MONGO_URI` hoặc Expo push token vào log.

## Sao lưu và khôi phục

Chạy backup bằng môi trường có `MONGO_URI` production:

```bash
npm --prefix backend run backup
```

Tải file JSON trong `backend/backups/` vào kho riêng tư. Không commit thư mục
backup. Khôi phục là thao tác phá hủy dữ liệu hiện tại, nên chỉ chạy sau khi tạo
một backup mới:

```bash
npm --prefix backend run restore -- backend/backups/<file>.json --confirm
```

## Analytics tối thiểu cho demo

Theo dõi số đăng ký, check-in, waitlist và lỗi API qua MongoDB/Render logs.
Không gửi email, mã sinh viên hoặc toạ độ GPS đến dịch vụ analytics bên thứ ba.
