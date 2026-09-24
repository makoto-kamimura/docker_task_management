import SwiftUI

@main
struct LifeCompassWatchApp: App {
    init() {
        NotificationController.shared.activate()
    }

    var body: some Scene {
        WindowGroup {
            TodayStepView()
        }
    }
}
