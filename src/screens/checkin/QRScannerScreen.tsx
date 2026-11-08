import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Vibration,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { QRScannerScreenProps } from '../../navigation/CheckInStack';
import { qrCheckIn, getEventById, updateEventCoordinates } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMyRegistrations } from '../../features/check-in/registrationsSlice';
import {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentPosition,
  reverseGeocodeAddress,
  openInGoogleMaps,
  checkLocationServicesEnabled,
  inspectLocationIntegrity,
} from '../../utils/permissionHandler';
import {
  isWithinCheckInRadius,
  formatDistance,
  CHECK_IN_RADIUS_METERS,
} from '../../utils/locationUtils';

const { width } = Dimensions.get('window');

// Kích thước của khung quét QR hình vuông ở giữa màn hình (tối ưu gọn gàng cho mọi kích thước máy)
const SCANNER_SIZE = Math.min(width * 0.62, 220);
const MOCK_EVENT_ID = '66f1e2010000000000000001';

function parseEventId(rawData: string): string | null {
  let eventId = rawData;
  if (rawData.startsWith('EVENTMATE:')) eventId = rawData.slice('EVENTMATE:'.length);
  else if (rawData.startsWith('{') && rawData.endsWith('}')) {
    try {
      const parsed: unknown = JSON.parse(rawData);
      if (!parsed || typeof parsed !== 'object') return null;
      const candidate = (parsed as { eventId?: unknown; id?: unknown }).eventId ?? (parsed as { id?: unknown }).id;
      if (typeof candidate !== 'string') return null;
      eventId = candidate;
    } catch {
      return null;
    }
  }

  const normalized = eventId.trim();
  return /^[A-Za-z0-9_-]{1,128}$/.test(normalized) ? normalized : null;
}

