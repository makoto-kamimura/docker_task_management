import Combine
import SwiftUI
import WatchKit

/// カウントダウンタイマー。「終了する」で早期終了でき、その場合の
/// 経過秒数（elapsed_seconds）を結果送信に使う（「少しだけ」対応）。
struct TimerView: View {
    let step: TodayStep
    /// 結果を記録し終えたとき。
    let onRecorded: () -> Void

    @State private var startedAt = Date()
    /// 「終了する」を押した時刻。
    @State private var stoppedAt: Date?
    @State private var now = Date()
    @State private var hasPlayedFinish = false
    @StateObject private var runtimeSession = ExtendedRuntimeSessionController()

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(step: TodayStep, onRecorded: @escaping () -> Void) {
        self.step = step
        self.onRecorded = onRecorded
    }

    private var totalSeconds: Int {
        max(step.durationMinutes, 1) * 60
    }

    /// 開始からの経過秒。Web / iPhone（@shared/timer の timerSnapshot）と同じく、1 秒ごとの減算ではなく
    /// 開始時刻との差で求めるので、手首を下ろしている間に tick が間引かれてもずれない。
    private var elapsedSeconds: Int {
        let until = stoppedAt ?? now
        return min(totalSeconds, max(0, Int(until.timeIntervalSince(startedAt))))
    }

    private var isFinished: Bool {
        stoppedAt != nil || elapsedSeconds >= totalSeconds
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Text(step.title)
                    .font(.headline)
                    .multilineTextAlignment(.center)

                if isFinished {
                    ResultView(step: step, startedAt: startedAt, elapsedSeconds: elapsedSeconds, onRecorded: onRecorded)
                } else {
                    Text(formatted(totalSeconds - elapsedSeconds))
                        .font(.system(size: 34, weight: .semibold, design: .rounded))
                        .monospacedDigit()

                    Button(Copy.timerStop) {
                        stoppedAt = Date()
                        playFinish()
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding()
        }
        .onAppear {
            runtimeSession.start()
        }
        .onDisappear {
            runtimeSession.stop()
        }
        .onReceive(ticker) { date in
            guard !isFinished else { return }
            now = date
            if isFinished {
                playFinish()
            }
        }
    }

    private func playFinish() {
        guard !hasPlayedFinish else { return }
        hasPlayedFinish = true
        runtimeSession.stop()
        WKInterfaceDevice.current().play(.success)
    }

    /// 残り時間の表示（MM:SS）。Web / iPhone の formatClock と同じ形。
    private func formatted(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}
