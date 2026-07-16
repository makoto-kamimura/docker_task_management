/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "watch",
  name: "LifeCompassWatch",
  displayName: "人生のコンパス",
  icon: "../../assets/icon.png",
  colors: { $accent: "#aa3bff" },
  deploymentTarget: "10.0",
  frameworks: ["SwiftUI", "WatchConnectivity", "WidgetKit"],
  entitlements: {
    "com.apple.security.application-groups": ["group.com.lifecompass.mobile"],
  },
});
