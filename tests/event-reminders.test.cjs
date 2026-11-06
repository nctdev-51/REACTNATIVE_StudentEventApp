const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(os = 'android', granted = true) {
  const scheduled = new Map();
  const calls = [];
  const notifications = {
    AndroidImportance: { HIGH: 4 }, IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationHandler() {},
    async setNotificationChannelAsync() { calls.push('channel'); },
    async getPermissionsAsync() { calls.push('permission'); return { granted, canAskAgain: false }; },
    async cancelScheduledNotificationAsync(id) { scheduled.delete(id); },
    async scheduleNotificationAsync(item) { scheduled.set(item.identifier, item); },
    async getAllScheduledNotificationsAsync() { return [...scheduled.values()]; },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/services/eventReminders.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, { exports, Date, Promise, encodeURIComponent,
    require: name => name === 'react-native' ? { Platform: { OS: os } } : notifications,
  });
  const event = { _id: 'event1', title: 'Workshop', location: 'Hall A', time: { start: new Date(Date.now() + 7200000).toISOString() } };
  return { service: exports, scheduled, calls, event };
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
