import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAppDispatch, useAppSelector } from './redux';
import { fetchEvents } from '../features/events/eventsSlice';
import { fetchMyRegistrations } from '../features/check-in/registrationsSlice';
import { syncEventReminders } from '../services/eventReminders';
import { subscribeReminderSettings } from '../services/reminderSettings';

export function useEventReminders() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(s => s.auth.user?._id);
  const events = useAppSelector(s => s.events.list);
  const registrations = useAppSelector(s => s.registrations.myRegistrations);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeReminderSettings(() => setRevision(v => v + 1)), []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!userId) return;
      try {
        await Promise.all([dispatch(fetchEvents()).unwrap(), dispatch(fetchMyRegistrations(userId)).unwrap()]);
        if (active) { setReady(true); setRevision(v => v + 1); }
      } catch (error) { console.warn('[Reminders] Could not refresh events', error); }
    };
    void refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => {
      active = false;
      subscription.remove();
      void syncEventReminders([], [], null).catch(error => console.warn('[Reminders]', error));
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (ready && userId) void syncEventReminders(events, registrations, userId)
      .catch(error => console.warn('[Reminders] Could not schedule', error));
  }, [ready, userId, events, registrations, revision]);
}
