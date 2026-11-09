const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadTsModule(filePath, customRequire) {
  const code = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const mod = { exports: {} };
  vm.runInNewContext(code, {
    exports: mod.exports,
    module: mod,
    require: customRequire || require,
    console,
    Date,
    Math,
    Map,
    Set,
    Number,
    Infinity,
    Array,
    Object,
    String,
  });
  return mod.exports;
}

function buildChartComponent(themeMode = 'light') {
  const rnPrimitive = (tag) => ({ children, ...props }) =>
    React.createElement(tag, { 'data-style': JSON.stringify(props.style || null) }, children);

  const registrationsUtil = loadTsModule('src/utils/registrations.ts');
  const locationUtil = loadTsModule('src/utils/locationUtils.ts');

  const lightPalette = {
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    border: '#E2E8F0',
    primary: '#2563EB',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
  };
  const darkPalette = {
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    border: '#334155',
    primary: '#3B82F6',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
  };

  const modules = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'react-native': {
      View: rnPrimitive('div'),
      Text: rnPrimitive('span'),
      ScrollView: rnPrimitive('div'),
      TouchableOpacity: rnPrimitive('button'),
      StyleSheet: {
        hairlineWidth: 1,
        create: (styles) => styles,
      },
    },
    '@expo/vector-icons': {
      Ionicons: ({ name }) => React.createElement('i', { 'data-icon': name }),
    },
    '../../utils/registrations': registrationsUtil,
    '../../utils/locationUtils': locationUtil,
    '../../theme/ThemeContext': {
      useAppTheme: () => ({
        isDark: themeMode === 'dark',
        theme: themeMode === 'dark' ? darkPalette : lightPalette,
      }),
    },
  };

  const chartModule = loadTsModule('src/components/admin/AdminDashboardCharts.tsx', (name) => {
    if (name in modules) return modules[name];
    throw new Error(`Unexpected import inside AdminDashboardCharts test: ${name}`);
  });
  return chartModule.default;
}

