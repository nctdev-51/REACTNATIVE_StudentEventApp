const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('local notification imports never load remote push registration on Android', () => {
  const visited = new Set();
  function visit(filename) {
    if (visited.has(filename)) return;
    visited.add(filename);
    assert.doesNotMatch(filename, /(?:DevicePushTokenAutoRegistration|PushTokenManager|warnOfExpoGoPushUsage|getExpoPushTokenAsync|getDevicePushTokenAsync|TokenEmitter)/);
    const source = fs.readFileSync(filename, 'utf8');
    for (const { fileName: name } of ts.preProcessFile(source, true, true).importedFiles) {
      if (name === 'expo-notifications') assert.fail('Package barrel loads remote push code');
      if (name.startsWith('expo-notifications/')) {
        visit(require.resolve(name));
      } else if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), name);
        const resolved = ['.android.js', '.native.js', '.js'].map(ext => base + ext).find(file => fs.existsSync(file));
        if (resolved) visit(resolved);
      }
    }
  }
  visit(path.resolve('src/services/localNotifications.ts'));
  assert.ok(visited.size > 10, 'Check transitive dependencies as well as entry points');
});
