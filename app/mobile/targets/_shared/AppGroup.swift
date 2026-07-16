import Foundation

enum AppGroup {
    static let identifier = "group.com.lifecompass.mobile"

    static var userDefaults: UserDefaults {
        UserDefaults(suiteName: identifier) ?? .standard
    }
}
