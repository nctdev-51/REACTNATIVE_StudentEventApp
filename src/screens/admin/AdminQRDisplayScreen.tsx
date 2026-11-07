import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { getEventById } from '../../services/api';
import { Event } from '../../types';
import { openInGoogleMaps } from '../../utils/permissionHandler';
import { Colors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

type RouteType = RouteProp<AdminStackParamList, 'AdminQRDisplay'>;
type NavType = NativeStackNavigationProp<AdminStackParamList, 'AdminQRDisplay'>;

export default function AdminQRDisplayScreen() {
  const { theme, isDark } = useAppTheme();
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavType>();
  const { eventId, eventTitle } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Quản lý trạng thái tải ảnh QR & nguồn ảnh dự phòng
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [providerIndex, setProviderIndex] = useState(0);
  const [fullscreenModal, setFullscreenModal] = useState(false);

  useEffect(() => {
    getEventById(eventId)
      .then((data) => setEvent(data))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [eventId]);

  const qrPayload = `EVENTMATE:${eventId}`;

  // Đa nguồn URL QR để không bao giờ bị lỗi kết nối hoặc chặn mạng
  const qrProviders = [
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrPayload)}`,
    `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=400&margin=1`,
    `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(qrPayload)}`,
  ];

  const currentQrUrl = qrProviders[providerIndex % qrProviders.length];

  const handleImageError = () => {
    setImageLoading(false);
    if (providerIndex < qrProviders.length - 1) {
      setProviderIndex((prev) => prev + 1);
      setImageLoading(true);
    } else {
      setImageError(true);
    }
  };

  const handleCopyPayload = () => {
    Alert.alert(
      'Mã điểm danh sự kiện',
      `Mã định danh:\n${qrPayload}\n\nSinh viên khi quét mã QR này qua camera sẽ tự động khớp với sự kiện "${event?.title || eventTitle}".`,
      [{ text: 'Đóng', style: 'default' }]
    );
  };

  const handleRetryQR = () => {
    setImageLoading(true);
    setImageError(false);
    setProviderIndex((prev) => (prev + 1) % qrProviders.length);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>‹ Quay lại</Text>
        </TouchableOpacity>

        {/* Card Trình chiếu */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.headerBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF', color: theme.primary }]}>
            📷 MÃ QR ĐIỂM DANH SỰ KIỆN
          </Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{event?.title || eventTitle}</Text>

          {/* QR Code có hỗ trợ bấm vào để phóng to toàn màn hình */}
          <TouchableOpacity
            style={styles.qrTouchable}
            onPress={() => setFullscreenModal(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Bấm vào mã QR để phóng to toàn màn hình"
          >
            <View style={[styles.qrContainer, { borderColor: theme.border }]}>
              {imageLoading && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang nạp mã QR...</Text>
                </View>
              )}

              {imageError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Không thể tải ảnh mã QR</Text>
                  <Text style={[styles.errorSub, { color: theme.textTertiary }]}>Vui lòng kiểm tra kết nối mạng</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={handleRetryQR}>
                    <Text style={styles.retryBtnText}>🔄 Thử nguồn khác</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={{ uri: currentQrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={handleImageError}
                />
              )}
            </View>

            {/* Gợi ý tương tác bấm vào */}
            <View style={[styles.zoomHintBadge, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF', borderColor: isDark ? '#3B82F6' : '#BFDBFE' }]}>
              <Text style={[styles.zoomHintText, { color: theme.primary }]}>
                🔍 Bấm vào ảnh mã QR để phóng to toàn màn hình
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCopyPayload} style={styles.payloadBtn} activeOpacity={0.7}>
            <Text style={[styles.qrPayloadText, { color: theme.textTertiary }]}>
              Mã định danh: <Text style={{ color: theme.primary, fontWeight: '700' }}>{qrPayload}</Text> 📋
            </Text>
          </TouchableOpacity>

          {/* Info Details */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>📍 Địa điểm tổ chức:</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{event?.location || 'Đang cập nhật'}</Text>
            </View>

            {event?.coordinates?.latitude != null && event?.coordinates?.longitude != null ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>🌐 Toạ độ Anti-Fake GPS:</Text>
                <Text style={styles.coordsValue}>
                  {event.coordinates.latitude.toFixed(5)}, {event.coordinates.longitude.toFixed(5)} (Bán kính {event.coordinates.radiusMeters || 300}m)
                </Text>
              </View>
            ) : (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>🌐 Định vị điểm danh:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>
                  {event?.coordinates?.radiusMeters
                    ? `Bán kính hợp lệ ${event.coordinates.radiusMeters}m quanh khuôn viên`
                    : 'Điểm danh tự do (Chưa ghim toạ độ cụ thể)'}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>🏢 Đơn vị tổ chức:</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{event?.faculty || 'Ban Chấp hành Đoàn trường'}</Text>
            </View>
          </View>

          {/* Instructions */}
          <View
            style={[
              styles.instructionsBox,
              {
                backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB',
                borderColor: isDark ? '#F59E0B' : '#FEF3C7',
              },
            ]}
          >
            <Text style={[styles.instructionsTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>
              💡 Hướng dẫn cho sinh viên:
            </Text>
            <Text style={[styles.instructionsStep, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              1. Mở ứng dụng <Text style={{ fontWeight: 'bold' }}>StudentEventApp</Text> trên điện thoại.
            </Text>
            <Text style={[styles.instructionsStep, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              2. Chọn nút <Text style={{ fontWeight: 'bold' }}>"Quét QR"</Text> tại thanh điều hướng.
            </Text>
            <Text style={[styles.instructionsStep, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              3. Bật quyền <Text style={{ fontWeight: 'bold' }}>Vị trí (GPS)</Text> để hệ thống đối soát bán kính điểm danh.
            </Text>
          </View>

          {event?.coordinates?.latitude != null && event?.coordinates?.longitude != null && (
            <TouchableOpacity
              style={[
                styles.mapBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF',
                  borderColor: isDark ? '#818CF8' : '#C7D2FE',
                },
              ]}
              onPress={() =>
                openInGoogleMaps(
                  event.coordinates!.latitude,
                  event.coordinates!.longitude,
                  event.location
                )
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.mapBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
                🗺️ Mở địa điểm trên Google Maps
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ─── Modal Phóng To Mã QR Toàn Màn Hình (Fullscreen QR Mode) ─── */}
      <Modal
        visible={fullscreenModal}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullscreenModal(false)}
      >
        <SafeAreaView style={[styles.fullscreenSafe, { backgroundColor: isDark ? '#0F172A' : '#1E293B' }]}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setFullscreenModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.fullscreenCloseText}>✕ Đóng</Text>
            </TouchableOpacity>

            <Text style={styles.fullscreenBadge}>📷 MÃ QR TRÌNH CHIẾU MÁY CHIẾU</Text>
          </View>

          <View style={styles.fullscreenBody}>
            <Text style={styles.fullscreenTitle} numberOfLines={2}>
              {event?.title || eventTitle}
            </Text>
            <Text style={styles.fullscreenLocation}>
              📍 Địa điểm: {event?.location || 'Trường Đại học Công nghiệp TP.HCM'}
            </Text>

            {/* Mã QR kích thước cực đại */}
            <View style={styles.fullscreenQRBox}>
              <Image
                source={{ uri: currentQrUrl }}
                style={styles.fullscreenQRImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.fullscreenPayloadText}>
              Mã định danh: {qrPayload}
            </Text>

            <Text style={styles.fullscreenNotice}>
              ✨ Sinh viên đứng từ xa hoặc nhìn lên màn hình máy chiếu đều có thể quét mã điểm danh ngay lập tức.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  backBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  qrTouchable: {
    alignItems: 'center',
    marginBottom: 8,
  },
  qrContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  qrImage: { width: 230, height: 230 },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  zoomHintBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  zoomHintText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  payloadBtn: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  qrPayloadText: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  coordsValue: { fontSize: 12, color: '#059669', fontWeight: '700' },
  instructionsBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  instructionsTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 2 },
  instructionsStep: { fontSize: 12, color: '#B45309', lineHeight: 17 },
  mapBtn: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  mapBtnText: { color: '#4338CA', fontSize: 13, fontWeight: '700' },

  // Fullscreen Modal Styles
  fullscreenSafe: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fullscreenCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullscreenCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fullscreenBadge: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  fullscreenBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  fullscreenLocation: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  fullscreenQRBox: {
    width: 320,
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  fullscreenQRImage: {
    width: 288,
    height: 288,
  },
  fullscreenPayloadText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  fullscreenNotice: {
    color: '#E2E8F0',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
