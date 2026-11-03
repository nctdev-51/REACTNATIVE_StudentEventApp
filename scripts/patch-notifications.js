const fs = require('fs');
const path = require('path');

const dummyModuleContent = `const fallback = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default fallback;
`;

const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'TopicSubscriptionModule.android.ts'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'TopicSubscriptionModule.ts'),
];

let patchedCount = 0;
for (const file of filesToPatch) {
  try {
    if (fs.existsSync(file)) {
      fs.writeFileSync(file, dummyModuleContent, 'utf8');
      console.log(`✅ Patched: ${path.relative(__dirname, file)}`);
      patchedCount++;
    }
  } catch (err) {
    console.error(`❌ Failed to patch ${file}:`, err.message);
  }
}

console.log(`✅ Total patched files: ${patchedCount} for Expo Go compatibility!`);
