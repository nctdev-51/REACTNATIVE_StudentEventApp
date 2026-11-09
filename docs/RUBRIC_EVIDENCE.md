# Đối chiếu yêu cầu bài tập lớn

## Đã có trong sản phẩm

- Ba luồng chính: khám phá/đăng ký sự kiện; QR + GPS check-in; quản trị sự kiện/danh sách tham gia.
- Nhiều màn hình, React Navigation stack + tab/drawer, truyền tham số và deep link `studentevent://checkin`.
- Redux Toolkit, Axios, loading/error/empty, FlatList và load-more ở Home.
- Expo Camera, Location, Notifications với permission handling.
- Reanimated và Pan gesture ở QR scanner.
- Tamagui config, theme sáng/tối, reusable Button/Input/Card/Modal.
- AI summary với loading/error/fallback; không gửi thông tin tài khoản hay vị trí vào prompt.
- Tối thiểu 8 test chức năng; xem `tests/` và `docs/TEST_MATRIX.md`.

## Cần hoàn tất trước nộp

1. Chạy `eas build:configure` trong Expo account của nhóm để tạo project ID,
   thêm `expo-updates`/cấu hình updates nếu nhóm dùng OTA, sau đó giữ `eas.json`.
2. Tạo ít nhất một preview APK hoặc AAB và kiểm thử trên hai điện thoại thật.
3. Lập đề xuất vấn đề, backlog/phân công, hồ sơ thiết kế, báo cáo giữa kỳ/cuối
   kỳ, slide/video theo mục 6 của đề bài.
4. Thu thập đúng sự thật tối thiểu 3 xác nhận nhu cầu và 5 lượt usability test;
   không làm giả dữ liệu hoặc commit.
5. Hoàn thiện nhật ký đóng góp theo tuần và công bố sử dụng AI. Các template
   dưới đây chỉ để ghi bằng chứng thực tế.
6. Tạo release tag `v1.0.0`, kiểm tra `.env`/backup không bị commit và cập nhật README.

## Chưa nên tuyên bố hoàn thành

- EAS/OTA chỉ có profile khởi tạo; cần Expo project thực và build thật.
- Remote push chỉ nhận được sau khi cấu hình EAS project ID, FCM V1/APNs và
  cài development/production build, không phải Expo Go.
- Gửi OTP email production cần `RESEND_API_KEY` và `EMAIL_FROM` hợp lệ.
