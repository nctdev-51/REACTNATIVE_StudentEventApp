<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useCallback, useEffect, useState } from "react";
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
import React, { useCallback, useEffect, useState } from "react";
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
<<<<<<< HEAD
<<<<<<< HEAD
  ScrollView,
<<<<<<< HEAD
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
=======
﻿import React, { useCallback, useState } from 'react';
import { Linking, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
>>>>>>> b65f9f5 (feat: update event management app)
=======
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
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from '../../services/localNotifications';
import { Text } from 'tamagui';
import { Button, Card, Input, Modal } from '../../components/common';
import { useAppSelector } from '../../hooks/redux';
import type { MainStackParamList } from '../../navigation/types';
<<<<<<< HEAD
<<<<<<< HEAD
import { useAppTheme } from '../../theme/ThemeContext';
=======
=======
  FlatList,
  TextInput,
  Image,
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "../../services/localNotifications";
import { notificationChannelOptions, requestReminderPermission, syncEventReminders, cancelAllReminders } from '../../services/eventReminders';
import { loadReminderSettings, saveReminderSettings, validReminderMinutes } from '../../services/reminderSettings';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchEvents } from '../../features/events/eventsSlice';
import { fetchMyRegistrations } from '../../features/check-in/registrationsSlice';
import { useAppTheme } from "../../theme/ThemeContext";
<<<<<<< HEAD
>>>>>>> 92595a1 (feat(auth): implement session hydration and async storage for authentication)
=======
import { Ionicons } from "@expo/vector-icons";
<<<<<<< HEAD
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)

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
=======
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Event } from '../../types/event';
import { upcomingRegisteredEvents } from '../../utils/registrations';

=======
import type { Event } from '../../types/event';
import { upcomingRegisteredEvents } from '../../utils/registrations';

>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
  }
  return <Image source={{ uri }} style={styles.eventImage} resizeMode="cover"
    accessibilityLabel={`Ảnh ${title}`} onError={() => setFailed(true)} />;
}

// ---------------------------------------------------------------------------
<<<<<<< HEAD
<<<<<<< HEAD
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

const DEFAULT_NOTIFICATION: NotificationPayload = {
  appName: 'StudentEventApp',
  timestamp: 'bây giờ',
  title: 'Sự kiện sắp bắt đầu!',
  body: 'Workshop React Native sẽ bắt đầu sau 30 phút tại Hội trường A.',
};

// ---------------------------------------------------------------------------
// Icons (Pure React Native Views)
// ---------------------------------------------------------------------------

