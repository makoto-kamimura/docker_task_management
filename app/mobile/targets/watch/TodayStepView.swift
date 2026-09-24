import SwiftUI

/// 今日の一歩。Web / iPhone の「今日の一歩」画面と同じ項目（パンくず・タイトル・所要時間・開始する・15分でできない）を並べる。
struct TodayStepView: View {
    @ObservedObject private var connector = PhoneConnector.shared
    @State private var isLoading = false
    @State private var isRequestingBreakdown = false
    @State private var errorMessage: String?
    /// 計測中の一歩。開始した時点の値で固定し、途中で iPhone から別の一歩が届いてもタイマーを入れ替えない。
    @State private var runningStep: TodayStep?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    Label(Copy.todayTitle, systemImage: Symbols.compass)
                        .font(.headline)

                    content
                }
                .padding()
            }
            .navigationDestination(item: $runningStep) { step in
                TimerView(step: step) {
                    // 記録したら次の一歩へ。Web / iPhone も結果入力のあとは今日の一歩に戻る。
                    runningStep = nil
                    Task { await refresh() }
                }
            }
            .task {
                await refresh()
                startIfRequested()
            }
            .onChange(of: connector.pendingAutostart) { _, _ in
                startIfRequested()
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if !connector.hasToken {
            caption(Copy.needsLogin)
        } else if let step = connector.todayStep {
            if !step.path.isEmpty {
                Text(step.pathText)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            Text(step.title)
                .font(.body)
                .multilineTextAlignment(.center)
            caption(Copy.minutes(step.durationMinutes))

            Button(Copy.start) {
                runningStep = step
            }
            .buttonStyle(.borderedProminent)

            Button(Copy.breakdown) {
                requestBreakdown(step)
            }
            .buttonStyle(.bordered)
            .disabled(isRequestingBreakdown)

            Text(Copy.breakdownHint)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption2)
                    .foregroundStyle(.red)
            }
        } else if isLoading {
            ProgressView()
        } else if connector.stepKind == .compare || connector.stepKind == .breakdown {
            // 二択・細分化は一覧や入力を伴うので Watch には置かない（design.md 13.1）。
            caption(Copy.phoneOnly)
        } else {
            caption(Copy.todayEmpty)
        }
    }

    private func caption(_ text: String) -> some View {
        Text(text)
            .font(.caption)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
    }

    private func refresh() async {
        isLoading = true
        await connector.refreshFromAPI()
        isLoading = false
    }

    /// 通知の [開始] で来たときは、今日の一歩が手元にあればすぐタイマーを開く。
    private func startIfRequested() {
        guard connector.pendingAutostart, let step = connector.todayStep else { return }
        connector.pendingAutostart = false
        runningStep = step
    }

    private func requestBreakdown(_ step: TodayStep) {
        isRequestingBreakdown = true
        errorMessage = nil
        Task { @MainActor in
            do {
                try await APIClient.markNeedsBreakdown(taskId: step.taskId)
                await refresh()
            } catch {
                errorMessage = Copy.saveFailed
            }
            isRequestingBreakdown = false
        }
    }
}

#Preview {
    TodayStepView()
}
