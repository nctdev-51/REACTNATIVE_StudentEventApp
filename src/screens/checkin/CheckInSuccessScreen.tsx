import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckInSuccessScreenProps } from '../../navigation/CheckInStack';
import { useAppTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function CheckInSuccessScreen({ route, navigation }: CheckInSuccessScreenProps) {
  const { theme, isDark } = useAppTheme();
  const {
    eventId,
    eventTitle,
    studentName,
    studentId,
    checkInTime,
    data,
    locationVerified,
    distanceMeters,
  } = route.params || {};

  const handleGoHome = () => {
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('Home');
    } else {
      (navigation as any).navigate('Home');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.container}>
        {/* Phần trung tâm: Icon Check màu xanh lá to & Thông báo */}
        <View style={styles.centerContent}>
          {/* Icon Check xanh lá thật to ở giữa màn hình */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={54} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>Check-in thành công</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Thông tin tham gia sự kiện và toạ độ hợp lệ đã được ghi nhận vào hệ thống.
          </Text>

          {/* Badge Anti-Fake: Xác minh vị trí thành công */}
          <View
            style={[
              styles.antiFakeBadge,
              {
                backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                borderColor: isDark ? '#34D399' : '#A7F3D0',
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? '#34D399' : '#065F46'} />
            <View style={styles.antiFakeBadgeTextContainer}>
              <Text
                style={[
                  styles.antiFakeBadgeTitle,
                  { color: isDark ? '#34D399' : '#065F46' },
                ]}
              >
                Xác thực vị trí thành công (Anti-Fake)
              </Text>
              <Text
                style={[
                  styles.antiFakeBadgeSubtitle,
                  { color: isDark ? '#6EE7B7' : '#047857' },
                ]}
              >
                {distanceMeters !== undefined
                  ? `Vị trí cách địa điểm: ${distanceMeters}m (Trong bán kính an toàn 500m)`
                  : 'Đã đối soát toạ độ GPS hợp lệ qua Expo Location'}
              </Text>
            </View>
          </View>

          {/* Hộp hiển thị chi tiết */}
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {eventTitle && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Sự kiện:</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]} numberOfLines={2}>
                  {eventTitle}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Mã sự kiện:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]} numberOfLines={1}>
                {eventId || data || 'N/A'}
              </Text>
            </View>

            {studentName && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Sinh viên:</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{studentName}</Text>
              </View>
            )}

            {studentId && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>MSSV:</Text>
                <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{studentId}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Thời gian:</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {checkInTime || new Date().toLocaleString('vi-VN')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Trạng thái:</Text>
              <Text style={[styles.infoValue, { color: '#16A34A', fontWeight: '700' }]}>
                Đã điểm danh
              </Text>
            </View>
          </View>
        </View>

        {/* Nút bấm bên dưới: "Về trang chủ" */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleGoHome}
          >
            <Text style={styles.primaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon Check màu xanh lá thật to ở giữa
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmarkIcon: {
    fontSize: 56,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  antiFakeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 18,
    gap: 10,
  },
  antiFakeBadgeIcon: {
    fontSize: 22,
  },
  antiFakeBadgeTextContainer: {
    flex: 1,
  },
  antiFakeBadgeTitle: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
  },
  antiFakeBadgeSubtitle: {
    color: '#047857',
    fontSize: 12,
    marginTop: 2,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  footer: {
    width: '100%',
    paddingTop: 12,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
