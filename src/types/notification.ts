export type NotificationCategory = 'schedule_change' | 'room_change' | 'urgent' | 'reminder' | 'marketing';

export interface Notification {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  body: string;
  category?: NotificationCategory;
  isUrgent?: boolean;
  eventId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  userId: string;
  enablePush: boolean;
  enableEmail: boolean;
  notifyScheduleChange: boolean;
  notifyUrgent: boolean;
  notifyReminders: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "06:00"
  reminderMinutesBefore: number; // 15, 30, 60, 120
}
