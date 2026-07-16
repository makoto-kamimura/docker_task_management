import SwiftUI

/// T-304: 「🧭 今日の一歩 / タイトル / 所要時間 / 開始する」画面。
struct TodayStepView: View {
    @StateObject private var connector = PhoneConnector.shared
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 8) {
                Text("🧭 今日の一歩")
                    .font(.headline)

                if !connector.hasToken {
                    Text("iPhoneでログインしてください")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                } else if let step = connector.todayStep {
                    Text(step.title)
                        .font(.body)
                        .multilineTextAlignment(.center)
                    Text("\(step.durationMinutes)分")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    NavigationLink("開始する") {
                        TimerView(step: step)
                    }
                    .buttonStyle(.borderedProminent)
                } else if isLoading {
                    ProgressView()
                } else {
                    Text("今日の一歩がまだありません")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding()
            .task {
                isLoading = true
                await connector.refreshFromAPI()
                isLoading = false
            }
        }
    }
}

#Preview {
    TodayStepView()
}