/** EventMate App Logo Icon */
function EventMateAppIcon({ accentColor }: { accentColor: string }) {
  return (
    <View style={[iconStyles.appIconSquare, { backgroundColor: accentColor }]}>
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
    backgroundColor: '#2563EB',
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
=======
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
// NotificationReminderScreen
// ---------------------------------------------------------------------------

export default function NotificationReminderScreen() {
  const { theme, isDark } = useAppTheme();
<<<<<<< HEAD
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
=======
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
// NotificationReminderScreen
// ---------------------------------------------------------------------------

export default function NotificationReminderScreen() {
  const { theme, isDark } = useAppTheme();
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Đang kiểm tra quyền thông báo...",
  );

<<<<<<< HEAD
<<<<<<< HEAD
  useEffect(() => {
    async function checkPermissions() {
      const isGranted = await safeRequestPermissions();
      setPermissionGranted(isGranted);
      setStatusMessage(
        isGranted
          ? 'Sẵn sàng phát Local Notification trên thiết bị'
          : 'Chưa cấp quyền thông báo trên thiết bị!'
      );
    }
=======
  const dispatch = useAppDispatch();
  const userId = useAppSelector(s => s.auth.user?._id);
  const [minutes, setMinutes] = useState('30');
  const [busy, setBusy] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const events = useAppSelector(s => s.events.list);
  const registrations = useAppSelector(s => s.registrations.myRegistrations);
<<<<<<< HEAD
  const registeredIds = new Set(registrations.filter(r => r.userId === userId && r.status === 'registered')
    .map(r => typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId as Event)._id : r.eventId));
  const upcomingEvents = events.filter(event => !event.isHidden && event.status !== 'completed' &&
    event.status !== 'past' && Date.parse(event.time.start) > now)
    .sort((a, b) => Date.parse(a.time.start) - Date.parse(b.time.start));
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
  const upcomingEvents = upcomingRegisteredEvents(registrations, events, userId, now);
>>>>>>> 3a5da53 (sửa giao diện, xử lý các trường hợp sự kiện đã đăng ký, đồng bộ giao diện lịch sắp diễn ra và notification)

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
=======
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
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    void loadReminderSettings().then(settings => { setMinutes(String(settings.minutes)); setSettingsLoaded(true); }).catch(error => setStatusMessage(String(error)));
    void requestReminderPermission().then(granted => { setPermissionGranted(granted); setStatusMessage(granted ? 'Sẵn sàng gửi thông báo.' : 'Chưa có quyền thông báo. Hãy bật trong cài đặt thiết bị.'); }).catch(error => setStatusMessage(String(error)));
  }, []);

  /** Gửi thông báo đẩy về thiết bị ngay lập tức */
  const handleSendInstantNotification = async () => {
=======
import { getEventReminders, requestReminderPermission } from '../../services/eventReminders';

export default function NotificationReminderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const userId = useAppSelector(state => state.auth.user?._id);
  const [items, setItems] = useState<Notifications.NotificationRequest[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setItems(userId ? await getEventReminders(userId) : []); }
    catch { setMessage('Không thể tải nhắc nhở. Vui lòng thử lại.'); }
  }, [userId]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const enable = async () => {
    setBusy(true);
>>>>>>> b65f9f5 (feat: update event management app)
    try {
<<<<<<< HEAD
<<<<<<< HEAD
      setMessage(await requestReminderPermission()
        ? 'Đã bật quyền. Sự kiện đăng ký thành công sẽ được nhắc trước 30 phút.'
        : 'Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị.');
    } catch { setMessage('Không thể kiểm tra quyền thông báo.'); }
    finally { setBusy(false); }
=======
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
  };
<<<<<<< HEAD

  /** Hẹn giờ gửi thông báo sau 5 giây */
  const handleScheduleNotification = async () => {
=======
  const cancel = async () => {
    if (!cancelId) return;
    setBusy(true);
>>>>>>> b65f9f5 (feat: update event management app)
    try {
<<<<<<< HEAD
<<<<<<< HEAD
      await Notifications.cancelScheduledNotificationAsync(cancelId);
      setCancelId(null);
      await refresh();
    } catch { setMessage('Không thể hủy nhắc nhở. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  const testNotification = async () => {
    if (Platform.OS === 'web' || busy) return;
    setBusy(true);
    try {
      if (!await requestReminderPermission()) {
        setMessage('Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị.');
=======
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
      const isGranted = await requestReminderPermission();
      setPermissionGranted(isGranted);
      if (!isGranted) {
        Alert.alert("Chưa cấp quyền", "Vui lòng cấp quyền gửi thông báo.");
<<<<<<< HEAD
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
<<<<<<< HEAD
<<<<<<< HEAD
          title: 'Thông báo thử nghiệm',
          body: 'Thông báo thử nghiệm sau 3 giây đã đến!',
          sound: 'default',
          data: { type: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          repeats: false,
          channelId: 'event-reminders',
=======
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
          title: "Thông báo thử nghiệm",
          body: "Thông báo thử nghiệm sau 5 giây đã đến!",
          sound: "default",
          data: { type: "test" },
<<<<<<< HEAD
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 5 * 1000),
          ...notificationChannelOptions(),
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
        },
      });
<<<<<<< HEAD

      Alert.alert(
        'Đã hẹn giờ (5s)',
        'Thông báo sẽ xuất hiện trên điện thoại sau 5 giây. Bạn có thể khóa màn hình để thử nghiệm!'
      );
      setStatusMessage('Đang chờ 5s để phát thông báo về thiết bị...');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hẹn giờ thông báo: ' + (error as Error).message);
    }
  };

  /** Lập lịch nhắc nhở trước khi diễn ra sự kiện */
  const handleScheduleForSpecificEventDate = async () => {
    const value = Number(minutes);
    if (!validReminderMinutes(value)) { Alert.alert('Thời gian không hợp lệ', 'Nhập số phút nguyên từ 1 đến 10080 (7 ngày).'); return; }
    if (!userId) return;
    setBusy(true);
    try {
<<<<<<< HEAD
      const targetTime = new Date(Date.now() + 10 * 1000);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
<<<<<<< HEAD
          title: '🗓️ Nhắc nhở sự kiện: Workshop React Native',
          body: 'Sự kiện sẽ bắt đầu sau 30 phút tại Hội trường A. Bạn nhớ tham gia đúng giờ nhé!',
=======
          title: "Nhắc nhở sự kiện: Workshop React Native",
          body: "Sự kiện sẽ bắt đầu sau 30 phút tại Hội trường A. Bạn nhớ tham gia đúng giờ nhé!",
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
          sound: true,
          data: { eventId: '1', screen: 'schedule' },
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 5 * 1000),
          ...notificationChannelOptions(),
        },
      });

      Alert.alert(
<<<<<<< HEAD
        'Lập lịch thành công!',
        `Đã lên lịch nhắc nhở sự kiện (ID: ${notificationId}). Thông báo sẽ đổ chuông sau 10 giây!`
      );
      setStatusMessage(`Đã lập lịch thông báo cho sự kiện thành công!`);
=======
        "Đã hẹn giờ (5s)",
        "Thông báo sẽ xuất hiện trên điện thoại sau 5 giây. Bạn có thể khóa màn hình để thử nghiệm!",
      );
      setStatusMessage("Đang chờ 5s để phát thông báo về thiết bị...");
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể hẹn giờ thông báo: " + (error as Error).message,
      );
    }
