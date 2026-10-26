import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Safe permission requester that avoids warnOfExpoGoPushUsage error in Expo Go SDK 53+ */
async function safeRequestPermissions(): Promise<boolean> {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient';

  if (isExpoGo && Platform.OS === 'android') {
    // Expo Go Android SDK 53+ throws warnOfExpoGoPushUsage when requesting push permissions.
    // Local notifications work directly via scheduleNotificationAsync on Expo Go!
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    // Fallback for Expo Go environment
    return true;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  title: string;
  body: string;
  appName?: string;
  timestamp?: string;
}

export interface NotificationReminderScreenProps {
  notification?: NotificationPayload;
  onNotificationPress?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#2563EB';
const BACKGROUND = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_COLOR = '#E2E8F0';

const DEFAULT_NOTIFICATION: NotificationPayload = {
  appName: 'EventMate',
  timestamp: 'bây giờ',
  title: 'Sự kiện sắp bắt đầu!',
  body: 'Workshop React Native sẽ bắt đầu sau 30 phút tại Hội trường A.',
};

// ---------------------------------------------------------------------------
// Icons (Pure React Native Views)
// ---------------------------------------------------------------------------

/** EventMate App Logo Icon */
function EventMateAppIcon() {
  return (
    <View style={iconStyles.appIconSquare}>
      <View style={iconStyles.appHatRoof} />
      <View style={iconStyles.appHatBase} />
    </View>
  );
}

/** Bell Outline Icon */
function BellIcon({ color = '#2563EB' }: { color?: string }) {
  return (
    <View style={iconStyles.bellContainer}>
      <View style={[iconStyles.bellBody, { borderColor: color }]} />
      <View style={[iconStyles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  appIconSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appHatRoof: {
    width: 12,
    height: 6,
    borderBottomWidth: 1.8,
    borderLeftWidth: 1.8,
    borderRightWidth: 1.8,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '180deg' }],
  },
  appHatBase: {
    width: 8,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginTop: 1,
  },
  bellContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBody: {
    width: 16,
    height: 14,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  bellClapper: {
    width: 5,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});

// ---------------------------------------------------------------------------
// NotificationReminderScreen (Giao diện 10 - Quản lý & Trigger Thông báo)
// ---------------------------------------------------------------------------

export default function NotificationReminderScreen({
  notification = DEFAULT_NOTIFICATION,
  onNotificationPress,
}: NotificationReminderScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Đang kiểm tra quyền thông báo...');

  // Yêu cầu quyền thông báo an toàn (không bị lỗi warnOfExpoGoPushUsage trên Expo Go Android SDK 53+)
  useEffect(() => {
    async function checkPermissions() {
      const isGranted = await safeRequestPermissions();
      setPermissionGranted(isGranted);
      setStatusMessage(
        isGranted
          ? 'Sẵn sàng phát Local Notification trên Expo Go'
          : 'Chưa cấp quyền thông báo trên thiết bị!'
      );
    }

    checkPermissions();
  }, []);

  /** Gửi thông báo đẩy thật sự về thiết bị ngay lập tức */
  const handleSendInstantNotification = async () => {
    try {
      const isGranted = await safeRequestPermissions();
      if (!isGranted) {
        Alert.alert('Chưa cấp quyền', 'Vui lòng cho phép ứng dụng gửi thông báo trong Cài đặt.');
        return;
      }
      setPermissionGranted(true);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { screen: 'schedule' },
          sound: true,
        },
        trigger: null, // null = gửi ngay lập tức
      });

      setStatusMessage('Đã phát Local Notification thành công!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi thông báo: ' + (error as Error).message);
    }
  };

  /** Hẹn giờ gửi thông báo sau 5 giây (để người dùng khóa màn hình thử nghiệm) */
  const handleScheduleNotification = async () => {
    try {
      const isGranted = await safeRequestPermissions();
      if (!isGranted) {
        Alert.alert('Chưa cấp quyền', 'Vui lòng cấp quyền gửi thông báo.');
        return;
      }
      setPermissionGranted(true);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });

      Alert.alert(
        'Đã hẹn giờ (5s)',
        'Thông báo sẽ xuất hiện trên điện thoại sau 5 giây. Bạn có thể khóa màn hình để test thông báo khóa!'
      );
      setStatusMessage('Đang chờ 5s để phát thông báo về thiết bị...');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hẹn giờ thông báo: ' + (error as Error).message);
    }
  };

  /** Hàm mẫu: Lập lịch Local Notification trước ngày/giờ diễn ra sự kiện (Ví dụ: trước 30 phút) */
  const handleScheduleForSpecificEventDate = async () => {
    try {
      // Giả lập ngày giờ sự kiện: 10 giây sau thời điểm hiện tại (dùng để test)
      const targetTime = new Date(Date.now() + 10 * 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🗓️ Nhắc nhở sự kiện: Workshop React Native',
          body: 'Sự kiện sẽ bắt đầu sau 30 phút tại Hội trường A. Bạn nhớ tham gia đúng giờ nhé!',
          sound: true,
          data: { eventId: '1', screen: 'schedule' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetTime,
        },
      });

      Alert.alert(
        'Lập lịch Local Noti thành công!',
        `Đã lên lịch nhắc nhở Local Notification cho sự kiện (ID: ${notificationId}). Thông báo sẽ đổ chuông sau 10 giây!`
      );
      setStatusMessage(`Đã lập lịch Local Notification cho sự kiện thành công!`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lập lịch: ' + (error as Error).message);
    }
  };

  /** Hủy toàn bộ thông báo Local đã lên lịch */
  const handleCancelAllScheduledLocalNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Đã hủy', 'Đã xóa tất cả các lịch nhắc nhở Local Notification đã cài đặt.');
      setStatusMessage('Đã xóa tất cả lịch Local Notification đã đặt.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hủy thông báo: ' + (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nút Back + Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Quay lại</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <BellIcon color={ACCENT_COLOR} />
          </View>
          <Text style={styles.headerTitle}>Nhắc nhở sự kiện</Text>
          <Text style={styles.headerSubtitle}>
            Kiểm tra và phát thông báo trực tiếp đến điện thoại
          </Text>
        </View>

        {/* Trạng thái quyền thông báo */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: permissionGranted ? '#22C55E' : '#EF4444' },
            ]}
          />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {/* Thẻ xem trước Giao diện Thông báo (In-App Preview Card) */}
        <Text style={styles.sectionLabel}>MẪU THÔNG BÁO</Text>
        <TouchableOpacity
          style={styles.notificationCard}
          onPress={onNotificationPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Thông báo sự kiện"
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.appNameRow}>
              <EventMateAppIcon />
              <Text style={styles.appNameText}>{notification.appName || 'EventMate'}</Text>
            </View>
            <Text style={styles.timestampText}>{notification.timestamp || 'bây giờ'}</Text>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.body}</Text>
          </View>
        </TouchableOpacity>

        {/* Nút bấm Test thông báo thật về điện thoại */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSendInstantNotification}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Gửi thông báo ngay lập tức"
          >
            <Text style={styles.primaryButtonText}>🔔 Gửi thông báo ngay tới điện thoại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleScheduleNotification}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hẹn giờ gửi thông báo sau 5 giây"
          >
            <Text style={styles.secondaryButtonText}>⏱️ Hẹn gửi sau 5s (Thử khóa màn hình)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateScheduleButton}
            onPress={handleScheduleForSpecificEventDate}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Lập lịch nhắc nhở theo ngày giờ sự kiện"
          >
            <Text style={styles.dateScheduleButtonText}>🗓️ Test lập lịch sự kiện (Báo sau 10s)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelAllScheduledLocalNotifications}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hủy tất cả lịch thông báo"
          >
            <Text style={styles.cancelButtonText}>🗑️ Hủy toàn bộ lịch Local Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles (Flexbox Responsive Design)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  // Top bar with back button
  topBar: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backArrow: {
    fontSize: 26,
    color: ACCENT_COLOR,
    fontWeight: '300',
    lineHeight: 28,
    marginRight: 4,
  },
  backLabel: {
    fontSize: 15,
    color: ACCENT_COLOR,
    fontWeight: '500',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 24,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: '500',
    flex: 1,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Notification Card UI
  notificationCard: {
    backgroundColor: BACKGROUND,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  timestampText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  cardBody: {
    marginTop: 2,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },

  // Action Buttons
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: ACCENT_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: BACKGROUND,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  secondaryButtonText: {
    color: TEXT_PRIMARY,
    fontSize: 14.5,
    fontWeight: '600',
  },
  dateScheduleButton: {
    backgroundColor: '#EFF6FF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateScheduleButtonText: {
    color: ACCENT_COLOR,
    fontSize: 14.5,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
