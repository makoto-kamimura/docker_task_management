import Foundation
import UserNotifications

/// 通知の [開始] / [あとで]。iPhone（src/notifications/notification-service.ts）と同じカテゴリ・識別子を
/// 登録しておくと、Watch に届いた通知の操作がこのアプリに渡る。[開始] で今日の一歩のタイマーを直接開く（design.md §9）。
final class NotificationController: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationController()

    /// API（App\Services\Push\ApnsSender）が付けるカテゴリ。
    private static let category = "TODAY_COMPASS"
    private static let startAction = "START"
    private static let laterAction = "LATER"

    func activate() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.setNotificationCategories([
            UNNotificationCategory(
                identifier: Self.category,
                actions: [
                    UNNotificationAction(identifier: Self.startAction, title: "開始", options: [.foreground]),
                    UNNotificationAction(identifier: Self.laterAction, title: "あとで", options: []),
                ],
                intentIdentifiers: [],
                options: []
            ),
        ])
    }

    /// [開始] または通知本体のタップでタイマーへ。[あとで] は何もしない（iPhone と同じ）。
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        if response.actionIdentifier != Self.laterAction {
            PhoneConnector.shared.requestAutostart()
        }
        completionHandler()
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .list, .sound])
    }
}
