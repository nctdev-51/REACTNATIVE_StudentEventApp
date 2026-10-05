import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CheckInSuccessScreenProps } from '../../navigation/CheckInStack';

export default function CheckInSuccessScreen({ route, navigation }: CheckInSuccessScreenProps) {
  const { eventId, studentName, studentId, checkInTime, data } = route.params || {};

  const handleGoHome = () => {
    // Quay về màn hình đầu tiên của Stack hoặc đóng navigation
    if (navigation.canGoBack()) {
      navigation.popToTop();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Phần trung tâm: Icon Check màu xanh lá to & Thông báo */}
        <View style={styles.centerContent}>
          {/* Icon Check xanh lá thật to ở giữa màn hình */}
          <View style={styles.iconCircle}>
            <Text style={styles.checkmarkIcon}>✓</Text>
          </View>

          <Text style={styles.title}>Check-in thành công</Text>
          <Text style={styles.subtitle}>
            Thông tin tham gia sự kiện của bạn đã được ghi nhận thành công.
          </Text>

          {/* Hộp hiển thị chi tiết (nếu có) */}
          <View style={styles.detailCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sự kiện (ID):</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {eventId || data || 'N/A'}
              </Text>
            </View>

            {studentName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sinh viên:</Text>
                <Text style={styles.infoValue}>{studentName}</Text>
              </View>
            )}

            {studentId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MSSV:</Text>
                <Text style={styles.infoValue}>{studentId}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian:</Text>
              <Text style={styles.infoValue}>
                {checkInTime || new Date().toLocaleString('vi-VN')}
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
    paddingVertical: 32,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Icon Check màu xanh lá thật to ở giữa
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16A34A', // Xanh lá cây
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmarkIcon: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 72,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
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
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  footer: {
    width: '100%',
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
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

