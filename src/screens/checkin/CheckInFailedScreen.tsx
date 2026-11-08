import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckInFailedScreenProps } from '../../navigation/CheckInStack';
import { useAppTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../hooks/redux';
import { submitCheckInAppeal } from '../../services/api';

export default function CheckInFailedScreen({ route, navigation }: CheckInFailedScreenProps) {
  const { theme, isDark } = useAppTheme();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { reason, data, distanceMeters, isLocationError } = route.params || {};

  // Luồng khiếu nại (Appeal Dispute)
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [appealReason, setAppealReason] = useState<string>('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState<boolean>(false);

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

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      Alert.alert('Chưa nhập lý do', 'Vui lòng giải thích ngắn gọn nguyên nhân bạn không thể điểm danh.');
      return;
    }

    setIsSubmittingAppeal(true);
    try {
      await submitCheckInAppeal({
        eventId: data || '66f1e2010000000000000001',
        userId: currentUser?._id,
        studentId: currentUser?.studentId,
        studentName: currentUser?.fullName,
        reason: appealReason.trim(),
        proofImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', // Mock proof selfie
      });

      setShowAppealModal(false);
      Alert.alert(
        'Đã gửi khiếu nại thành công! 📝',
        'Đơn khiếu nại điểm danh của bạn đã được chuyển tới Ban Tổ chức trên Web Portal. Kết quả sẽ được thông báo ngay khi được phê duyệt.',
        [{ text: 'Đóng', onPress: handleGoHome }]
      );
    } catch (e: any) {
      Alert.alert('Không thể gửi khiếu nại', e?.response?.data?.message || 'Vui lòng thử lại sau.');
    } finally {
      setIsSubmittingAppeal(false);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Phần trung tâm: Icon X màu đỏ & Thông báo lỗi */}
        <View style={styles.centerContent}>
          {/* Icon X màu đỏ ở giữa màn hình */}
          <View style={styles.iconCircle}>
            <Ionicons name="close" size={44} color="#FFFFFF" />
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
              <Ionicons name="location-outline" size={24} color={isDark ? '#FCA5A5' : '#991B1B'} style={{ marginRight: 10 }} />
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

        {/* Nút bấm bên dưới: "Thử lại", "Gửi khiếu nại" và "Về trang chủ" */}
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
              styles.appealButton,
              {
                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                borderColor: isDark ? '#F59E0B' : '#D97706',
              },
            ]}
            activeOpacity={0.8}
            onPress={() => setShowAppealModal(true)}
          >
            <Ionicons name="document-text-outline" size={20} color={isDark ? '#FBBF24' : '#B45309'} style={{ marginRight: 8 }} />
            <Text style={[styles.appealButtonText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
              Khiếu nại điểm danh (Gửi BTC)
            </Text>
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
      </ScrollView>

      {/* Modal Khiếu nại điểm danh */}
      <Modal
        visible={showAppealModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppealModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="shield-checkmark" size={22} color="#D97706" />
              </View>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Khiếu nại điểm danh</Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Nếu bạn đang có mặt tại sự kiện nhưng bị lỗi GPS (tầng hầm, nhà kín) hoặc camera bị mờ, hãy giải thích để Ban Tổ chức xác nhận thủ công.
            </Text>

            <TextInput
              style={[
                styles.appealInput,
                {
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                },
              ]}
              placeholder="VD: Em ngồi hàng ghế đầu hội trường E4 nhưng điện thoại báo mất tín hiệu GPS..."
              placeholderTextColor={theme.textTertiary || '#94A3B8'}
              multiline
              numberOfLines={4}
              value={appealReason}
              onChangeText={setAppealReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowAppealModal(false)}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitAppeal}
                disabled={isSubmittingAppeal}
              >
                {isSubmittingAppeal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Gửi cho BTC</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  // Icon X màu đỏ ở giữa
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  closeIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 54,
  },
  title: {
    fontSize: 22,
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
  },
  primaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
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
  appealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    minHeight: 50,
  },
  appealButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  appealInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
  },
  modalSubmitBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
  },
});
