/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "watch-widget",
  name: "LifeCompassComplication",
  displayName: "今日の一歩",
  // Must be nested under the watch app's bundle id (com.lifecompass.mobile.watch)
  // since this extension is embedded inside the watch app, not the root app.
  bundleIdentifier: "com.lifecompass.mobile.watch.widget",
  colors: { $accent: "#aa3bff" },
  deploymentTarget: "10.0",
  frameworks: ["WidgetKit", "SwiftUI"],
  entitlements: {
    "com.apple.security.application-groups": ["group.com.lifecompass.mobile"],
  },
});