=======
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
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
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
<<<<<<< HEAD
<<<<<<< HEAD
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Đã hủy', 'Đã xóa tất cả các lịch nhắc nhở đã cài đặt.');
      setStatusMessage('Đã xóa tất cả lịch thông báo đã đặt.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hủy thông báo: ' + (error as Error).message);
    }
=======
      const settings = await loadReminderSettings();
      await saveReminderSettings({ ...settings, enabled: false });
      await cancelAllReminders();
      Alert.alert("Đã hủy", "Đã xóa tất cả các lịch nhắc nhở đã cài đặt.");
      setStatusMessage("Đã xóa tất cả lịch thông báo đã đặt.");
    } catch (error) {
=======
      const settings = await loadReminderSettings();
      await saveReminderSettings({ ...settings, enabled: false });
      await cancelAllReminders();
      Alert.alert("Đã hủy", "Đã xóa tất cả các lịch nhắc nhở đã cài đặt.");
      setStatusMessage("Đã xóa tất cả lịch thông báo đã đặt.");
    } catch (error) {
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
      Alert.alert(
        "Lỗi",
        "Không thể hủy thông báo: " + (error as Error).message,
      );
    } finally { setBusy(false); }
<<<<<<< HEAD
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />

<<<<<<< HEAD
<<<<<<< HEAD
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Nút Back + Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
            <Text style={[styles.backLabel, { color: theme.primary }]}>Quay lại</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' },
            ]}
          >
            <BellIcon color={theme.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Nhắc nhở sự kiện</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Kiểm tra và phát thông báo trực tiếp đến điện thoại
          </Text>
=======
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
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
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
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
          <Text style={[styles.statusText, { color: theme.textPrimary }]}>{statusMessage}</Text>
        </View>

<<<<<<< HEAD
        {/* Thẻ xem trước Giao diện Thông báo */}
        <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>MẪU THÔNG BÁO</Text>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={onNotificationPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Thông báo sự kiện"
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.appNameRow}>
              <EventMateAppIcon accentColor={theme.primary} />
              <Text style={[styles.appNameText, { color: theme.textPrimary }]}>
                {notification.appName || 'StudentEventApp'}
              </Text>
            </View>
            <Text style={[styles.timestampText, { color: theme.textTertiary }]}>
              {notification.timestamp || 'bây giờ'}
            </Text>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
              {notification.body}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Nút bấm Test thông báo về điện thoại */}
