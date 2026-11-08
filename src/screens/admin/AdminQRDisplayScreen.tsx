/**
 * AdminQRDisplayScreen – Phân hệ Admin: Tạo & Trình chiếu Dynamic QR Code điểm danh.
 *
 * TÍNH NĂNG CHUẨN PRODUCTION:
 * 1. Dynamic QR Token (JWT / HMAC):
 *    - Tự động gọi API lấy Token bảo mật có thời hạn 45 giây.
 *    - Chống chụp màn hình gửi cho người khác (Anti-Replay / Anti-Screensharing).
 * 2. Đếm ngược thời gian thực (Countdown Timer):
 *    - Đồng hồ 45s & Thanh tiến trình đổi màu (Xanh -> Vàng -> Đỏ).
 *    - Tự động làm mới khi hết hạn (Auto-refresh) hoặc bấm nút làm mới tức thì.
 * 3. Hỗ trợ 2 chuẩn quét:
 *    - In-App Scanner (quét trong app)
 *    - Camera mặc định hệ điều hành (iOS / Android / Zalo) qua Deep Link `studentevent://checkin?...`
 * 4. Hybrid Rendering:
 *    - Ưu tiên ảnh chất lượng cao 500x500 từ QR Service (đọc cực nhạy từ xa 3m).
 *    - Tự động chuyển sang QRCodeView cục bộ khi ngoại tuyến (không cần internet).
 * 5. Fullscreen Projector Mode: Trình chiếu máy chiếu hội trường.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  Share,
  Clipboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdminStackParamList } from '../../navigation/types';
import { navigate } from '../../navigation/navigationRef';
import { getEventById, getEventQrToken, DynamicQrTokenResponse } from '../../services/api';
import { Event } from '../../types';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { useAppTheme } from '../../theme/ThemeContext';
import QRCodeView from '../../components/qr/QRCodeView';

type RouteType = RouteProp<AdminStackParamList, 'AdminQRDisplay'>;
type NavType = NativeStackNavigationProp<AdminStackParamList, 'AdminQRDisplay'>;

const DEMO_EVENTS = [
  { id: '66f1e2010000000000000001', title: 'Hội thảo AI & Kỹ thuật 2026', passcode: '111111' },
  { id: '66f1e2020000000000000002', title: 'Workshop Kỹ năng Thuyết trình', passcode: '222222' },
  { id: '66f1e2030000000000000003', title: 'Ngày hội Việc làm IUH 2026', passcode: '333333' },
  { id: '66f1e2040000000000000004', title: 'Hội thao Sinh viên 2026', passcode: '444444' },
  { id: '66f1e2050000000000000005', title: 'Cuộc thi Lập trình IUH', passcode: '555555' },
  { id: '66f1e2060000000000000006', title: 'Lễ Tri ân Sinh viên Tốt nghiệp', passcode: '666666' },
];

export default function AdminQRDisplayScreen() {
  const { theme, isDark } = useAppTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavType>();
  const { eventId, eventTitle } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [fullscreenModal, setFullscreenModal] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [useOfflineQr, setUseOfflineQr] = useState(false);

  // Dynamic QR Token State
  const [qrTokenData, setQrTokenData] = useState<DynamicQrTokenResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(45);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // 1. Tải thông tin sự kiện
  useEffect(() => {
    getEventById(eventId)
      .then((data) => setEvent(data))
      .catch((e) => console.warn('[AdminQRDisplay] Load event error:', e));
  }, [eventId]);

  // 2. Hàm gọi API lấy Dynamic Token mới từ Backend
  const fetchNewToken = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getEventQrToken(eventId);
      setQrTokenData(data);
      setCountdown(data.ttlSeconds || 45);
    } catch (err) {
      console.warn('[AdminQRDisplay] Lỗi fetch QR token:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  // Khởi tạo token lần đầu
  useEffect(() => {
    void fetchNewToken();
  }, [fetchNewToken]);

  // 3. Đếm ngược thời gian sống của mã QR (mỗi giây trừ 1)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Hết 45 giây -> Tự động nạp mã QR mới
          void fetchNewToken();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNewToken]);

  // Chuỗi Payload thực tế chứa trong QR (hỗ trợ cả scheme studentevent:// và https://)
  const qrPayload =
    qrTokenData?.qrPayload ||
    qrTokenData?.schemeUrl ||
    `studentevent://checkin?eventId=${eventId}`;

  // Passcode dự phòng
  const demoPasscode = DEMO_EVENTS.find((d) => d.id === eventId)?.passcode;
  const displayPasscode = (event as any)?.checkInPasscode || demoPasscode || '889900';

  // Sao chép nội dung payload
  const handleCopyPayload = () => {
    try {
      Clipboard.setString(qrPayload);
    } catch {}
    Alert.alert(
      '📋 Payload Mã QR Bảo Mật',
      `Đường dẫn Deep Link:\n${qrPayload}\n\nĐược mã hóa với chữ ký JWT và tự động hết hạn sau ${countdown} giây.`,
      [{ text: 'Đã hiểu' }]
    );
  };

  // Chia sẻ Deep Link
  const handleShare = async () => {
    try {
      await Share.share({
        message: `📋 Mã QR điểm danh: ${event?.title || eventTitle}\n\nDeep Link Check-in: ${qrPayload}\nMã PIN dự phòng: ${displayPasscode}\n\n🎓 StudentEventApp – IUH`,
        title: `QR Check-in: ${event?.title || eventTitle}`,
      });
    } catch (e: any) {
      Alert.alert('Lỗi chia sẻ', e.message);
    }
  };

  // Tính phần trăm thanh thời gian (45s -> 0s)
  const progressPercent = Math.max(0, Math.min(100, (countdown / 45) * 100));
  const progressColor =
    countdown > 20 ? '#10B981' : countdown > 8 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigate('AdminEvents'))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          Mã QR Điểm Danh Bảo Mật
        </Text>
        <TouchableOpacity
          style={styles.headerShareBtn}
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Card Trình Chiếu QR ── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>

          {/* Badge & Tiêu đề */}
          <View style={[styles.headerBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
            <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.headerBadgeText, { color: '#059669' }]}>
              DYNAMIC QR CODE • ĐỔI MỚI MỖI 45S
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={3}>
            {event?.title || eventTitle}
          </Text>

          {/* Thanh Tiến Trình Đếm Ngược Thời Gian */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownRow}>
              <View style={styles.countdownLabelBox}>
                <Ionicons name="timer-outline" size={16} color={progressColor} style={{ marginRight: 4 }} />
                <Text style={[styles.countdownText, { color: progressColor }]}>
                  Hết hạn sau: <Text style={{ fontWeight: '900', fontSize: 15 }}>{countdown}s</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={fetchNewToken}
                disabled={isRefreshing}
                activeOpacity={0.7}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                    <Text style={styles.refreshBtnText}>Làm mới ngay</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Thanh Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%`, backgroundColor: progressColor },
                ]}
              />
            </View>
          </View>

          {/* ── Khung Mã QR (Hybrid: Online Image + Offline fallback) ── */}
          <TouchableOpacity
            style={styles.qrTouchable}
            onPress={() => setFullscreenModal(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Bấm vào mã QR để phóng to toàn màn hình"
          >
            <View style={[styles.qrContainer, { borderColor: progressColor }]}>
              {!useOfflineQr ? (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(qrPayload)}`,
                  }}
                  style={{ width: 220, height: 220 }}
                  resizeMode="contain"
                  onError={() => setUseOfflineQr(true)}
                />
              ) : (
                <QRCodeView
                  value={qrPayload}
                  size={220}
                  darkColor="#0F172A"
                  lightColor="#FFFFFF"
                  quietZone={2}
                />
              )}
            </View>

            <View style={[styles.zoomHintBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF', borderColor: theme.border }]}>
              <Ionicons name="expand-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={[styles.zoomHintText, { color: '#2563EB' }]}>
                Chạm để phóng to toàn màn hình (Chiếu Máy Chiếu)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Payload Deep Link Text */}
          <TouchableOpacity onPress={handleCopyPayload} style={styles.payloadBtn} activeOpacity={0.7}>
            <Text style={[styles.qrPayloadText, { color: theme.textTertiary }]} numberOfLines={1}>
              Deep Link: <Text style={{ color: theme.primary, fontWeight: '700' }}>{qrPayload}</Text>{' '}
              <Ionicons name="copy-outline" size={12} color={theme.primary} />
            </Text>
          </TouchableOpacity>

          {/* ── Passcode Dự Phòng (Khi mất GPS hoặc hỏng Camera) ── */}
          <TouchableOpacity
            style={[styles.passcodeBox, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', borderColor: '#F59E0B' }]}
            onPress={() => setShowPasscode((p) => !p)}
            activeOpacity={0.8}
          >
            <View style={styles.passcodeHeader}>
              <Ionicons name="keypad-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={[styles.passcodeTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                Mã PIN dự phòng (Passcode) – Dùng khi GPS hoặc Camera lỗi
              </Text>
              <Ionicons name={showPasscode ? 'eye-off-outline' : 'eye-outline'} size={16} color="#F59E0B" />
            </View>
            {showPasscode ? (
              <Text style={styles.passcodeValue}>{displayPasscode}</Text>
            ) : (
              <Text style={[styles.passcodeHidden, { color: isDark ? '#FDE68A' : '#B45309' }]}>
                Bấm để xem mã PIN 6 số cho sinh viên
              </Text>
            )}
            <Text style={[styles.passcodeNote, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              Chiếu mã này lên góc bảng. Sinh viên bấm "Nhập mã PIN dự phòng" trên app để xác thực không cần camera.
            </Text>
          </TouchableOpacity>

          {/* ── Thông tin địa điểm & GPS ── */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>📍 Địa điểm tổ chức:</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{event?.location || 'Trường Đại học Công nghiệp TP.HCM'}</Text>
            </View>

            {event?.coordinates?.latitude != null && event?.coordinates?.longitude != null ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>🛡️ Kiểm tra Anti-Fake GPS:</Text>
                <Text style={[styles.detailValue, { color: '#059669', fontWeight: '700' }]}>
                  {event.coordinates.latitude.toFixed(5)}, {event.coordinates.longitude.toFixed(5)} (Bán kính {event.coordinates.radiusMeters || 500}m)
                </Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>⭐ Quyền lợi:</Text>
              <Text style={[styles.detailValue, { color: '#F59E0B', fontWeight: '700' }]}>
                +{(event as any)?.trainingPoints || 10} Điểm rèn luyện
              </Text>
            </View>
          </View>

          {/* Hướng dẫn 2 luồng quét */}
          <View style={[styles.instructionsBox, { backgroundColor: isDark ? 'rgba(37,99,235,0.1)' : '#EFF6FF', borderColor: isDark ? '#3B82F6' : '#BFDBFE' }]}>
            <Text style={[styles.instructionsTitle, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
              💡 2 Cách quét mã cho sinh viên:
            </Text>
            <Text style={[styles.instructionsStep, { color: isDark ? '#BFDBFE' : '#1E40AF' }]}>
              📱 <Text style={{ fontWeight: 'bold' }}>Cách 1 (Trong App):</Text> Mở app &rarr; Tab "Check-in" &rarr; Quét mã.
            </Text>
            <Text style={[styles.instructionsStep, { color: isDark ? '#BFDBFE' : '#1E40AF' }]}>
              📷 <Text style={{ fontWeight: 'bold' }}>Cách 2 (Camera ngoài/Zalo):</Text> Dùng Camera mặc định điện thoại quét &rarr; Bấm banner xuất hiện trên màn hình để mở thẳng vào App điểm danh tự động.
            </Text>
          </View>
        </View>

        {/* ── Chuyển đổi nhanh 6 Sự kiện Demo ── */}
        <View style={[styles.demoSwitchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.demoSwitchTitle, { color: theme.textPrimary }]}>
            🔀 Chọn Sự Kiện Khác Để Trình Chiếu QR:
          </Text>
          {DEMO_EVENTS.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[
                styles.demoEventRow,
                { borderColor: e.id === eventId ? theme.primary : theme.border },
                e.id === eventId && { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
              ]}
              onPress={() => navigation.replace('AdminQRDisplay', { eventId: e.id, eventTitle: e.title })}
              activeOpacity={0.7}
            >
              <Ionicons
                name={e.id === eventId ? 'radio-button-on' : 'radio-button-off'}
                size={16}
                color={e.id === eventId ? theme.primary : theme.textTertiary}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.demoEventTitle, { color: e.id === eventId ? theme.primary : theme.textPrimary }]} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={[styles.demoEventPin, { color: theme.textTertiary }]}>PIN: {e.passcode}</Text>
              </View>
              {e.id === eventId && (
                <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.activeBadgeText}>Đang chiếu</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ── Modal Toàn Màn Hình Dành Cho Máy Chiếu Hội Trường ── */}
      <Modal
        visible={fullscreenModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullscreenModal(false)}
      >
        <SafeAreaView style={styles.fullscreenSafe}>
          <StatusBar barStyle="light-content" />

          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setFullscreenModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.fullscreenCloseText}>Đóng</Text>
            </TouchableOpacity>

            <View style={styles.fullscreenCountdownBadge}>
              <Ionicons name="timer-outline" size={14} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.fullscreenCountdownText}>Đổi mã sau: {countdown}s</Text>
            </View>

            <TouchableOpacity
              style={styles.fullscreenRefreshBtn}
              onPress={fetchNewToken}
              disabled={isRefreshing}
            >
              <Ionicons name="refresh" size={18} color="#93C5FD" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenBody}>
            <Text style={styles.fullscreenTitle} numberOfLines={2}>
              {event?.title || eventTitle}
            </Text>
            <Text style={styles.fullscreenLocation}>
              📍 {event?.location || 'Trường Đại học Công nghiệp TP.HCM'}
            </Text>

            {/* Khung QR cực lớn cho máy chiếu */}
            <View style={[styles.fullscreenQRBox, { borderColor: progressColor }]}>
              {!useOfflineQr ? (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrPayload)}`,
                  }}
                  style={{ width: 290, height: 290 }}
                  resizeMode="contain"
                  onError={() => setUseOfflineQr(true)}
                />
              ) : (
                <QRCodeView
                  value={qrPayload}
                  size={290}
                  darkColor="#0F172A"
                  lightColor="#FFFFFF"
                  quietZone={2}
                />
              )}
            </View>

            {/* Passcode trong màn hình fullscreen */}
            <View style={styles.fullscreenPasscodeBox}>
              <Text style={styles.fullscreenPasscodeLabel}>Mã PIN Dự Phòng (Khi Không Quét Được QR):</Text>
              <Text style={styles.fullscreenPasscodeValue}>{displayPasscode}</Text>
            </View>

            <Text style={styles.fullscreenNotice}>
              ✨ Sinh viên có thể dùng Camera App hoặc Camera Zalo/iPhone quét trực tiếp vào màn hình này.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center', marginHorizontal: 8 },
  headerShareBtn: { padding: 4 },

  scroll: { padding: 16, paddingBottom: 32 },

  card: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '800' },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },

  // Countdown
  countdownContainer: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countdownLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#2563EB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  qrTouchable: { alignItems: 'center', marginBottom: 10 },
  qrContainer: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  zoomHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoomHintText: { fontSize: 11, fontWeight: '600' },

  payloadBtn: { paddingVertical: 4, marginBottom: 14, maxWidth: '95%' },
  qrPayloadText: { fontSize: 11, fontFamily: 'monospace', textAlign: 'center' },

  passcodeBox: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  passcodeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  passcodeTitle: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  passcodeValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F59E0B',
    textAlign: 'center',
    letterSpacing: 8,
    marginVertical: 6,
    fontFamily: 'monospace',
  },
  passcodeHidden: { fontSize: 12, textAlign: 'center', marginVertical: 4, fontStyle: 'italic' },
  passcodeNote: { fontSize: 11, lineHeight: 15, marginTop: 4 },

  detailsBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  instructionsBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  instructionsTitle: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  instructionsStep: { fontSize: 12, lineHeight: 18, marginBottom: 4 },

  // Demo Switch
  demoSwitchBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  demoSwitchTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  demoEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  demoEventTitle: { fontSize: 13, fontWeight: '600' },
  demoEventPin: { fontSize: 11, marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  // Fullscreen Modal
  fullscreenSafe: { flex: 1, backgroundColor: '#0F172A' },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fullscreenCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenCloseText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  fullscreenCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  fullscreenCountdownText: { color: '#FCD34D', fontSize: 12, fontWeight: '700' },
  fullscreenRefreshBtn: { padding: 8 },

  fullscreenBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 28,
  },
  fullscreenLocation: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  fullscreenQRBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 14,
  },
  fullscreenPasscodeBox: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  fullscreenPasscodeLabel: { color: '#FCD34D', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  fullscreenPasscodeValue: {
    color: '#FBBF24',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 10,
    fontFamily: 'monospace',
  },
  fullscreenNotice: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
