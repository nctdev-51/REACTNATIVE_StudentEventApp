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

  useEffect(() => {
    getEventById(eventId)
      .then((data) => setEvent(data))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [eventId]);

  const qrPayload = `EVENTMATE:${eventId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
    qrPayload
  )}`;

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

          {/* QR Code (nền trắng để camera đọc chuẩn) */}
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.qrPayloadText, { color: theme.textTertiary }]}>Mã định danh: {qrPayload}</Text>

          {/* Info Details */}
          <View style={[styles.detailsBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>📍 Địa điểm tổ chức:</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{event?.location || 'Đang cập nhật'}</Text>
            </View>

            {event?.coordinates && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>🌐 Toạ độ Anti-Fake GPS:</Text>
                <Text style={styles.coordsValue}>
                  {event.coordinates.latitude.toFixed(5)}, {event.coordinates.longitude.toFixed(5)} (Bán kính 500m)
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

          {event?.coordinates && (
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
    marginBottom: 10,
  },
  qrImage: { width: 230, height: 230 },
  qrPayloadText: { fontSize: 11, color: '#94A3B8', marginBottom: 16, fontFamily: 'monospace' },
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
});
