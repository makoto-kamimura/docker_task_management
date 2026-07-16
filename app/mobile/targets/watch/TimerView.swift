import SwiftUI
import WatchKit

/// T-305: カウントダウンタイマー。「終了する」で早期終了でき、その場合の
/// 経過秒数（elapsed_seconds）を結果送信に使う（「少しだけ」対応）。
struct TimerView: View {
    let step: TodayStep

    @State private var startedAt = Date()
    @State private var remainingSeconds: Int
    @State private var isFinished = false
    @State private var timer: Timer?
    @StateObject private var runtimeSession = ExtendedRuntimeSessionController()

    private let totalSeconds: Int

    init(step: TodayStep) {
        self.step = step
        let total = max(step.durationMinutes, 1) * 60
        totalSeconds = total
        _remainingSeconds = State(initialValue: total)
    }

    private var elapsedSeconds: Int { totalSeconds - remainingSeconds }

    var body: some View {
        VStack(spacing: 12) {
            Text(step.title)
                .font(.headline)
                .multilineTextAlignment(.center)

            if isFinished {
                ResultView(step: step, startedAt: startedAt, elapsedSeconds: elapsedSeconds)
            } else {
                Text(formatted(remainingSeconds))
                    .font(.system(size: 34, weight: .semibold, design: .rounded))
                    .monospacedDigit()

                Button("終了する") {
                    finish()
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .onAppear {
            runtimeSession.start()
            startTicking()
        }
        .onDisappear {
            timer?.invalidate()
            runtimeSession.stop()
        }
    }

    private func startTicking() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if remainingSeconds <= 1 {
                finish()
            } else {
                remainingSeconds -= 1
            }
        }
    }

    private func finish() {
        guard !isFinished else { return }
        timer?.invalidate()
        remainingSeconds = max(remainingSeconds, 0)
        isFinished = true
        WKInterfaceDevice.current().play(.success)
    }

    private func formatted(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}
