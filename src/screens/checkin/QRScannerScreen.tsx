import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Vibration,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { QRScannerScreenProps } from '../../navigation/CheckInStack';

// Thay đổi URL Mock API của bạn tại đây (MockAPI, Postman Mock, hoặc backend server)
const CHECKIN_API_ENDPOINT = 'https://6759c991099e3090dbe281ab.mockapi.io/api/v1/checkins';

const { width } = Dimensions.get('window');

// Kích thước của khung quét QR hình vuông ở giữa màn hình
const SCANNER_SIZE = Math.min(width * 0.72, 280);

export default function QRScannerScreen({ navigation }: QRScannerScreenProps) {
  // Hook quản lý quyền truy cập Camera mới nhất của expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  // Trạng thái khóa quét lặp lại khi đã nhận diện được mã
  const [scanned, setScanned] = useState<boolean>(false);

  // Trạng thái đang gọi API điểm danh (Loading state)
  const [loading, setLoading] = useState<boolean>(false);

  // Trạng thái bật/tắt đèn flash
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Animation cho tia laser quét (Scan Line) di chuyển lên xuống
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Hiệu ứng tia quét laser di chuyển liên tục
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCANNER_SIZE - 4,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  // Khi người dùng quay lại màn hình này (ví dụ bấm "Thử lại"), reset cờ để tiếp tục quét
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setLoading(false);
    }, [])
  );

  // Hàm giả lập quét thành công để test nhanh giao diện / luồng
  const handleSimulateSuccess = () => {
    navigation.navigate('CheckInSuccess', {
      eventId: 'EVT-HOITHAO-2024',
      studentName: 'Nguyễn Chí Tâm',
      studentId: '20212345',
      checkInTime: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      data: 'EVT-HOITHAO-2024',
    });
  };

  // Hàm giả lập quét thất bại để test nhanh giao diện / luồng
  const handleSimulateFailed = () => {
    navigation.navigate('CheckInFailed', {
      reason: 'Mã QR sự kiện đã hết hạn hoặc không tồn tại trong hệ thống.',
      data: 'INVALID-QR-999',
    });
  };

  /**
   * Xử lý khi camera đọc được mã QR:
   * 1. Lấy eventId từ QR data
   * 2. Tạm dừng quét
   * 3. Hiển thị Loading Overlay
   * 4. Gọi fetch POST lên API Endpoint
   * 5. Điều hướng sang Success (nếu 201/200) hoặc Failed (nếu lỗi)
   */
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading) return;

    // Tạm dừng quét để tránh gửi request liên tục
    setScanned(true);
    setLoading(true);

    // Rung nhẹ thông báo quét thành công
    Vibration.vibrate(100);

    const eventId = result.data;

    // Body dữ liệu gửi lên API theo đúng yêu cầu
    const payload = {
      eventId: eventId,
      studentId: '20212345',
      studentName: 'Nguyễn Chí Tâm',
      checkInTime: new Date().toISOString(),
      status: 'success',
    };

    try {
      const response = await fetch(CHECKIN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Kiểm tra phản hồi từ máy chủ (chuẩn RESTful trả về 201 Created hoặc 200 OK)
      if (response.status === 201 || response.ok) {
        navigation.navigate('CheckInSuccess', {
          eventId: eventId,
          studentName: payload.studentName,
          studentId: payload.studentId,
          checkInTime: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          data: eventId,
        });
      } else {
        navigation.navigate('CheckInFailed', {
          reason: `Máy chủ trả về trạng thái ${response.status}: Điểm danh không thành công.`,
          data: eventId,
        });
      }
    } catch (error: any) {
      // Bắt tất cả lỗi kết nối mạng hoặc timeout
      navigation.navigate('CheckInFailed', {
        reason: error?.message || 'Không thể kết nối đến máy chủ điểm danh. Vui lòng kiểm tra mạng.',
        data: eventId,
      });
    } finally {
      // Tắt trạng thái Loading
      setLoading(false);
    }
  };

  // 1. Trạng thái đang kiểm tra quyền Camera
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.permissionText}>Đang kiểm tra quyền Camera...</Text>
      </View>
    );
  }

  // 2. Trạng thái người dùng chưa cấp quyền Camera (hoặc chạy trên Simulator)
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconCircle}>
          <Text style={styles.permissionIconText}>📷</Text>
        </View>
        <Text style={styles.permissionTitle}>Cần cấp quyền Camera</Text>
        <Text style={styles.permissionDescription}>
          Ứng dụng cần quyền truy cập camera để quét mã QR điểm danh tham gia sự kiện.
        </Text>

        {permission.canAskAgain ? (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.permissionButton, styles.settingsButton]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>Mở Cài đặt hệ thống</Text>
          </TouchableOpacity>
        )}

        {/* Nút test nhanh cho môi trường Simulator */}
        <View style={styles.devBarPermission}>
          <Text style={styles.devBarTitle}>Hoặc test nhanh giao diện (Simulator):</Text>
          <View style={styles.devButtonsRow}>
            <TouchableOpacity style={styles.devBtnSuccess} onPress={handleSimulateSuccess}>
              <Text style={styles.devBtnText}>⚡ Test Thành công</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devBtnFailed} onPress={handleSimulateFailed}>
              <Text style={styles.devBtnText}>❌ Test Thất bại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 3. Giao diện Camera full màn hình với lớp Mask làm tối xung quanh
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* CameraView phiên bản mới nhất từ expo-camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
      />

      {/* ================= LỚP OVERLAY LÀM TỐI XUNG QUANH (rgba(0,0,0,0.5)) ================= */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Phần trên: Tối màu đen mờ */}
        <View style={styles.overlayTop}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
            >
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Quét mã Check-in</Text>

            <TouchableOpacity
              style={[styles.headerButton, torchEnabled && styles.headerButtonActive]}
              onPress={() => setTorchEnabled((prev) => !prev)}
            >
              <Text style={styles.headerButtonText}>{torchEnabled ? '⚡' : '💡'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hàng giữa: 2 bên tối màu đen mờ, ở giữa là hình vuông trong suốt */}
        <View style={styles.overlayMiddleRow}>
          {/* Tối bên trái */}
          <View style={styles.overlaySide} />

          {/* Khung quét QR trong suốt ở giữa */}
          <View style={styles.viewfinder}>
            {/* 4 góc khung quét */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Tia quét laser chạy lên xuống */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLineAnim }],
                },
              ]}
            />
          </View>

          {/* Tối bên phải */}
          <View style={styles.overlaySide} />
        </View>

        {/* Phần dưới: Tối màu đen mờ kèm text hướng dẫn & nút test */}
        <View style={styles.overlayBottom}>
          {/* Dòng chữ yêu cầu: "Đưa mã QR sự kiện vào khung" */}
          <Text style={styles.instructionText}>Đưa mã QR sự kiện vào khung</Text>
          <Text style={styles.subInstructionText}>
            Hệ thống sẽ tự động quét và gửi dữ liệu điểm danh
          </Text>

          {/* Toolbar Test Giả lập nhanh (Dành cho việc kiểm thử UI/Luồng) */}
          <View style={styles.devButtonsRow}>
            <TouchableOpacity style={styles.devBtnSuccess} onPress={handleSimulateSuccess}>
              <Text style={styles.devBtnText}>⚡ Giả lập Thành công</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devBtnFailed} onPress={handleSimulateFailed}>
              <Text style={styles.devBtnText}>❌ Giả lập Thất bại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= OVERLAY LOADING KHI ĐANG GỌI API ================= */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Đang xử lý check-in...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Lớp màu đen mờ làm tối xung quanh theo yêu cầu rgba(0, 0, 0, 0.5)
const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)';
const CORNER_COLOR = '#22C55E';
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionIconText: {
    fontSize: 36,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#3B82F6',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 15,
  },

  // Overlay Layout với độ tối rgba(0, 0, 0, 0.5)
  overlayContainer: {
    ...StyleSheet.absoluteFill,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'flex-start',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 50,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#F59E0B',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  overlayMiddleRow: {
    height: SCANNER_SIZE,
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  viewfinder: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },

  // 4 Góc của khung quét
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },

  // Laser tia quét
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: CORNER_COLOR,
    shadowColor: CORNER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },

  // Phần đáy dưới khung quét
  overlayBottom: {
    flex: 1.2,
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionText: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Overlay Loading đè lên màn hình
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: '#1E293B',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingText: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Developer Test Toolbar Styles
  devBarPermission: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  devBarTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  devButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  devBtnSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  devBtnFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  devBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

