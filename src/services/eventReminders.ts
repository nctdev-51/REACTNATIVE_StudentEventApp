import { Platform } from 'react-native';
import * as Notifications from './localNotifications';
import type { Event } from '../types/event';

const CHANNEL = 'event-reminders';
export const REMINDER_OFFSET = 30 * 60 * 1000;
export type ReminderResult = 'scheduled' | 'denied' | 'too-late' | 'invalid-date' | 'unsupported';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Nhắc nhở sự kiện', importance: Notifications.AndroidImportance.HIGH, sound: 'default',
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export function reminderIdentifier(userId: string, eventId: string) {
  return `event-reminder:${encodeURIComponent(userId)}:${encodeURIComponent(eventId)}`;
}

// Serialize requests so a remount or rapid retry cannot create duplicate reminders.
let queue: Promise<unknown> = Promise.resolve();
export function scheduleEventReminder(event: Event, userId: string): Promise<ReminderResult> {
  const task = queue.then(async (): Promise<ReminderResult> => {
    if (Platform.OS === 'web') return 'unsupported';
    const timestamp = new Date(event.time.start).getTime() - REMINDER_OFFSET;
    if (!Number.isFinite(timestamp)) return 'invalid-date';
    if (timestamp <= Date.now()) return 'too-late';
    if (!await requestReminderPermission()) return 'denied';
    // Permission dialogs may remain open past the reminder time.
    if (timestamp <= Date.now()) return 'too-late';
    const identifier = reminderIdentifier(userId, event._id);
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Nhắc nhở: ${event.title}`,
        body: `Sự kiện bắt đầu sau 30 phút tại ${event.location}.`,
        sound: 'default', data: { eventId: event._id, userId, screen: 'MySchedule', reminderAt: timestamp },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(timestamp), channelId: CHANNEL },
    });
    return 'scheduled';
  });
  queue = task.catch(() => undefined);
  return task;
}

export const reminderMessages: Record<ReminderResult, string> = {
  scheduled: 'Đã đặt nhắc nhở trước khi sự kiện bắt đầu 30 phút.',
  denied: 'Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị rồi thử lại.',
  'too-late': 'Đã qua mốc nhắc trước 30 phút; không tạo thông báo muộn.',
  'invalid-date': 'Giờ bắt đầu sự kiện không hợp lệ.',
  unsupported: 'Nhắc nhở cục bộ chỉ hỗ trợ trên Android và iOS.',
};

export async function getEventReminders(userId: string) {
  if (Platform.OS === 'web') return [];
  return (await Notifications.getAllScheduledNotificationsAsync())
    .filter(item => item.identifier.startsWith('event-reminder:') && item.content.data?.userId === userId);
}
