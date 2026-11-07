import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  FlatList,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "../../services/localNotifications";
import { notificationChannelOptions, requestReminderPermission, syncEventReminders, cancelAllReminders } from '../../services/eventReminders';
import { loadReminderSettings, saveReminderSettings, validReminderMinutes } from '../../services/reminderSettings';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchEvents } from '../../features/events/eventsSlice';
import { fetchMyRegistrations } from '../../features/check-in/registrationsSlice';
import { useAppTheme } from "../../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Event } from '../../types/event';
import { upcomingRegisteredEvents } from '../../utils/registrations';

function EventImage({ uri, title }: { uri?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const { theme } = useAppTheme();
  if (!uri || failed) {
    return (
      <View style={[styles.eventImage, { backgroundColor: theme.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="calendar-outline" size={36} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Chưa có ảnh sự kiện</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.eventImage} resizeMode="cover"
    accessibilityLabel={`Ảnh ${title}`} onError={() => setFailed(true)} />;
}

// ---------------------------------------------------------------------------
// NotificationReminderScreen
// ---------------------------------------------------------------------------

export default function NotificationReminderScreen() {
  const { theme, isDark } = useAppTheme();
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Đang kiểm tra quyền thông báo...",
  );

  const dispatch = useAppDispatch();
  const userId = useAppSelector(s => s.auth.user?._id);
  const [minutes, setMinutes] = useState('30');
  const [busy, setBusy] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const events = useAppSelector(s => s.events.list);
  const registrations = useAppSelector(s => s.registrations.myRegistrations);
  const upcomingEvents = upcomingRegisteredEvents(registrations, events, userId, now);

  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    void Promise.all([
      dispatch(fetchEvents()).unwrap(),
      ...(userId ? [dispatch(fetchMyRegistrations(userId)).unwrap()] : []),
    ]).catch(error => setStatusMessage('Không thể tải sự kiện: ' + String(error)));
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [dispatch, userId]));

  const renderEvent = ({ item: event }: { item: Event }) => {
    const remaining = Date.parse(event.time.start) - now;
    const startsWithinOneDay = remaining <= 24 * 60 * 60 * 1000;
    const totalMinutes = Math.ceil(remaining / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutesLeft = totalMinutes % 60;
    const endMinutes = event.time.end ? Math.ceil((Date.parse(event.time.end) - now) / 60000) : NaN;
    const endHours = Math.floor(endMinutes / 60);
    const endRemainder = endMinutes % 60;
    const ongoingLabel = Number.isFinite(endMinutes)
      ? `Đang diễn ra · Còn ${endHours > 0 ? `${endHours} giờ ` : ''}${endRemainder} phút đến khi kết thúc`
      : 'Đang diễn ra';
    const timeLeft = remaining <= 0 ? ongoingLabel : remaining < 60000 ? 'Sắp bắt đầu' : days > 0
      ? `Còn ${days} ngày${hours > 0 ? ` ${hours} giờ` : ''}`
      : hours > 0 ? `Còn ${hours} giờ${minutesLeft > 0 ? ` ${minutesLeft} phút` : ''}`
      : `Còn ${minutesLeft} phút`;
    return (
      <TouchableOpacity style={[styles.notificationCard, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 12 }]}
        onPress={() => navigation.navigate('EventDetail', { eventId: event._id, title: event.title })}
        accessibilityRole="button" accessibilityLabel={`Chi tiết sự kiện ${event.title}`}>
        <EventImage key={event.images?.[0] || event._id} uri={event.images?.[0]} title={event.title} />
        <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>{event.title}</Text>
        <Text style={[styles.notificationMessage, {
          color: startsWithinOneDay ? '#DC2626' : '#D97706',
          backgroundColor: startsWithinOneDay ? '#FEE2E2' : '#FEF3C7',
          fontWeight: '600', alignSelf: 'flex-start', paddingHorizontal: 8,
          paddingVertical: 4, borderRadius: 6, marginBottom: 6,
        }]}>
          {new Date(event.time.start).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
          {' · '}{timeLeft}
        </Text>
        <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>{event.location}</Text>
      </TouchableOpacity>
    );
  };
  useEffect(() => {
    void loadReminderSettings().then(settings => { setMinutes(String(settings.minutes)); setSettingsLoaded(true); }).catch(error => setStatusMessage(String(error)));
    void requestReminderPermission().then(granted => { setPermissionGranted(granted); setStatusMessage(granted ? 'Sẵn sàng gửi thông báo.' : 'Chưa có quyền thông báo. Hãy bật trong cài đặt thiết bị.'); }).catch(error => setStatusMessage(String(error)));
  }, []);

  /** Gửi thông báo đẩy về thiết bị ngay lập tức */
  const handleSendInstantNotification = async () => {
    try {
      const isGranted = await requestReminderPermission();
      setPermissionGranted(isGranted);
      if (!isGranted) {
        Alert.alert(
          "Chưa cấp quyền",
          "Vui lòng cho phép ứng dụng gửi thông báo trong Cài đặt.",
        );
        return;
      }
      setPermissionGranted(true);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "StudentEventApp",
          body: "Thông báo thử nghiệm đã được gửi đến thiết bị của bạn.",
          data: { screen: "schedule" },
          sound: "default",
        },
        trigger: notificationChannelOptions().channelId ? { channelId: notificationChannelOptions().channelId! } : null,
      });

      setStatusMessage("Đã phát Local Notification thành công!");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể gửi thông báo: " + (error as Error).message,
      );
    }
  };

  /** Hẹn giờ gửi thông báo sau 5 giây */
  const handleScheduleNotification = async () => {
    try {
      const isGranted = await requestReminderPermission();
      setPermissionGranted(isGranted);
      if (!isGranted) {
        Alert.alert("Chưa cấp quyền", "Vui lòng cấp quyền gửi thông báo.");
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Thông báo thử nghiệm",
          body: "Thông báo thử nghiệm sau 5 giây đã đến!",
          sound: "default",
          data: { type: "test" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 5 * 1000),
          ...notificationChannelOptions(),
        },
      });

      Alert.alert(
        "Đã hẹn giờ (5s)",
        "Thông báo sẽ xuất hiện trên điện thoại sau 5 giây. Bạn có thể khóa màn hình để thử nghiệm!",
      );
      setStatusMessage("Đang chờ 5s để phát thông báo về thiết bị...");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể hẹn giờ thông báo: " + (error as Error).message,
      );
    }
  };

  /** Lập lịch nhắc nhở trước khi diễn ra sự kiện */
  const handleScheduleForSpecificEventDate = async () => {
    const value = Number(minutes);
    if (!validReminderMinutes(value)) { Alert.alert('Thời gian không hợp lệ', 'Nhập số phút nguyên từ 1 đến 10080 (7 ngày).'); return; }
    if (!userId) return;
    setBusy(true);
    try {
      const granted = await requestReminderPermission();
      setPermissionGranted(granted);
      if (!granted) { Alert.alert('Chưa cấp quyền', 'Hãy bật quyền thông báo trong cài đặt thiết bị.'); return; }
      const [events, registrations] = await Promise.all([dispatch(fetchEvents()).unwrap(), dispatch(fetchMyRegistrations(userId)).unwrap()]);
      await saveReminderSettings({ minutes: value, enabled: true });
      const result = await syncEventReminders(events, registrations, userId);
      const message = result.denied ? 'Chưa có quyền thông báo.' : `Đã lưu nhắc trước ${value} phút. Đã lập lịch ${result.scheduled} sự kiện; bỏ qua ${result.skipped} sự kiện đã qua mốc nhắc hoặc không còn phù hợp.`;
      setStatusMessage(message);
      Alert.alert('Lịch nhắc sự kiện', message);
    } catch (error) { Alert.alert('Lỗi', String(error)); }
    finally { setBusy(false); }
  };

  /** Hủy toàn bộ thông báo Local đã lên lịch */
  const handleCancelAllScheduledLocalNotifications = async () => {
    setBusy(true);
    try {
      const settings = await loadReminderSettings();
      await saveReminderSettings({ ...settings, enabled: false });
      await cancelAllReminders();
      Alert.alert("Đã hủy", "Đã xóa tất cả các lịch nhắc nhở đã cài đặt.");
      setStatusMessage("Đã xóa tất cả lịch thông báo đã đặt.");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể hủy thông báo: " + (error as Error).message,
      );
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />

      <FlatList
        data={upcomingEvents}
        keyExtractor={event => event._id}
        renderItem={renderEvent}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>Hiện chưa có sự kiện nào sắp diễn ra.</Text>}
        ListHeaderComponent={<>
        <View style={styles.header}>
          <View style={[styles.headerIconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
            <Ionicons name="notifications-outline" size={26} color={theme.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Nhắc nhở sự kiện</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Kiểm tra và phát thông báo trực tiếp đến điện thoại</Text>
        </View>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: permissionGranted ? "#22C55E" : "#EF4444" },
            ]}
          />
          <Text style={[styles.statusText, { color: theme.textPrimary }]}>
            {statusMessage}
          </Text>
        </View>

        <View style={[styles.notificationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>Thời gian nhắc mặc định (phút)</Text>
          <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad"
            editable={settingsLoaded && !busy} accessibilityLabel="Số phút nhắc trước sự kiện"
            style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, marginVertical: 12, color: theme.textPrimary }} />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleScheduleForSpecificEventDate}
            disabled={busy || !settingsLoaded}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Lập lịch nhắc nhở theo ngày giờ sự kiện"
          >
            <View style={styles.buttonContent}><Ionicons name="calendar-outline" size={19} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{busy ? 'Đang lập lịch…' : 'Lưu và lập lịch thông báo sự kiện'}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2",
                borderColor: isDark ? "#F87171" : "#FCA5A5",
              },
            ]}
            onPress={handleCancelAllScheduledLocalNotifications}
            disabled={busy || !settingsLoaded}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hủy tất cả lịch thông báo"
          >
            <View style={styles.buttonContent}><Ionicons name="trash-outline" size={19} color={theme.danger} /><Text style={[styles.cancelButtonText, { color: theme.danger }]}>Hủy toàn bộ lịch nhắc nhở</Text></View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateScheduleButton,
              {
                backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF",
                borderColor: isDark ? theme.primary : "#BFDBFE",
              },
            ]}
            onPress={handleSendInstantNotification}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Gửi thông báo ngay lập tức"
          >
            <View style={styles.buttonContent}><Ionicons name="notifications-outline" size={19} color={theme.primary} /><Text style={[styles.dateScheduleButtonText, { color: theme.primary }]}>Gửi thông báo ngay tới điện thoại</Text></View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleScheduleNotification}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hẹn giờ gửi thông báo sau 5 giây"
          >
            <View style={styles.buttonContent}><Ionicons name="timer-outline" size={19} color={theme.textPrimary} /><Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Hẹn gửi sau 5s (Thử khóa màn hình)</Text></View>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionLabel, { color: theme.textPrimary, marginTop: 24 }]}>
          SỰ KIỆN SẮP DIỄN RA ({upcomingEvents.length})
        </Text>
        </>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eventImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#0F172A",
    fontWeight: "500",
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  timestampText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  cardBody: {
    marginTop: 2,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13.5,
    color: "#475569",
    lineHeight: 20,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
  },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  primaryButton: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 14.5,
    fontWeight: "600",
  },
  dateScheduleButton: {
    backgroundColor: "#EFF6FF",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  dateScheduleButtonText: {
    color: "#2563EB",
    fontSize: 14.5,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FEF2F2",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
});
