import type { Event } from '../types/event';
import type { Registration } from '../types/registration';

export function entityId(value: unknown): string {
  if (value && typeof value === 'object') {
    const entity = value as { _id?: string; id?: string };
    return String(entity._id ?? entity.id ?? '');
  }
  return value == null ? '' : String(value);
}

/** One registration per user/event. A confirmed check-in wins over an old registration. */
export function mergeRegistrations(registrations: Registration[], events: Event[] = []): Registration[] {
  const aliases = new Map<string, string>();
  for (const event of events) {
    const id = entityId(event);
    if (event._id) aliases.set(String(event._id), id);
    if (event.id) aliases.set(String(event.id), id);
  }
  const merged = new Map<string, Registration>();
  for (const registration of registrations) {
    const rawId = entityId(registration.eventId);
    const eventId = aliases.get(rawId) ?? rawId;
    const key = JSON.stringify([entityId(registration.userId), eventId]);
    const existing = merged.get(key);
    if (!existing || existing.status !== 'checked_in' || registration.status === 'checked_in') {
      merged.set(key, registration);
    }
  }
  return [...merged.values()];
}
