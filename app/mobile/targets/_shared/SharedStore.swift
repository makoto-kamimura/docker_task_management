import Foundation

/// UserDefaults(suiteName:) storage shared between the watch app and the
/// watch widget extension (both run on-device on the Watch, so this is not
/// reachable from the iPhone app — that sync happens over WatchConnectivity).
enum SharedStore {
    private enum Key {
        static let token = "life_compass_token"
        static let todayStep = "life_compass_today_step"
    }

    static func saveToken(_ token: String?) {
        AppGroup.userDefaults.set(token, forKey: Key.token)
    }

    static func loadToken() -> String? {
        AppGroup.userDefaults.string(forKey: Key.token)
    }

    static func saveTodayStep(_ step: TodayStep?) {
        let defaults = AppGroup.userDefaults
        guard let step else {
            defaults.removeObject(forKey: Key.todayStep)
            return
        }
        if let data = try? JSONEncoder().encode(step) {
            defaults.set(data, forKey: Key.todayStep)
        }
    }

    static func loadTodayStep() -> TodayStep? {
        guard let data = AppGroup.userDefaults.data(forKey: Key.todayStep) else { return nil }
        return try? JSONDecoder().decode(TodayStep.self, from: data)
    }
}
