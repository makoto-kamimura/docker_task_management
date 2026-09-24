import Foundation
import WatchConnectivity
import WidgetKit

/// Receives the login token, API base URL and "today's step" from the iPhone
/// app via WatchConnectivity (design.md 3.2) and caches them in SharedStore so
/// both this app and the complication widget can read them.
/// 受け取るキーは iPhone 側の src/watch/sync.ts と対応している。
final class PhoneConnector: NSObject, ObservableObject {
    static let shared = PhoneConnector()

    @Published private(set) var todayStep: TodayStep?
    /// 実施できる一歩が無いとき、何をすればよいか（二択 / 細分化）。Watch では案内だけ出す。
    @Published private(set) var stepKind: TodayStepKind = .empty
    @Published private(set) var hasToken: Bool
    /// 通知の [開始] で起動されたとき true。今日の一歩の画面がタイマーを開いたら false に戻す。
    @Published var pendingAutostart = false

    private override init() {
        todayStep = SharedStore.loadTodayStep()
        stepKind = todayStep == nil ? .empty : .task
        hasToken = SharedStore.loadToken() != nil
        super.init()

        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    /// API から今日の一歩を取り直す。通信できないときは手元の表示を残す。
    func refreshFromAPI() async {
        guard SharedStore.loadToken() != nil else { return }
        do {
            let result = try await APIClient.fetchTodayStep()
            applyTodayStep(result.step, kind: result.kind)
        } catch {
            // iPhone から届いた最後の値を出し続ける。
        }
    }

    func requestAutostart() {
        DispatchQueue.main.async { self.pendingAutostart = true }
    }

    private func applyContext(_ context: [String: Any]) {
        if let apiBaseUrl = context["apiBaseUrl"] as? String, !apiBaseUrl.isEmpty {
            SharedStore.saveApiBaseUrl(apiBaseUrl)
        }

        if let token = context["token"] as? String {
            SharedStore.saveToken(token)
            DispatchQueue.main.async { self.hasToken = true }
        } else if context.keys.contains("token") {
            SharedStore.saveToken(nil)
            DispatchQueue.main.async { self.hasToken = false }
        }

        let kind = (context["todayStepKind"] as? String).flatMap(TodayStepKind.init(rawValue:))

        if let stepDict = context["todayStep"] as? [String: Any],
           let taskId = stepDict["taskId"] as? Int,
           let title = stepDict["title"] as? String {
            applyTodayStep(TodayStep(
                taskId: taskId,
                title: title,
                durationMinutes: stepDict["durationMinutes"] as? Int,
                path: stepDict["path"] as? [String] ?? []
            ), kind: kind ?? .task)
        } else if context.keys.contains("todayStep") {
            applyTodayStep(nil, kind: kind ?? .empty)
        }
    }

    private func applyTodayStep(_ step: TodayStep?, kind: TodayStepKind) {
        SharedStore.saveTodayStep(step)
        DispatchQueue.main.async {
            self.todayStep = step
            self.stepKind = kind
        }
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
