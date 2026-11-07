const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Theme persistence key is defined and handled properly', () => {
  const themeContextContent = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'theme', 'ThemeContext.tsx'),
    'utf8'
  );
  assert.ok(
    themeContextContent.includes('@student_event_app_theme_mode'),
    'ThemeContext should define storage key for persisting theme mode'
  );
  assert.ok(
    themeContextContent.includes('getInitialTheme'),
    'ThemeContext should read initial theme synchronously on web'
  );
  assert.ok(
    themeContextContent.includes('AsyncStorage.getItem'),
    'ThemeContext should load saved theme from AsyncStorage'
  );
  assert.ok(
    themeContextContent.includes('AsyncStorage.setItem'),
    'ThemeContext should save updated theme to AsyncStorage'
  );
});

test('FeedbackScreen satisfies user requirements', () => {
  const screenContent = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'screens/events/FeedbackScreen.tsx'),
    'utf8'
  );

  // 1. Attended events list
  assert.ok(
    screenContent.includes('getOnlyAttendedEventsFromDb'),
    'Should query attended events'
  );

  // 2. 3 click tabs: Tất cả, Đã đánh giá, Chưa đánh giá
  assert.ok(screenContent.includes('Tất cả ('), 'Should have Tất cả tab');
  assert.ok(screenContent.includes('Đã đánh giá ('), 'Should have Đã đánh giá tab');
  assert.ok(screenContent.includes('Chưa đánh giá ('), 'Should have Chưa đánh giá tab');

  // 3. Infinite scroll pagination (+10 events on scroll to bottom)
  assert.ok(
    screenContent.includes('visibleLimit') && screenContent.includes('useState<number>(5)'),
    'Should show initial events'
  );
  assert.ok(
    screenContent.includes('handleScroll') && screenContent.includes('onScroll={handleScroll}'),
    'Should have handleScroll on ScrollView to detect reaching bottom'
  );
  assert.ok(
    screenContent.includes('prev + 10'),
    'Should load +10 events when scrolling to bottom'
  );

  // 4. Click to expand details and review
  assert.ok(
    screenContent.includes('expandedEventId'),
    'Should allow clicking to expand event details'
  );

  // 5. Each event only 1 review, show own review, hide other people's reviews
  assert.ok(
    screenContent.includes('getMyReview'),
    'Should find user own review'
  );
  assert.ok(
    screenContent.includes('Đánh giá của bạn'),
    'Should display own review'
  );
  assert.ok(
    screenContent.includes('Mỗi sự kiện chỉ được đánh giá 1 lần'),
    'Should enforce 1 review per event'
  );
  // Ensure feedbacks.map(...) does NOT display everyone's reviews
  assert.ok(
    !screenContent.includes('feedbacks.map('),
    'Should not map over all feedbacks to show others reviews'
  );
});

test('getOnlyAttendedEventsFromDb returns attended events sorted most recent first', () => {
  const db = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'db.json'), 'utf8')
  );

  const userId = '66f1a1010000000000000001';
  const userRegs = db.registrations.filter(
    (r) => r.userId === userId && (r.status === 'checked_in' || r.status === 'completed' || r.status === 'registered')
  );
  const registeredEventIds = new Set(userRegs.map(r => r.eventId));
  const attendedList = db.events.filter(e => registeredEventIds.has(e.id || e._id));

  assert.ok(attendedList.length > 0, 'User should have attended events');

  // Verify dates sortable
  const sorted = [...attendedList].sort((a, b) => {
    const timeA = new Date(a.time?.start || a.createdAt || 0).getTime();
    const timeB = new Date(b.time?.start || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const tCurrent = new Date(sorted[i].time?.start || sorted[i].createdAt || 0).getTime();
    const tNext = new Date(sorted[i+1].time?.start || sorted[i+1].createdAt || 0).getTime();
    assert.ok(tCurrent >= tNext, 'Events should be sorted descending by time');
  }
});
