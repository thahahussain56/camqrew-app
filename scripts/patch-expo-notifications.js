const fs = require('fs');
const path = require('path');

try {
  // 1. Patch warnOfExpoGoPushUsage.js
  const warnFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js');
  if (fs.existsSync(warnFile)) {
    let content = fs.readFileSync(warnFile, 'utf8');
    if (content.includes('throw new Error(message);')) {
      content = content.replace('throw new Error(message);', 'if (__DEV__) { didWarn = true; console.warn(message); }');
      fs.writeFileSync(warnFile, content, 'utf8');
      console.log('[patch] Patched warnOfExpoGoPushUsage.js');
    }
  }

  // 2. Patch TopicSubscriptionModule.android.js
  const topicFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js');
  if (fs.existsSync(topicFile)) {
    let content = fs.readFileSync(topicFile, 'utf8');
    if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
      content = content.replace("requireNativeModule('ExpoTopicSubscriptionModule')", "requireOptionalNativeModule('ExpoTopicSubscriptionModule') || {}");
      content = content.replace("import { requireNativeModule }", "import { requireOptionalNativeModule }");
      fs.writeFileSync(topicFile, content, 'utf8');
      console.log('[patch] Patched TopicSubscriptionModule.android.js');
    }
  }
} catch (e) {
  console.warn('[patch] Warning:', e.message);
}
