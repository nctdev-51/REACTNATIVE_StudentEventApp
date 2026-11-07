import { Platform } from 'react-native';
import * as Notifications from './localNotifications';
import type { Event } from '../types/event';
import type { Registration } from '../types/registration';
import { loadReminderSettings } from './reminderSettings';

export const CHANNEL = 'event-reminders';
let channelReady: Promise<void> | undefined;
let customChannelAvailable = false;

export function notificationChannelOptions(): { channelId?: string } {
  return Platform.OS === 'android' && customChannelAvailable ? { channelId: CHANNEL } : {};
}

function prepareAndroidChannel() {
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Nhắc nhở sự kiện', importance: Notifications.AndroidImportance.HIGH,
    }).then(() => { customChannelAvailable = true; }).catch((error: unknown) => {
      const message = String(error);
      if (!message.includes('NullPointerException') || !message.includes('getClass()')) {
        channelReady = undefined;
        throw error;
      }
      // Expo's BaseNotificationBuilder creates its HIGH-importance fallback
      // channel natively when channelId is omitted. This bypasses the failing
      // JS -> ReadableArguments bridge without pretending permission is granted.
      customChannelAvailable = false;
      console.warn('[Reminders] Android channel bridge failed; using Expo fallback channel.', error);
    });
  }
  return channelReady;
}
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
    await prepareAndroidChannel();
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
async function scheduleOne(event: Event, userId: string, minutes: number): Promise<ReminderResult> {
    if (Platform.OS === 'web') return 'unsupported';
    const timestamp = new Date(event.time.start).getTime() - minutes * 60 * 1000;
    if (!Number.isFinite(timestamp)) return 'invalid-date';
    if (timestamp <= Date.now()) return 'too-late';
    if (!await requestReminderPermission()) return 'denied';
    // Permission dialogs may remain open past the reminder time.
    if (timestamp <= Date.now()) return 'too-late';
    const identifier = reminderIdentifier(userId, event._id);
    const existing = (await Notifications.getAllScheduledNotificationsAsync()).find(item => item.identifier === identifier);
    if (existing?.content.data?.reminderAt === timestamp && existing.content.title === `Nhắc nhở: ${event.title}` && existing.content.body === `Sự kiện bắt đầu sau ${minutes} phút tại ${event.location}.`) return 'scheduled';
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Nhắc nhở: ${event.title}`,
        body: `Sự kiện bắt đầu sau ${minutes} phút tại ${event.location}.`,
        sound: 'default', data: { eventId: event._id, userId, screen: 'MySchedule', reminderAt: timestamp },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(timestamp), ...notificationChannelOptions() },
    });
    return 'scheduled';
}

export function scheduleEventReminder(event: Event, userId: string, minutes = 30): Promise<ReminderResult> {
  const task = queue.then(() => scheduleOne(event, userId, minutes));
  queue = task.catch(() => undefined);
  return task;
}

/** Reconcile owned reminders, including cancellations, check-ins and account switches. */
export function syncEventReminders(events: Event[], registrations: Registration[], userId: string | null) {
  const task = queue.then(async () => {
    if (Platform.OS === 'web') return { scheduled: 0, skipped: 0, denied: false };
    const settings = await loadReminderSettings();
    const eventIds = new Set(registrations.filter(r => r.userId === userId && r.status === 'registered')
      .map(r => typeof r.eventId === 'object' && r.eventId !== null ? (r.eventId as Event)._id : r.eventId));
    const eligible = settings.enabled && userId ? events.filter(e => eventIds.has(e._id) && !e.isHidden &&
      e.status !== 'completed' && e.status !== 'past' && Date.parse(e.time.start) - settings.minutes * 60000 > Date.now()) : [];
    const wanted = new Set(eligible.map(e => reminderIdentifier(userId!, e._id)));
    for (const item of await Notifications.getAllScheduledNotificationsAsync()) {
      if (item.identifier.startsWith('event-reminder:') && !wanted.has(item.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
    let scheduled = 0;
    let denied = false;
    for (const event of eligible) {
      const result = await scheduleOne(event, userId!, settings.minutes);
      if (result === 'scheduled') scheduled++;
      if (result === 'denied') { denied = true; break; }
    }
    return { scheduled, skipped: eventIds.size - scheduled, denied };
  });
  queue = task.catch(() => undefined);
  return task;
}

export function cancelAllReminders() {
  const task = queue.then(() => Notifications.cancelAllScheduledNotificationsAsync());
  queue = task.catch(() => undefined);
  return task;
}

export const reminderMessages: Record<ReminderResult, string> = {
  scheduled: 'Đã đặt nhắc nhở trước khi sự kiện bắt đầu.',
  denied: 'Chưa có quyền thông báo. Hãy bật quyền trong cài đặt thiết bị rồi thử lại.',
  'too-late': 'Đã qua mốc nhắc đã chọn; không tạo thông báo muộn.',
  'invalid-date': 'Giờ bắt đầu sự kiện không hợp lệ.',
  unsupported: 'Nhắc nhở cục bộ chỉ hỗ trợ trên Android và iOS.',
};

export async function getEventReminders(userId: string) {
  if (Platform.OS === 'web') return [];
  return (await Notifications.getAllScheduledNotificationsAsync())
    .filter(item => item.identifier.startsWith('event-reminder:') && item.content.data?.userId === userId);
}

export async function cancelEventReminder(eventId: string, userId: string) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(userId, eventId));
}