=======
        <View style={[styles.notificationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.notificationTitle, { color: theme.textPrimary }]}>Thời gian nhắc mặc định (phút)</Text>
          <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad"
            editable={settingsLoaded && !busy} accessibilityLabel="Số phút nhắc trước sự kiện"
            style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 12, marginVertical: 12, color: theme.textPrimary }} />
        </View>

>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
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

>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
            <Text style={styles.primaryButtonText}>🔔 Gửi thông báo ngay tới điện thoại</Text>
=======
            <View style={styles.buttonContent}><Ionicons name="notifications-outline" size={19} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Gửi thông báo ngay tới điện thoại</Text></View>
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
=======
            <View style={styles.buttonContent}><Ionicons name="notifications-outline" size={19} color={theme.primary} /><Text style={[styles.dateScheduleButtonText, { color: theme.primary }]}>Gửi thông báo ngay tới điện thoại</Text></View>
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
            <View style={styles.buttonContent}><Ionicons name="notifications-outline" size={19} color={theme.primary} /><Text style={[styles.dateScheduleButtonText, { color: theme.primary }]}>Gửi thông báo ngay tới điện thoại</Text></View>
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
<<<<<<< HEAD
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
              ⏱️ Hẹn gửi sau 5s (Thử khóa màn hình)
            </Text>
=======
            <View style={styles.buttonContent}><Ionicons name="timer-outline" size={19} color={theme.textPrimary} /><Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Hẹn gửi sau 5s (Thử khóa màn hình)</Text></View>
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
          </TouchableOpacity>
<<<<<<< HEAD

          <TouchableOpacity
            style={[
              styles.dateScheduleButton,
              {
                backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
                borderColor: isDark ? theme.primary : '#BFDBFE',
              },
            ]}
            onPress={handleScheduleForSpecificEventDate}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Lập lịch nhắc nhở theo ngày giờ sự kiện"
          >
<<<<<<< HEAD
            <Text style={[styles.dateScheduleButtonText, { color: theme.primary }]}>
              🗓️ Lập lịch thông báo sự kiện (10s)
            </Text>
=======
            <View style={styles.buttonContent}><Ionicons name="calendar-outline" size={19} color={theme.primary} /><Text style={[styles.dateScheduleButtonText, { color: theme.primary }]}>Lập lịch thông báo sự kiện (10s)</Text></View>
>>>>>>> 42418ae (feat: enhance event registration handling and UI components for better user experience)
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
                borderColor: isDark ? '#F87171' : '#FCA5A5',
              },
            ]}
            onPress={handleCancelAllScheduledLocalNotifications}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hủy tất cả lịch thông báo"
          >
            <View style={styles.buttonContent}><Ionicons name="trash-outline" size={19} color={theme.danger} /><Text style={[styles.cancelButtonText, { color: theme.danger }]}>Hủy toàn bộ lịch nhắc nhở</Text></View>
=======
            <View style={styles.buttonContent}><Ionicons name="timer-outline" size={19} color={theme.textPrimary} /><Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Hẹn gửi sau 5s (Thử khóa màn hình)</Text></View>
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
          </TouchableOpacity>
=======
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
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
<<<<<<< HEAD
    backgroundColor: '#F8FAFC',
=======
    backgroundColor: "#F8FAFC",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
<<<<<<< HEAD
<<<<<<< HEAD
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
    color: '#2563EB',
    fontWeight: '300',
    lineHeight: 28,
    marginRight: 4,
  },
  backLabel: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
