import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReminderSettings { minutes: number; enabled: boolean }
const KEY = '@student-event/reminders:v1';
const listeners = new Set<() => void>();

export function validReminderMinutes(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 10080;
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) {
    try {
      const value = JSON.parse(raw);
      if (validReminderMinutes(value.minutes) && typeof value.enabled === 'boolean') return value;
    } catch { /* Use defaults for an obsolete or corrupt preference. */ }
  }
  return { minutes: 30, enabled: true };
}

export async function saveReminderSettings(value: ReminderSettings) {
  if (!validReminderMinutes(value.minutes)) throw new Error('Nhập số phút nguyên từ 1 đến 10080.');
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
  listeners.forEach(listener => listener());
}

export function subscribeReminderSettings(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
