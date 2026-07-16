import Foundation
import WatchConnectivity
import WidgetKit

/// Receives the login token + "today's step" from the iPhone app via
/// WatchConnectivity (design.md 3.2) and caches them in SharedStore so both
/// this app and the complication widget can read them.
final class PhoneConnector: NSObject, ObservableObject {
    static let shared = PhoneConnector()

    @Published private(set) var todayStep: TodayStep?
    @Published private(set) var hasToken: Bool

    private override init() {
        todayStep = SharedStore.loadTodayStep()
        hasToken = SharedStore.loadToken() != nil
        super.init()

        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func refreshFromAPI() async {
        guard hasToken, let step = try? await APIClient.fetchTodayStep() else { return }
        applyTodayStep(step)
    }

    private func applyContext(_ context: [String: Any]) {
        if let token = context["token"] as? String {
            SharedStore.saveToken(token)
            DispatchQueue.main.async { self.hasToken = true }
        } else if context.keys.contains("token") {
            SharedStore.saveToken(nil)
            DispatchQueue.main.async { self.hasToken = false }
        }

        if let stepDict = context["todayStep"] as? [String: Any],
           let taskId = stepDict["taskId"] as? Int,
           let title = stepDict["title"] as? String {
            let duration = stepDict["durationMinutes"] as? Int ?? 15
            applyTodayStep(TodayStep(taskId: taskId, title: title, durationMinutes: duration))
        } else if context.keys.contains("todayStep") {
            applyTodayStep(nil)
        }
    }

    private func applyTodayStep(_ step: TodayStep?) {
        SharedStore.saveTodayStep(step)
        DispatchQueue.main.async { self.todayStep = step }
        WidgetCenter.shared.reloadAllTimelines()
    }
}

extension PhoneConnector: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        applyContext(session.receivedApplicationContext)
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        applyContext(applicationContext)
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        applyContext(userInfo)
    }
}