=======
>>>>>>> b4ca80a (sửa giao diện, chức năng trang lịch của tôi và Notification)
=======
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    fontWeight: '700',
    color: '#0F172A',
=======
    fontWeight: "700",
    color: "#0F172A",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
<<<<<<< HEAD
    color: '#64748B',
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
=======
    color: "#64748B",
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: '#E2E8F0',
=======
    borderColor: "#E2E8F0",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    color: '#0F172A',
    fontWeight: '500',
=======
    color: "#0F172A",
    fontWeight: "500",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
=======
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    fontWeight: '700',
    color: '#0F172A',
  },
  timestampText: {
    fontSize: 12,
    color: '#94A3B8',
=======
    fontWeight: "700",
    color: "#0F172A",
  },
  timestampText: {
    fontSize: 12,
    color: "#94A3B8",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
  },
  cardBody: {
    marginTop: 2,
  },
  notificationTitle: {
    fontSize: 15,
<<<<<<< HEAD
    fontWeight: '700',
    color: '#0F172A',
=======
    fontWeight: "700",
    color: "#0F172A",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    backgroundColor: '#2563EB',
=======
    backgroundColor: "#2563EB",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      ios: {
<<<<<<< HEAD
        shadowColor: '#2563EB',
=======
        shadowColor: "#2563EB",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    backgroundColor: '#FFFFFF',
=======
    backgroundColor: "#FFFFFF",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#0F172A',
=======
    borderColor: "#E2E8F0",
  },
  secondaryButtonText: {
    color: "#0F172A",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
<<<<<<< HEAD
    color: '#2563EB',
=======
    color: "#2563EB",
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
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
=======
      setMessage('Đã đặt thông báo thử nghiệm sau 3 giây.');
    } catch {
      setMessage('Không thể đặt thông báo thử nghiệm. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text>Thông báo được tự động đặt trước giờ bắt đầu 30 phút khi đăng ký thành công.</Text>
      {Platform.OS === 'web' ? <Text>Vui lòng dùng ứng dụng Android hoặc iOS để nhận nhắc nhở.</Text> : <>
        <Button loading={busy} onPress={enable}>Bật quyền thông báo</Button>
        <Button variant="secondary" onPress={() => { void Linking.openSettings().catch(() => setMessage('Không thể mở cài đặt thiết bị.')); }}>Mở cài đặt thiết bị</Button>
      </>}
      <Button variant="secondary" loading={busy} disabled={Platform.OS === 'web'} onPress={testNotification}>
        Test thông báo sau 3 giây
      </Button>
      {!!message && <Text accessibilityLiveRegion="polite">{message}</Text>}
      <Input label="Tìm nhắc nhở" placeholder="Tên sự kiện" value={search} onChangeText={setSearch} />
      <Button variant="secondary" onPress={refresh}>Làm mới</Button>
      {items.length === 0 && <Card><Text>Chưa có nhắc nhở nào được lên lịch.</Text></Card>}
      {items.filter(item => item.content.title?.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(item => <Card key={item.identifier} gap={12}>
        <Text fontWeight="700">{item.content.title}</Text>
        <Text>{item.content.body}</Text>
        <Text>Nhắc lúc: {new Date(Number(item.content.data?.reminderAt)).toLocaleString('vi-VN')}</Text>
        <Button variant="secondary" onPress={() => navigation.navigate('EventDetail', { eventId: String(item.content.data?.eventId) })}>Xem sự kiện</Button>
        <Button variant="danger" onPress={() => setCancelId(item.identifier)}>Hủy nhắc nhở</Button>
      </Card>)}
    </ScrollView>
    <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Hủy nhắc nhở?">
      <Text>Đăng ký tham gia sự kiện vẫn được giữ nguyên.</Text>
      <Button variant="danger" loading={busy} onPress={cancel}>Xác nhận hủy nhắc nhở</Button>
    </Modal>
  </SafeAreaView>;
}
>>>>>>> b65f9f5 (feat: update event management app)
