# Checklist release Android/iOS

1. `npm test`, `npx tsc --noEmit`, `npm --prefix backend run test:integration`.
2. Xác nhận `/api/health` có `database: true` và mobile dùng HTTPS API chung.
3. Đặt `EXPO_PUBLIC_USE_STANDALONE_MOCK=false` và EAS project ID đúng.
4. Tạo development/production build, không dùng Expo Go để kiểm thử remote push.
5. Test Android và iPhone thật: đăng ký, hủy, QR, mất mạng, khôi phục mạng,
   notification khi app nền/đã đóng và tap notification.
6. Cấu hình FCM V1 (Android), APNs (iOS) và thử gửi bằng Expo Push Tool trước
   khi demo server-send.
7. Rà soát privacy policy, điều khoản, Mongo backup và Render alert.
