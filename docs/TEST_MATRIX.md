# Ma trận kiểm thử trước nghiệm thu

Chạy kiểm thử tự động bằng `npm test`. Mỗi lần merge phải chạy lại cả phần dưới đây trên một màn hình nhỏ và một màn hình lớn.

| ID | Luồng | Kết quả mong đợi | Loại |
| --- | --- | --- | --- |
| TC01 | Đăng nhập đúng tài khoản sinh viên | Vào Home, tên và quyền sinh viên đúng | Thành công |
| TC02 | Đăng nhập sai mật khẩu | Hiện lỗi, không tạo phiên đăng nhập | Thất bại |
| TC03 | Đăng ký một sự kiện hai lần | Lần hai bị chặn, không tạo registration thứ hai | Thất bại |
| TC04 | Quét QR hợp lệ trong bán kính | Check-in thành công, lịch và điểm được làm mới | Thành công |
| TC05 | Quét QR ngoài bán kính / QR sai | Không check-in, hiển thị nguyên nhân | Thất bại |
| TC06 | Từ chối Camera hoặc Location | Có hướng dẫn cấp lại quyền, app không crash | Thất bại |
| TC07 | Đăng ký rồi hủy trước giờ diễn ra | Registration chuyển cancelled, nhắc lịch bị hủy | Thành công |
| TC08 | Gửi feedback khi chưa check-in | Không cho chọn/gửi event đó | Thất bại |
| TC09 | Tắt mạng khi tải event | Có loading/error/retry, không treo màn hình | Thất bại |
| TC10 | Vuốt khung QR | Khung co nhẹ theo tay và spring về vị trí ban đầu | Thành công |

## Kiểm thử responsive và usability

| Thiết bị / viewport | Kích thước | Cần xác nhận |
| --- | --- | --- |
| Android compact | 360 x 800 dp | Không tràn chữ, tab dưới không che nút, form nhập vẫn thấy khi bật bàn phím |
| iPhone có notch | 393 x 852 pt | Safe area đúng ở header/tab, QR và modal không bị cắt |

Ghi lại ngày test, người test, ảnh chụp và lỗi phát hiện vào weekly log trước khi demo. Các case TC01–TC09 liên hệ trực tiếp những luồng bắt buộc; TC10 chứng minh gesture-bound Reanimated animation.
