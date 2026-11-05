import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckInFailedScreenProps } from '../../navigation/CheckInStack';
import { useAppTheme } from '../../theme/ThemeContext';

export default function CheckInFailedScreen({ route, navigation }: CheckInFailedScreenProps) {
  const { theme, isDark } = useAppTheme();
  const { reason, data, distanceMeters, isLocationError } = route.params || {};

  const handleRetry = () => {
    navigation.goBack();
  };

  const handleGoHome = () => {
    const parent = navigation.getParent();
    if (parent) {
      (parent as any).navigate('Home');
    } else {
      (navigation as any).navigate('Home');
    }
  };

  const isGpsIssue =
    isLocationError ||
    (reason &&
      (reason.toLowerCase().includes('vị trí') ||
        reason.toLowerCase().includes('bán kính') ||
        reason.toLowerCase().includes('gps') ||
        reason.toLowerCase().includes('khoảng cách')));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.container}>
        {/* Phần trung tâm: Icon X màu đỏ to & Thông báo lỗi */}
        <View style={styles.centerContent}>
          {/* Icon X màu đỏ thật to ở giữa màn hình */}
          <View style={styles.iconCircle}>
            <Text style={styles.closeIcon}>✕</Text>
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>Không thể check-in</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {reason || 'Đã có lỗi xảy ra khi xác thực thông tin check-in. Vui lòng kiểm tra lại.'}
          </Text>

          {/* Cảnh báo riêng cho vi phạm Anti-Fake GPS */}
          {isGpsIssue && (
            <View
              style={[
                styles.antiFakeAlertBox,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
                  borderColor: isDark ? '#F87171' : '#FECACA',
                },
              ]}
            >
              <Text style={styles.antiFakeAlertIcon}>📍</Text>
              <View style={styles.antiFakeAlertContent}>
                <Text
                  style={[
                    styles.antiFakeAlertTitle,
                    { color: isDark ? '#FCA5A5' : '#991B1B' },
                  ]}
                >
                  Cảnh báo chống gian lận (Anti-Fake)
                </Text>
                <Text
                  style={[
                    styles.antiFakeAlertDesc,
                    { color: isDark ? '#FCD5D5' : '#B91C1C' },
                  ]}
                >
                  Hệ thống yêu cầu sinh viên phải có mặt trong bán kính ≤ 500m quanh sự kiện để điểm danh.
                </Text>
              </View>
            </View>
          )}

          {/* Hộp gợi ý & chi tiết */}
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardHeader, { color: theme.textPrimary }]}>Nguyên nhân & Hướng xử lý:</Text>

            {isGpsIssue ? (
              <>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                    Bạn đang ở quá xa địa điểm sự kiện
                    {distanceMeters ? ` (~${distanceMeters}m).` : '.'} Hãy di chuyển vào khu vực tổ chức.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                    Đảm bảo đã cấp quyền Vị trí (Location) và bật GPS độ chính xác cao.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                    Mã QR không hợp lệ hoặc sự kiện đã kết thúc/hủy.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                    Kết nối mạng bị gián đoạn khi gửi dữ liệu lên máy chủ.
                  </Text>
                </View>
              </>
            )}

            {data && (
              <View
                style={[
                  styles.dataBox,
                  { borderTopColor: theme.borderSubtle },
                ]}
              >
                <Text style={[styles.dataLabel, { color: theme.textTertiary }]}>Dữ liệu mã nhận diện:</Text>
                <Text
                  style={[
                    styles.dataCode,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      color: theme.textPrimary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {data}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Nút bấm bên dưới: "Thử lại" và "Về trang chủ" */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleRetry}
          >
            <Text style={styles.primaryButtonText}>Thử lại quét QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
            onPress={handleGoHome}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
              Về trang chủ
            </Text>
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
  // Icon X màu đỏ thật to ở giữa
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  closeIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 54,
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
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  antiFakeAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  antiFakeAlertIcon: {
    fontSize: 22,
  },
  antiFakeAlertContent: {
    flex: 1,
  },
  antiFakeAlertTitle: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 13,
  },
  antiFakeAlertDesc: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
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
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  bulletDot: {
    fontSize: 15,
    color: '#DC2626',
    marginRight: 8,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  dataBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dataLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 3,
  },
  dataCode: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
  },
  footer: {
    width: '100%',
    paddingTop: 12,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
