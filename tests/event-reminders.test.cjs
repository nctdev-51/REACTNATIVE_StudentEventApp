const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(os = 'android', granted = true, channelError = null) {
  const settings = { minutes: 30, enabled: true };
  const scheduled = new Map();
  const calls = [];
  const notifications = {
    AndroidImportance: { HIGH: 4 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationHandler() {},
    async setNotificationChannelAsync(id, options) {
      if (channelError) { calls.push('channel-error'); throw channelError; }
      // Android's channel manager reads audioAttributes when sound is present.
      // Its legacy argument bridge can throw on that absent nested object.
      if ('sound' in options && options.audioAttributes == null) {
        throw new Error('Native channel sound configuration requires non-null audioAttributes');
      }
      calls.push('channel');
    },
    async getPermissionsAsync() { calls.push('permission'); return { granted, canAskAgain: false }; },
    async cancelScheduledNotificationAsync(id) { scheduled.delete(id); },
    async cancelAllScheduledNotificationsAsync() { scheduled.clear(); },
    async scheduleNotificationAsync(item) { scheduled.set(item.identifier, item); },
    async getAllScheduledNotificationsAsync() { return [...scheduled.values()]; },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/services/eventReminders.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, Promise, encodeURIComponent, console: { warn() {} },
    require: name => name === 'react-native' ? { Platform: { OS: os } }
      : name === './reminderSettings' ? { loadReminderSettings: async () => settings } : notifications,
  });
  const event = { _id: 'event1', title: 'Workshop', location: 'Hall A', time: { start: new Date(Date.now() + 7200000).toISOString() } };
  return { service: exports, scheduled, calls, event, settings };
}

test('schedules exactly 30 minutes before start and scopes reminders to user', async () => {
  const { service, scheduled, calls, event } = setup();
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'scheduled');
  const item = [...scheduled.values()][0];
  assert.equal(item.trigger.date.getTime(), Date.parse(event.time.start) - 1800000);
  assert.equal(item.trigger.channelId, 'event-reminders');
  assert.equal(item.content.data.eventId, event._id);
  assert.deepEqual(calls, ['channel', 'permission']);
  assert.equal((await service.getEventReminders('student1')).length, 1);
  assert.equal((await service.getEventReminders('student2')).length, 0);
});

test('Android channel setup avoids absent audio attributes and notifications retain default sound', async () => {
  const { service, scheduled, event } = setup();
  assert.equal(await service.requestReminderPermission(), true);
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'scheduled');
  assert.equal([...scheduled.values()][0].content.sound, 'default');
});

test('native channel NullPointerException uses Expo fallback and still schedules reminders', async () => {
  const failure = new Error("java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.Class java.lang.Object.getClass()' on a null object reference");
  const { service, scheduled, event, calls } = setup('android', true, failure);
  assert.equal(await service.requestReminderPermission(), true);
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'scheduled');
  const item = [...scheduled.values()][0];
  assert.equal(Object.hasOwn(item.trigger, 'channelId'), false);
  assert.equal(item.content.sound, 'default');
  assert.equal(calls.filter(c => c === 'channel-error').length, 1);
  assert.ok(calls.includes('permission'));
});

test('native channel fallback respects denied permission; unrelated native errors remain visible', async () => {
  const failure = new Error('java.lang.NullPointerException: java.lang.Object.getClass()');
  const { service, scheduled, event } = setup('android', false, failure);
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'denied');
  assert.equal(scheduled.size, 0);
  const other = setup('android', true, new Error('native module unavailable'));
  await assert.rejects(other.service.requestReminderPermission(), /native module unavailable/);
});
test('concurrent requests do not create duplicates', async () => {
  const { service, scheduled, event } = setup();
  await Promise.all([service.scheduleEventReminder(event, 'student1'), service.scheduleEventReminder(event, 'student1')]);
  assert.equal(scheduled.size, 1);
});
test('denied permission never schedules', async () => {
  const { service, scheduled, event } = setup('android', false);
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'denied');
  assert.equal(scheduled.size, 0);
});
test('invalid, past and within-30-minute events never schedule', async () => {
  const { service, scheduled, event } = setup();
  for (const offset of [-3600000, 600000, 1800000]) {
    assert.equal(await service.scheduleEventReminder({ ...event, time: { start: new Date(Date.now() + offset).toISOString() } }, 'student1'), 'too-late');
  }
  assert.equal(await service.scheduleEventReminder({ ...event, time: { start: 'invalid' } }, 'student1'), 'invalid-date');
  assert.equal(scheduled.size, 0);
});
test('web avoids native notification APIs', async () => {
  const { service, scheduled, calls, event } = setup('web');
  assert.equal(await service.scheduleEventReminder(event, 'student1'), 'unsupported');
  assert.equal(await service.requestReminderPermission(), false);
  assert.equal((await service.getEventReminders('student1')).length, 0);
  assert.equal(scheduled.size, 0);
  assert.equal(calls.length, 0);
});

test('cancelling a reminder removes only the selected event for that user', async () => {
  const { service, scheduled, event } = setup();
  const laterEvent = { ...event, _id: 'event2', time: { start: new Date(Date.now() + 10800000).toISOString() } };
  await service.scheduleEventReminder(event, 'student1');
  await service.scheduleEventReminder(laterEvent, 'student1');
  await service.cancelEventReminder('event1', 'student1');
  assert.equal(scheduled.size, 1);
  assert.equal((await service.getEventReminders('student1'))[0].content.data.eventId, 'event2');
});

test('global minutes reschedule all registered events and survive repeated sync without duplicates', async () => {
  const { service, scheduled, event, settings } = setup();
  const events = [event, { ...event, _id: 'event2' }];
  const registrations = events.map(e => ({ eventId: e._id, userId: 'student1', status: 'registered' }));
  assert.equal((await service.syncEventReminders(events, registrations, 'student1')).scheduled, 2);
  settings.minutes = 5;
  await service.syncEventReminders(events, registrations, 'student1');
  await service.syncEventReminders(events, registrations, 'student1');
  assert.equal(scheduled.size, 2);
  for (const item of scheduled.values()) {
    assert.equal(item.trigger.date.getTime(), Date.parse(event.time.start) - 5 * 60000);
    assert.match(item.content.body, /5/);
  }
});

test('check-in, cancellation, account switch and disabling remove stale reminders', async () => {
  const { service, scheduled, event, settings } = setup();
  const registrations = [{ eventId: event._id, userId: 'student1', status: 'registered' }];
  for (const status of ['checked_in', 'cancelled']) {
    await service.syncEventReminders([event], registrations, 'student1');
    await service.syncEventReminders([event], [{ ...registrations[0], status }], 'student1');
    assert.equal(scheduled.size, 0);
  }
  await service.syncEventReminders([event], registrations, 'student1');
  await service.syncEventReminders([event], registrations, 'student2');
  assert.equal(scheduled.size, 0);
  await service.syncEventReminders([event], registrations, 'student1');
  settings.enabled = false;
  await service.cancelAllReminders();
  await service.syncEventReminders([event], registrations, 'student1');
  assert.equal(scheduled.size, 0);
});

test('bulk scheduling skips expired reminders and reports denied permission', async () => {
  const { service, scheduled, event } = setup('android', false);
  const registrations = [{ eventId: event._id, userId: 'student1', status: 'registered' }];
  assert.equal((await service.syncEventReminders([event], registrations, 'student1')).denied, true);
  assert.equal(scheduled.size, 0);
  const expired = { ...event, time: { start: new Date(Date.now() + 60000).toISOString() } };
  assert.equal((await service.syncEventReminders([expired], registrations, 'student1')).skipped, 1);
});