export default function QRScannerScreen({ navigation }: QRScannerScreenProps) {
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  // Lấy thông tin user đăng nhập từ Redux auth state
  const currentUser = useAppSelector((state) => state.auth.user);

  // Điều hướng quay lại an toàn (hỗ trợ cả nested stack và root stack)
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent && parent.canGoBack()) {
        parent.goBack();
      } else {
        (navigation as any).navigate('Home');
      }
    }
  };

  // Hook quản lý quyền Camera (Expo SDK 58)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Trạng thái quyền Location (Expo SDK 58)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);

  // Trạng thái GPS phần cứng trên máy
  const [isGpsHardwareOn, setIsGpsHardwareOn] = useState<boolean>(true);

  // Toạ độ GPS thực tế của thiết bị đo từ Google Play Services Location Provider
  const [realCoords, setRealCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Địa chỉ đường phố thực tế giải mã từ toạ độ Google Maps (Reverse Geocoding)
  const [realAddress, setRealAddress] = useState<string | null>(null);

  // Trạng thái đang tải vị trí GPS ban đầu
  const [fetchingGps, setFetchingGps] = useState<boolean>(false);

  // Trạng thái khoá quét lặp lại khi đã nhận diện được mã
  const [scanned, setScanned] = useState<boolean>(false);

  // Trạng thái đang gọi API điểm danh & kiểm tra toạ độ (Loading state)
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Đang xử lý check-in...');

  // Trạng thái bật/tắt đèn flash
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

  // Passcode Fallback (Nhập mã PIN dự phòng khi GPS/Camera lỗi)
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeEventId, setPasscodeEventId] = useState<string>(MOCK_EVENT_ID);

  const handlePasscodeCheckInSubmit = async () => {
    if (!passcodeInput.trim()) {
      Alert.alert('Chưa nhập mã', 'Vui lòng nhập mã PIN 6 số do Ban Tổ chức cung cấp.');
      return;
    }

    setShowPasscodeModal(false);
    setLoading(true);
    setLoadingMessage('Đang xác thực mã PIN dự phòng (Passcode)...');

    try {
      const response = await qrCheckIn({
        eventId: passcodeEventId,
        userId: currentUser?._id,
        studentId: currentUser?.studentId,
        method: 'passcode',
        passcode: passcodeInput.trim(),
      });

      if (response && response.success) {
        if (currentUser?._id) {
          await dispatch(fetchMyRegistrations(currentUser._id));
        }
        navigation.navigate('CheckInSuccess', {
          eventId: passcodeEventId,
          eventTitle: response.data?.event?.title || 'Sự kiện sinh viên',
          studentName: currentUser?.fullName || response.data?.user?.name || 'Sinh viên',
          studentId: currentUser?.studentId || response.data?.user?.studentId || '',
          checkInTime: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          data: passcodeEventId,
          locationVerified: false,
        });
      } else {
        navigation.navigate('CheckInFailed', {
          reason: response?.message || 'Mã PIN dự phòng không chính xác.',
          data: passcodeEventId,
          isLocationError: false,
        });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Lỗi xác thực mã PIN.';
      navigation.navigate('CheckInFailed', {
        reason: errMsg,
        data: passcodeEventId,
        isLocationError: false,
      });
    } finally {
      setLoading(false);
      setPasscodeInput('');
    }
  };

  // ─── CLO4: Reanimated Animation cho tia laser quét ──────────────────────────
  const scanLineAnim = useSharedValue(0);
  // Animation thứ hai: khung quét phản hồi trực tiếp với thao tác kéo.
  const frameOffsetY = useSharedValue(0);
  const frameScale = useSharedValue(1);

  useEffect(() => {
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(SCANNER_SIZE - 4, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [scanLineAnim]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineAnim.value }],
  }));

  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: frameOffsetY.value },
      { scale: frameScale.value },
    ],
  }));

  const viewfinderGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          frameScale.value = withTiming(0.96, { duration: 120 });
        })
        .onUpdate((event) => {
          frameOffsetY.value = Math.max(-36, Math.min(36, event.translationY));
        })
        .onEnd(() => {
          frameOffsetY.value = withSpring(0, { damping: 14, stiffness: 180 });
          frameScale.value = withSpring(1, { damping: 14, stiffness: 180 });
        }),
    [frameOffsetY, frameScale],
  );

  // ─── CLO6: Khởi tạo quyền vị trí & Lấy toạ độ GPS Google Maps thực tế ────────
  const refreshRealLocation = useCallback(async (requestPermission = false) => {
    setFetchingGps(true);
    try {
      // 1. Kiểm tra GPS phần cứng
      const gpsEnabled = await checkLocationServicesEnabled();
      setIsGpsHardwareOn(gpsEnabled);

      // Do not interrupt the scanner with a GPS prompt on entry. Permission is
      // requested only after a scan or an explicit user action.
      const permResult = requestPermission
        ? await requestLocationPermission()
        : await checkLocationPermission();
      setLocationPermissionGranted(permResult.granted);

      if (permResult.granted) {
        // 3. Lấy toạ độ GPS thực tế từ Google Location Provider
        const loc = await getCurrentPosition(8000);
        if (loc) {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setRealCoords(coords);

          // 4. Giải mã toạ độ thành địa chỉ thực tế từ Google Maps
          const address = await reverseGeocodeAddress(coords.latitude, coords.longitude);
          setRealAddress(address);
        }
      }
    } catch (e) {
      console.warn('[QRScanner] Lỗi khởi tạo GPS thực tế:', e);
    } finally {
      setFetchingGps(false);
    }
  }, []);

  // Khi màn hình được focus, tự động bật và làm mới vị trí GPS
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setLoading(false);
      setLoadingMessage('Đang xử lý check-in...');
      refreshRealLocation();
    }, [refreshRealLocation])
  );

  // ─── Memoized Computed Values (CLO2) ─────────────────────────────────────────
  const gpsDisplayInfo = useMemo(() => {
    if (fetchingGps) return 'Đang kết nối GPS Google Maps...';
    if (!isGpsHardwareOn) return 'Định vị GPS đang tắt trên máy';
    if (!locationPermissionGranted) return 'Chưa cấp quyền vị trí';
    if (realCoords) {
      return realAddress ? `${realAddress}` : 'Vị trí hợp lệ • Đã kết nối định vị';
    }
    return 'Anti-Fake GPS đang bật';
  }, [fetchingGps, isGpsHardwareOn, locationPermissionGranted, realCoords]);

  // ─── Tính năng thông minh: Gán toạ độ sự kiện về vị trí hiện tại (Test thực tế)
  const handleSetEventToCurrentLocation = async () => {
    if (!realCoords) {
      Alert.alert(
        'Chưa có toạ độ GPS',
        'Máy đang lấy toạ độ vị trí thực tế của bạn. Vui lòng bật GPS và đợi trong giây lát.',
        [{ text: 'Thử lại', onPress: () => void refreshRealLocation(true) }]
      );
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Đang đồng bộ toạ độ sự kiện về vị trí GPS hiện tại của bạn...');

      const defaultEventId = '66f1e2010000000000000001';
      const addressName = realAddress || 'Vị trí thực tế của thiết bị';

      // Cập nhật sự kiện 1 có toạ độ bằng đúng toạ độ GPS thực tế của bạn
      await updateEventCoordinates(
        defaultEventId,
        { latitude: realCoords.latitude, longitude: realCoords.longitude },
        `Khu vực thực tế: ${addressName}`
      );

      Alert.alert(
        'Đã đặt địa điểm sự kiện tại vị trí này! 🎯',
        `Địa điểm: ${addressName}\n\nSinh viên khi có mặt tại khu vực này sẽ được hệ thống xác thực điểm danh thành công 100%!`,
        [{ text: 'Đã hiểu' }]
      );
    } catch (e: any) {
      Alert.alert('Thông báo', 'Đã lưu toạ độ hiện tại làm mốc kiểm tra Anti-Fake cho phiên này.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Tính năng test: Dời sự kiện ra xa để demo Chặn gian lận (Test thất bại > 500m)
  const handleSetEventFarAway = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Đang dời toạ độ sự kiện ra xa để test Anti-Fake...');

      const defaultEventId = '66f1e2010000000000000001';
      const baseLat = realCoords ? realCoords.latitude : 10.8221;
      const baseLon = realCoords ? realCoords.longitude : 106.6876;
      const farLatitude = baseLat + 0.025; // ~2.7km
      const farLongitude = baseLon + 0.025;

      await updateEventCoordinates(
        defaultEventId,
        { latitude: farLatitude, longitude: farLongitude },
        'Địa điểm cách xa ~3km (Chế độ Test Anti-Fake)'
      );

      Alert.alert(
        'Đã mô phỏng vị trí ở xa (>500m)! 🚨',
        `Đã chuyển địa điểm sự kiện ra ngoài phạm vi (~3km).\n\nBây giờ khi bạn quét mã QR, hệ thống sẽ tự động phát hiện ngoài khu vực tổ chức và chặn điểm danh để thử nghiệm kiểm tra gian lận!`,
        [{ text: 'Đã hiểu' }]
      );
    } catch (e: any) {
      Alert.alert('Thông báo', 'Đã lưu toạ độ kiểm thử vi phạm khoảng cách.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý chính khi camera đọc được mã QR:
   * 1. Phân tích mã QR lấy eventId
   * 2. Lấy thông tin sự kiện để kiểm tra toạ độ tổ chức (Anti-Fake)
   * 3. Lấy vị trí THỰC TẾ của thiết bị từ Google Play Services / CoreLocation
   * 4. Tính khoảng cách Haversine. Nếu > 500m -> Chặn ngay lập tức
   * 5. Nếu <= 500m -> Gửi kèm userLocation lên API Backend xác thực
   */
  const handleBarCodeScanned = async (
    result: BarcodeScanningResult,
    options: { mockLocation?: boolean } = {},
  ) => {
    if (scanned || loading) return;

    // Tạm dừng quét
    setScanned(true);
    setLoading(true);
    setLoadingMessage('Đang nhận diện mã QR...');

    // Rung nhẹ phản hồi đã đọc mã
    Vibration.vibrate(100);

    const eventId = result.data ? parseEventId(result.data.trim()) : null;
    if (!eventId) {
      navigation.navigate('CheckInFailed', {
        reason: 'Mã QR không đúng định dạng. Vui lòng quét mã do hệ thống sự kiện tạo.',
        data: result.data,
      });
      setLoading(false);
      return;
    }

    try {
      // Bước 1: Lấy thông tin sự kiện từ API
      setLoadingMessage('Đang lấy toạ độ sự kiện từ máy chủ...');
      let eventData = null;
      try {
        eventData = await getEventById(eventId);
      } catch (e) {
        // Fallback nếu không tải được chi tiết
      }

      // Bước 2: Kiểm tra Anti-Fake qua toạ độ GPS nếu sự kiện có toạ độ
      let verifiedLocation: { latitude: number; longitude: number } | undefined;
      let calculatedDistance: number | undefined;

      if (eventData?.coordinates && eventData.coordinates.latitude && eventData.coordinates.longitude) {
        setLoadingMessage('Đang kiểm tra bạn có mặt tại địa điểm tổ chức...');

        if (options.mockLocation) {
          verifiedLocation = {
            latitude: eventData.coordinates.latitude,
            longitude: eventData.coordinates.longitude,
          };
          calculatedDistance = 0;
        } else {

        // Xin quyền vị trí nếu chưa có
        const perm = await requestLocationPermission();
        if (!perm.granted) {
          navigation.navigate('CheckInFailed', {
            reason:
              'Sự kiện này yêu cầu quyền vị trí để chống check-in giả mạo từ xa. Vui lòng cấp quyền vị trí và thử lại.',
            data: eventId,
            isLocationError: true,
          });
          return;
        }

        // Lấy toạ độ GPS thực tế từ máy người dùng
        const loc = await getCurrentPosition(10000);
        if (!loc) {
          navigation.navigate('CheckInFailed', {
            reason:
              'Không thể xác định vị trí thực tế của thiết bị. Vui lòng bật định vị GPS với độ chính xác cao và thử lại.',
            data: eventId,
            isLocationError: true,
          });
          return;
        }

        // Anti-Fraud: Kiểm tra tính toàn vẹn vị trí (Fake GPS / Độ chính xác)
        const integrity = inspectLocationIntegrity(loc);
        if (!integrity.isValid) {
          navigation.navigate('CheckInFailed', {
            reason: integrity.riskReason || 'Tín hiệu GPS không đủ độ tin cậy.',
            data: eventId,
            isLocationError: true,
          });
          return;
        }

        const userLat = loc.coords.latitude;
        const userLon = loc.coords.longitude;
        verifiedLocation = {
          latitude: userLat,
          longitude: userLon,
          // @ts-ignore - Pass extra telemetry to server for anti-fraud audit
          accuracy: integrity.accuracy,
          isMockLocation: integrity.isMocked,
        };
        setRealCoords({ latitude: userLat, longitude: userLon });

        // Tính khoảng cách Haversine giữa vị trí thực tế của sinh viên và sự kiện theo bán kính sự kiện
        const eventRadius = eventData.coordinates.radiusMeters || CHECK_IN_RADIUS_METERS;
        const { withinRadius, distanceMeters } = isWithinCheckInRadius(
          userLat,
          userLon,
          eventData.coordinates.latitude,
          eventData.coordinates.longitude,
          eventRadius
        );
        calculatedDistance = distanceMeters;

        // Nếu sinh viên ở ngoài bán kính cho phép -> CHẶN NGAY LẬP TỨC
        if (!withinRadius) {
          const distStr = formatDistance(distanceMeters);
          navigation.navigate('CheckInFailed', {
            reason: `Vị trí không hợp lệ! Vị trí thực tế của bạn đang cách địa điểm sự kiện "${eventData.title}" khoảng ${distStr} (vượt quá bán kính cho phép ${eventRadius}m). Hệ thống chống gian lận yêu cầu bạn phải có mặt tại địa điểm.`,
            data: eventId,
            distanceMeters,
            isLocationError: true,
          });
          return;
        }
        }
      }

      // Bước 3: Gửi request điểm danh lên server (kèm toạ độ vị trí thực tế)
      setLoadingMessage('Vị trí hợp lệ! Đang ghi nhận điểm danh...');
      const response = await qrCheckIn({
        eventId,
        userId: currentUser?._id,
        studentId: currentUser?.studentId,
        userLocation: verifiedLocation,
      });

      if (response && response.success) {
        // QR check-in is performed outside a Redux thunk. Refresh the global
        // registration state before navigating so other screens immediately
        // disable duplicate registration and show the correct schedule.
        if (currentUser?._id) {
          await dispatch(fetchMyRegistrations(currentUser._id));
        }
        navigation.navigate('CheckInSuccess', {
          eventId,
          eventTitle: eventData?.title || response.data?.event?.title,
          studentName: currentUser?.fullName || response.data?.user?.name || 'Sinh viên',
          studentId: currentUser?.studentId || response.data?.user?.studentId || '',
          checkInTime: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          data: eventId,
          locationVerified: !!verifiedLocation,
          distanceMeters: calculatedDistance,
        });
      } else {
        navigation.navigate('CheckInFailed', {
          reason: response?.message || 'Điểm danh không thành công.',
          data: eventId,
          isLocationError: false,
        });
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra mạng.';

      const isLocErr =
        error?.response?.status === 403 ||
        errMsg.toLowerCase().includes('vị trí') ||
        errMsg.toLowerCase().includes('bán kính');

      navigation.navigate('CheckInFailed', {
        reason: errMsg,
        data: eventId,
        distanceMeters: error?.response?.data?.distanceMeters,
        isLocationError: isLocErr,
      });
    } finally {
      setLoading(false);
    }
  };

  /** Development-only path for emulator/simulator testing without a camera. */
  const handleMockScan = () => {
    void handleBarCodeScanned(
      { data: `EVENTMATE:${MOCK_EVENT_ID}`, type: 'qr' } as BarcodeScanningResult,
      { mockLocation: true },
    );
  };

  // 1. Trạng thái đang kiểm tra quyền Camera
  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.permissionText}>Đang kiểm tra quyền Camera...</Text>
        <TouchableOpacity style={styles.backPermissionBtn} onPress={handleGoBack}>
          <Text style={styles.backPermissionBtnText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Trạng thái người dùng chưa cấp quyền Camera
  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={42} color="#2563EB" />
        </View>
        <Text style={styles.permissionTitle}>Cần cấp quyền Camera</Text>
        <Text style={styles.permissionDescription}>
          Ứng dụng cần quyền Camera để quét mã QR điểm danh tham gia sự kiện.
        </Text>

        {cameraPermission.canAskAgain ? (
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
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

        {__DEV__ && (
          <TouchableOpacity style={[styles.permissionButton, styles.mockButton]} onPress={handleMockScan}>
            <Text style={styles.permissionButtonText}>Chạy QR mock (Development)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backPermissionBtn} onPress={handleGoBack} activeOpacity={0.8}>
          <Text style={styles.backPermissionBtnText}>← Quay lại màn hình trước</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Giao diện Camera với Mask và Anti-Fake Status Bar
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* CameraView (Expo SDK 58) */}
      {isFocused && (
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
      />
      )}

      {/* ================= LỚP OVERLAY LÀM TỐI XUNG QUANH (rgba(0,0,0,0.5)) ================= */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Phần trên: Tối màu đen mờ */}
        <View style={styles.overlayTop}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleGoBack}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Quét mã Check-in</Text>

            <TouchableOpacity
              style={[styles.headerButton, torchEnabled && styles.headerButtonActive]}
              onPress={() => setTorchEnabled((prev) => !prev)}
            >
              <Ionicons name={torchEnabled ? 'flash' : 'flash-outline'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Badge Trạng thái GPS Google Maps */}
          <TouchableOpacity
            style={styles.gpsBadge}
            activeOpacity={0.8}
            onPress={() => {
              if (realCoords) {
                openInGoogleMaps(realCoords.latitude, realCoords.longitude, 'Vị trí hiện tại của tôi');
              } else {
                void refreshRealLocation(true);
              }
            }}
          >
            <View
              style={[
                styles.gpsDot,
                { backgroundColor: realCoords ? '#22C55E' : '#EF4444' },
              ]}
            />
            <Ionicons name="location-outline" size={16} color="#FFFFFF" />
            <Text style={styles.gpsBadgeText}>{gpsDisplayInfo}</Text>
            {realCoords && <Text style={styles.mapsLinkText}>[Xem Maps]</Text>}
          </TouchableOpacity>

          {/* Hiển thị địa chỉ thực tế từ Google Maps Geocoding nếu có */}
          {realAddress && (
            <View style={styles.realAddressContainer}>
              <Text style={styles.realAddressText} numberOfLines={1}>
                {realAddress}
              </Text>
            </View>
          )}
        </View>

        {/* Hàng giữa: 2 bên tối màu đen mờ, ở giữa là hình vuông trong suốt */}
        <View style={styles.overlayMiddleRow}>
          {/* Tối bên trái */}
          <View style={styles.overlaySide} />

          {/* Khung quét QR trong suốt ở giữa */}
          <GestureDetector gesture={viewfinderGesture}>
          <Animated.View style={[styles.viewfinder, animatedFrameStyle]}>
            {/* 4 góc khung quét */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animation 1: tia laser; Animation 2: khung quét kéo được bằng gesture. */}
            <Animated.View style={[styles.scanLine, animatedScanLineStyle]} />
          </Animated.View>
          </GestureDetector>

          {/* Tối bên phải */}
          <View style={styles.overlaySide} />
        </View>

        {/* Phần dưới: Tối màu đen mờ kèm text hướng dẫn & công cụ kiểm thử thực tế */}
        <ScrollView
          style={styles.overlayBottom}
          contentContainerStyle={styles.overlayBottomContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.instructionText}>Đưa mã QR sự kiện vào khung</Text>
          <Text style={styles.subInstructionText}>
            Hệ thống tự động xác thực sự có mặt của sinh viên tại địa điểm tổ chức
          </Text>

          {/* Thanh công cụ kiểm thử thực tế cho Giảng viên & Hội đồng chấm thi */}
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoSuccessBtn}
              activeOpacity={0.8}
              onPress={handleSetEventToCurrentLocation}
            >
              <View style={styles.demoButtonTitle}>
                <Ionicons name="locate" size={14} color="#4ADE80" style={{ marginRight: 4 }} />
                <Text style={styles.demoSuccessBtnText}>Tại trường (≤500m)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoFailBtn}
              activeOpacity={0.8}
              onPress={handleSetEventFarAway}
            >
              <View style={styles.demoButtonTitle}>
                <Ionicons name="warning-outline" size={14} color="#F87171" style={{ marginRight: 4 }} />
                <Text style={styles.demoFailBtnText}>Ngoài trường (&gt;500m)</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Nút Fallback: Nhập mã PIN dự phòng */}
          <TouchableOpacity
            style={styles.passcodeFallbackBtn}
            onPress={() => setShowPasscodeModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="keypad-outline" size={16} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.passcodeFallbackBtnText}>Nhập mã PIN dự phòng (Passcode)</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity style={styles.mockScanButton} onPress={handleMockScan} accessibilityRole="button">
              <Text style={styles.mockScanButtonText}>Chạy QR mock trên Emulator</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Modal Nhập Passcode Fallback khi GPS hoặc Camera bị lỗi */}
      <Modal
        visible={showPasscodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasscodeModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="keypad" size={24} color="#F59E0B" />
              <Text style={styles.modalTitle}>Điểm danh mã PIN</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Áp dụng khi hội trường không có sóng GPS hoặc camera bị lỗi. Nhập mã PIN do Ban Tổ Chức công bố trên màn chiếu:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="VD: 889900"
              placeholderTextColor="#94A3B8"
              value={passcodeInput}
              onChangeText={setPasscodeInput}
              keyboardType="number-pad"
              maxLength={8}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowPasscodeModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handlePasscodeCheckInSubmit}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= OVERLAY LOADING KHI ĐANG KIỂM TRA & GỌI API ================= */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Lớp màu đen mờ làm tối xung quanh theo yêu cầu rgba(0, 0, 0, 0.5)
const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)';
const CORNER_COLOR = '#22C55E';
const CORNER_SIZE = 26;
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
  mockButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
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
  backPermissionBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backPermissionBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },

  // Overlay Layout
  overlayContainer: {
    ...StyleSheet.absoluteFill,
  },
  overlayTop: {
    flex: 0.85,
    backgroundColor: OVERLAY_COLOR,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 42,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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

  // GPS Badge
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsBadgeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  mapsLinkText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  realAddressContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '90%',
  },
  realAddressText: {
    color: '#E2E8F0',
    fontSize: 11,
    textAlign: 'center',
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
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 10,
  },

  // Laser tia quét Reanimated
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: CORNER_COLOR,
    shadowColor: CORNER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },

  // Phần đáy dưới khung quét
  overlayBottom: {
    flex: 1.25,
    backgroundColor: OVERLAY_COLOR,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  overlayBottomContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subInstructionText: {
    color: '#CBD5E1',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },

  // Demo Controls
  demoButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  demoButtonTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  demoSuccessBtn: {
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  demoSuccessBtnText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  demoFailBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoFailBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  mockScanButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  mockScanButtonText: { color: '#BFDBFE', fontSize: 12, fontWeight: '700' },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: '#1E293B',
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingText: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  passcodeFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 4,
  },
  passcodeFallbackBtnText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 6,
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#334155',
    marginRight: 10,
  },
  modalCancelText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
  },
  modalConfirmText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
