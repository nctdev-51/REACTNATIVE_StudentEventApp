const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function setup(granted = true, fallbackChannel = false, events = []) {
  const sent = [], saved = [], alerts = [];
  let synced = 0, cancelled = 0, index = 0;
  const states = [false, '', '5', false, true, Date.now()];
  const react = { ...React, useEffect() {}, useCallback: fn => fn, useState: () => [states[index++], () => {}] };
  const service = {
    CHANNEL: 'event-reminders', requestReminderPermission: async () => granted,
    notificationChannelOptions: () => fallbackChannel ? {} : { channelId: 'event-reminders' },
    syncEventReminders: async () => { synced++; return { scheduled: 2, skipped: 0, denied: false }; },
    cancelAllReminders: async () => { cancelled++; },
  };
  const settings = {
    loadReminderSettings: async () => ({ minutes: 5, enabled: true }),
    saveReminderSettings: async value => saved.push(value),
    validReminderMinutes: value => Number.isInteger(value) && value >= 1 && value <= 10080,
  };
  const modules = {
    react,
    'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'Button', TextInput: 'Input',
      FlatList: 'List', StatusBar: 'StatusBar', StyleSheet: { create: x => x },
      Platform: { OS: 'android', select: x => x.android }, Alert: { alert: (...args) => alerts.push(args) } },
    'react-native-safe-area-context': { SafeAreaView: 'Safe' },
    '../../services/localNotifications': { scheduleNotificationAsync: async request => { sent.push(request); return 'test'; }, SchedulableTriggerInputTypes: { DATE: 'date' } },
    '../../services/eventReminders': service,
    '../../services/reminderSettings': settings,
    '../../hooks/redux': { useAppSelector: fn => fn({ auth: { user: { _id: 'student1' } }, events: { list: events }, registrations: { myRegistrations: [] } }), useAppDispatch: () => () => ({ unwrap: async () => [] }) },
    '../../features/events/eventsSlice': { fetchEvents: () => ({}) },
    '../../features/check-in/registrationsSlice': { fetchMyRegistrations: () => ({}) },
    '@react-navigation/native': { useNavigation: () => ({ navigate() {} }), useFocusEffect() {} },
    '../../theme/ThemeContext': { useAppTheme: () => ({ theme: {}, isDark: false }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
  };
  const context = { exports: {}, Date, console, require(name) {
    assert.ok(name in modules, 'Unexpected dependency: ' + name);
    return modules[name];
  } };
  const code = ts.transpileModule(fs.readFileSync('src/screens/notifications/NotificationReminderScreen.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, context);
  const buttons = [];
  let list;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'List') {
      list = node.props;
      visit(node.props.ListHeaderComponent);
      for (const item of node.props.data) visit(node.props.renderItem({ item }));
      return;
    }
    if (node.type === 'Button' && node.props.onPress) buttons.push(node.props);
    React.Children.forEach(node.props?.children, visit);
  }
  visit(context.exports.default({}));
  // Expose handlers in semantic order: immediate, delayed, schedule, cancel.
  const actions = [buttons[2], buttons[3], buttons[0], buttons[1]];
  return { actions, buttons, list, sent, saved, alerts, counts: () => ({ synced, cancelled }) };
}

test('notification page lists future visible events nearest first, after action buttons', () => {
  const event = (id, offset, extra = {}) => ({ _id: id, title: id, location: 'IUH', status: 'upcoming', time: { start: new Date(Date.now() + offset).toISOString() }, ...extra });
  const events = [event('later', 7200000), event('past', -60000), event('nearest', 3600000),
    event('hidden', 1800000, { isHidden: true }), event('completed', 1800000, { status: 'completed' })];
  const { list, buttons } = setup(true, false, events);
  assert.equal(JSON.stringify(list.data.map(e => e._id)), JSON.stringify(['nearest', 'later']));
  assert.equal(buttons.length, 6);
  assert.equal(buttons[4].accessibilityLabel, 'Chi tiết sự kiện nearest');
  assert.equal(buttons[5].accessibilityLabel, 'Chi tiết sự kiện later');
});

test('all four notification buttons use permission, correct timing and persisted settings', async () => {
  const { actions, sent, saved, counts } = setup();
  assert.equal(actions.length, 4);
  await actions[0].onPress();
  assert.equal(sent[0].trigger.channelId, 'event-reminders');
  assert.equal(sent[0].content.sound, 'default');
  const now = Date.now();
  await actions[1].onPress();
  assert.equal(sent[1].trigger.type, 'date');
  assert.ok(sent[1].trigger.date.getTime() >= now + 5000);
  assert.ok(sent[1].trigger.date.getTime() <= Date.now() + 5000);
  await actions[2].onPress();
  assert.equal(saved[0].minutes, 5);
  assert.equal(saved[0].enabled, true);
  await actions[3].onPress();
  assert.equal(saved[1].enabled, false);
  assert.deepEqual(counts(), { synced: 1, cancelled: 1 });
});

test('denied permission blocks immediate, delayed and event notifications', async () => {
  const { actions, sent, saved, alerts } = setup(false);
  for (const action of actions.slice(0, 3)) await action.onPress();
  assert.equal(sent.length, 0);
  assert.equal(saved.length, 0);
  assert.equal(alerts.length, 3);
});

test('immediate and five-second buttons omit custom channel after native channel failure', async () => {
  const { actions, sent } = setup(true, true);
  await actions[0].onPress();
  await actions[1].onPress();
  assert.equal(sent[0].trigger, null);
  assert.equal(sent[1].trigger.type, 'date');
  assert.equal(Object.hasOwn(sent[1].trigger, 'channelId'), false);
});

test('reminder preference persists, validates input and notifies subscribers', async () => {
  let raw = null, calls = 0;
  const context = { exports: {}, require: () => ({ default: {
    getItem: async () => raw, setItem: async (_, value) => { raw = value; },
  } }) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/reminderSettings.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: false },
  }).outputText, context);
  const service = context.exports;
  assert.equal((await service.loadReminderSettings()).minutes, 30);
  const unsubscribe = service.subscribeReminderSettings(() => calls++);
  await service.saveReminderSettings({ minutes: 7, enabled: true });
  assert.equal((await service.loadReminderSettings()).minutes, 7);
  assert.equal(calls, 1);
  unsubscribe();
  for (const minutes of [0, -1, 1.5, NaN, 10081]) {
    await assert.rejects(service.saveReminderSettings({ minutes, enabled: true }));
  }
  raw = '{bad json';
  assert.equal((await service.loadReminderSettings()).minutes, 30);
});
