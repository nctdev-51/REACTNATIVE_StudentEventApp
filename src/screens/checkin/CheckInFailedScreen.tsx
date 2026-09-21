import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CheckInFailedScreenProps } from '../../navigation/CheckInStack';

export default function CheckInFailedScreen({ route, navigation }: CheckInFailedScreenProps) {
  const { reason, data } = route.params || {};

  const handleRetry = () => {
    // Quay lại màn hình quét QR (QRScannerScreen sẽ tự mở lại quét qua useFocusEffect)
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Phần trung tâm: Icon X màu đỏ to & Thông báo lỗi */}
        <View style={styles.centerContent}>
          {/* Icon X màu đỏ thật to ở giữa màn hình */}
          <View style={styles.iconCircle}>
            <Text style={styles.closeIcon}>✕</Text>
          </View>

          <Text style={styles.title}>Không thể check-in</Text>
          <Text style={styles.subtitle}>
            {reason || 'Đã có lỗi xảy ra khi xác thực thông tin check-in. Vui lòng kiểm tra lại.'}
          </Text>

          {/* Hộp gợi ý & chi tiết */}
          <View style={styles.detailCard}>
            <Text style={styles.cardHeader}>Nguyên nhân có thể do:</Text>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                Mã QR không hợp lệ hoặc không thuộc hệ thống sự kiện.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                Kết nối mạng bị gián đoạn khi gửi dữ liệu lên máy chủ.
              </Text>
            </View>

            {data && (
              <View style={styles.dataBox}>
                <Text style={styles.dataLabel}>Dữ liệu nhận diện:</Text>
                <Text style={styles.dataCode} numberOfLines={1}>
                  {data}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Nút bấm bên dưới: "Thử lại" */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleRetry}
          >
            <Text style={styles.primaryButtonText}>Thử lại</Text>
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
  // Icon X màu đỏ thật to ở giữa
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626', // Màu đỏ
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  closeIcon: {
    fontSize: 54,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 60,
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
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: '#DC2626',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  dataBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dataLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  dataCode: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'monospace',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  footer: {
    width: '100%',
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
});