test('AdminDashboardCharts renders accurate KPI rings, column bars, category distribution, and DRL stats', () => {
  const AdminDashboardCharts = buildChartComponent('light');

  const events = [
    {
      _id: 'evt-1',
      title: 'Hội thảo AI Toàn Trường 2026',
      category: 'Học thuật',
      maxSlots: 100,
      waitlistSlots: 20,
      status: 'upcoming',
      coordinates: { latitude: 10.8221, longitude: 106.6876, radiusMeters: 300 },
      time: {
        start: new Date(Date.now() + 86400000).toISOString(),
        end: new Date(Date.now() + 90000000).toISOString(),
      },
    },
    {
      _id: 'evt-2',
      title: 'Ngày hội Việc làm IUH',
      category: 'Phong trào',
      maxSlots: 50,
      status: 'ongoing',
    },
  ];

  const registrations = [
    // Valid GPS check-in for evt-1 (~11m from 10.8221, 106.6876)
    {
      _id: 'reg-1',
      eventId: 'evt-1',
      userId: 'u-1',
      status: 'checked_in',
      checkInMethod: 'qr',
      checkInLocation: { latitude: 10.8222, longitude: 106.6876 },
    },
    // Out-of-radius GPS violation check-in for evt-1 (~5km away)
    {
      _id: 'reg-2',
      eventId: 'evt-1',
      userId: 'u-2',
      status: 'completed',
      checkInMethod: 'qr',
      checkInLocation: { latitude: 10.87, longitude: 106.6876 },
    },
    // Registered only on evt-1
    { _id: 'reg-3', eventId: 'evt-1', userId: 'u-3', status: 'registered' },
    // Waitlist on evt-1
    { _id: 'reg-4', eventId: 'evt-1', userId: 'u-4', status: 'waitlist' },
    // Cancelled on evt-2 (excluded from official & category reg count)
    { _id: 'reg-5', eventId: 'evt-2', userId: 'u-1', status: 'cancelled' },
  ];

  const users = [
    { _id: 'u-1', role: 'student', point: 95 },
    { _id: 'u-2', role: 'student', point: 85 },
    { _id: 'u-3', role: 'student', point: 70 },
    { _id: 'u-4', role: 'student', point: 50 },
    { _id: 'u-admin', role: 'admin', point: 100 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(AdminDashboardCharts, {
      events,
      registrations,
      users,
      loading: false,
      onSelectEventReport: () => {},
      onSelectEventQr: () => {},
    })
  );

  assert.ok(!html.includes('NaN'), 'Charts must never render NaN values');
  // 2 checked_in out of 3 official = 67%
  assert.ok(html.includes('67%'), 'Check-in rate ring gauge should show 67%');
  assert.ok(html.includes('2 / 3 lượt'), 'Should display checked-in / official fraction');
  // 1 valid out of 2 GPS check-ins = 50%, 1 violation
  assert.ok(html.includes('50%'), 'GPS compliance ring gauge should show 50%');
  assert.ok(html.includes('1/2 (1 vi phạm)'), 'Should display GPS violation count');
  // Categories & DRL average: (95+85+70+50)/4 = 75.0
  assert.ok(html.includes('Học thuật'));
  assert.ok(html.includes('Phong trào'));
  assert.ok(html.includes('TB: 75.0đ'), 'Mean student training point should be 75.0đ');
  assert.ok(html.includes('4 tài khoản sinh viên toàn trường'));
  assert.ok(html.includes('1 SV (25%)'));
});

test('AdminDashboardCharts handles empty arrays and dark mode cleanly without NaN', () => {
  const AdminDashboardCharts = buildChartComponent('dark');
  const html = renderToStaticMarkup(
    React.createElement(AdminDashboardCharts, {
      events: [],
      registrations: [],
      users: [],
      loading: false,
    })
  );

  assert.ok(!html.includes('NaN'));
  assert.ok(html.includes('0%'));
  assert.ok(html.includes('TB: 0.0đ'));
  assert.ok(html.includes('Chưa có dữ liệu sự kiện phù hợp để vẽ biểu đồ.'));
});

test('Admin screens preserve responsive layout safeguards to prevent text clipping & crushed buttons', () => {
  const adminEventsSource = fs.readFileSync('src/screens/admin/AdminEventsScreen.tsx', 'utf8');
  const adminUsersSource = fs.readFileSync('src/screens/admin/AdminUsersScreen.tsx', 'utf8');
  const adminReportsSource = fs.readFileSync('src/screens/admin/AdminCheckInReportsScreen.tsx', 'utf8');

  // AdminEventsScreen: coordsRow & quotaRow wrap cleanly; buttons split across 2 rows via actionsStack
  assert.match(adminEventsSource, /coordsRow:\s*\{[\s\S]*?flexWrap:\s*'wrap'/);
  assert.match(adminEventsSource, /quotaRow:\s*\{[\s\S]*?flexWrap:\s*'wrap'/);
  assert.match(adminEventsSource, /actionsStack:\s*\{/);

  // AdminUsersScreen: kpiCard uses flexBasis/flexGrow instead of rigid 48.5%, actionsRow wraps
  assert.ok(!adminUsersSource.includes("width: '48.5%'"));
  assert.match(adminUsersSource, /kpiCard:\s*\{[\s\S]*?flexBasis:\s*'46%'/);
  assert.match(adminUsersSource, /actionsRow:\s*\{[\s\S]*?flexWrap:\s*'wrap'/);

  // AdminCheckInReportsScreen: quotaHeaderRow wraps cleanly and syncs route.params.eventId
  assert.match(adminReportsSource, /quotaHeaderRow:\s*\{[\s\S]*?flexWrap:\s*'wrap'/);
  assert.ok(adminReportsSource.includes('route.params?.eventId'));
});

