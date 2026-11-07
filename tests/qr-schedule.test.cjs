const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(source) {
  return ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: false,
  } }).outputText;
}
const utility = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync('src/utils/registrations.ts', 'utf8')), utility);
const { mergeRegistrations, hasEventEnded, upcomingRegisteredEvents } = utility.exports;
const event = { _id: 'event1', id: '1', title: 'QR test', images: [], time: {
  start: new Date(Date.now() + 86400000).toISOString(), end: new Date(Date.now() + 90000000).toISOString(),
} };
const registered = { _id: 'reg1', eventId: 'event1', userId: 'student1', participantRole: 'attendee', status: 'registered', checkInTime: null };

function schedule(registrations, scheduleEvent = event, scheduleNow = Date.now()) {
  const source = fs.readFileSync('src/screens/schedule/MyScheduleScreen.tsx', 'utf8');
  const start = source.indexOf('    if (!myRegistrations || myRegistrations.length === 0) return [];');
  const end = source.indexOf('  }, [myRegistrations, eventsList, scheduleNow]);', start);
  assert.ok(start >= 0 && end > start);
  const context = { mergeRegistrations, hasEventEnded, Date, scheduleNow, myRegistrations: registrations, eventsList: [scheduleEvent] };
  return vm.runInNewContext(compile('(function () {\n' + source.slice(start, end) + '\n})()'), context);
}

test('reminder page matches schedule upcoming for future, ongoing, ended, checked-in and cancelled events', () => {
  const now = Date.now();
  for (const startOffset of [-3600000, 3600000]) {
    for (const endOffset of [-60000, 0, 7200000]) {
      for (const status of ['registered', 'checked_in', 'cancelled']) {
        const item = { ...event, time: { start: new Date(now + startOffset).toISOString(), end: new Date(now + endOffset).toISOString() } };
        const registrations = [{ ...registered, status }];
        const scheduleIds = schedule(registrations, item, now).filter(e => e.status === 'upcoming').map(e => e.id);
        const reminderIds = upcomingRegisteredEvents(registrations, [item], 'student1', now).map(e => e._id);
        assert.equal(JSON.stringify(reminderIds), JSON.stringify(scheduleIds));
      }
    }
  }
  assert.equal(upcomingRegisteredEvents([registered], [event], 'student2', now).length, 0);
});

test('ended registrations remain in past with accurate check-in labels and closed attendance', () => {
  const now = Date.now();
  for (const offset of [-60000, 0]) {
    const ended = { ...event, time: { ...event.time, end: new Date(now + offset).toISOString() } };
    for (const status of ['registered', 'checked_in']) {
      const registration = { ...registered, status };
      const cards = schedule([registration], ended, now);
      assert.equal(cards.length, 1);
      assert.equal(cards[0].status, 'past');
      assert.equal(cards[0].checkedIn, status === 'checked_in');
      assert.equal(cards[0].checkInClosed, true);
      assert.equal(registration.status, status);
    }
  }
  const ongoing = { ...event, time: { ...event.time, end: new Date(now + 60000).toISOString() } };
  assert.equal(schedule([registered], ongoing, now)[0].status, 'upcoming');
  assert.equal(schedule([registered], ongoing, now)[0].checkedIn, false);
  assert.equal(schedule([registered], ongoing, now)[0].checkInClosed, false);
  assert.equal(schedule([{ ...registered, status: 'checked_in' }], ongoing, now)[0].status, 'past');
  assert.equal(schedule([{ ...registered, status: 'checked_in' }], ongoing, now)[0].checkedIn, true);
});

test('duplicate registrations and id aliases always produce one attended card regardless of order', () => {
  const checked = { ...registered, _id: 'reg2', eventId: '1', status: 'checked_in' };
  for (const registrations of [[registered, checked], [checked, registered]]) {
    const cards = schedule(registrations);
    assert.equal(cards.length, 1);
    assert.equal(cards[0].status, 'past');
    assert.equal(cards.filter(e => e.status === 'upcoming').length, 0);
  }
});

test('merging preserves populated event data and isolates accounts', () => {
  const populated = { ...registered, eventId: event, status: 'checked_in' };
  const list = mergeRegistrations([populated, registered, { ...registered, userId: 'student2' }], [event]);
  assert.equal(list.length, 2);
  assert.equal(list[0].eventId.title, 'QR test');
  assert.equal(list[0].status, 'checked_in');
  assert.equal(list[1].status, 'registered');
});

function setupApi() {
  let offline = false, success = true;
  const client = {
    interceptors: { request: { use() {} }, response: { use() {} } },
    async post() {
      if (offline) { const error = new Error('offline'); error.code = 'ERR_NETWORK'; throw error; }
      return { data: { success, data: { registration: { ...registered, status: 'checked_in' } } } };
    },
    async get() { return { data: [registered] }; },
  };
  const context = { exports: {}, Date, process: { env: {} }, console: { warn() {} }, require(name) {
    if (name === 'axios') return { default: { create: () => client } };
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (name === 'expo-constants') return { default: { expoConfig: {} } };
    if (name === '../data/eventsData') return { eventsData: [event] };
    if (name === '../utils/registrations') return utility.exports;
    throw new Error('Unexpected import: ' + name);
  } };
  vm.runInNewContext(compile(fs.readFileSync('src/services/api.ts', 'utf8')), context);
  return { api: context.exports, offline: () => { offline = true; }, fail: () => { success = false; } };
}

test('successful QR remains attended after repeated stale API reloads', async () => {
  const { api } = setupApi();
  assert.equal((await api.qrCheckIn({ eventId: 'event1', userId: 'student1' })).success, true);
  for (let i = 0; i < 3; i++) {
    const list = await api.getRegistrationsByUser('student1');
    assert.equal(list.length, 1);
    assert.equal(list[0].status, 'checked_in');
    assert.equal(schedule(list)[0].status, 'past');
  }
});

test('offline QR mock cannot be overwritten by an old server registration', async () => {
  const { api, offline } = setupApi();
  offline();
  assert.equal((await api.qrCheckIn({ eventId: 'event1', userId: 'student1' })).success, true);
  const list = await api.getRegistrationsByUser('student1');
  assert.equal(list.length, 1);
  assert.equal(schedule(list)[0].status, 'past');
});

test('failed QR leaves registration upcoming', async () => {
  const { api, fail } = setupApi();
  fail();
  assert.equal((await api.qrCheckIn({ eventId: 'event1', userId: 'student1' })).success, false);
  assert.equal(schedule(await api.getRegistrationsByUser('student1'))[0].status, 'upcoming');
});
