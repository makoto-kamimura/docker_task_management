import SwiftUI

/// 終了時の結果ワンタップ入力（完了/少しだけ/また今度）。POST /task-logs (source=watch)。
struct ResultView: View {
    let step: TodayStep
    let startedAt: Date
    let elapsedSeconds: Int
    let onRecorded: () -> Void

    @State private var isSubmitting = false
    @State private var errorMessage: String?

    init(step: TodayStep, startedAt: Date, elapsedSeconds: Int, onRecorded: @escaping () -> Void) {
        self.step = step
        self.startedAt = startedAt
        self.elapsedSeconds = elapsedSeconds
        self.onRecorded = onRecorded
    }

    var body: some View {
        VStack(spacing: 10) {
            Label(Copy.timerPrompt, systemImage: Symbols.prompt)
                .font(.subheadline)
                .multilineTextAlignment(.center)

            HStack(spacing: 12) {
                ForEach(TaskLogResult.allCases) { result in
                    Button {
                        submit(result)
                    } label: {
                        VStack(spacing: 2) {
                            Image(systemName: result.symbol).font(.title2)
                            Text(result.label).font(.system(size: 10))
                        }
                    }
                    .disabled(isSubmitting)
                }
            }

            if isSubmitting {
                ProgressView()
            }
            if let errorMessage {
                Text(errorMessage)
                    .font(.caption2)
                    .foregroundStyle(.red)
            }
        }
    }

    private func submit(_ result: TaskLogResult) {
        isSubmitting = true
        errorMessage = nil
        Task { @MainActor in
            do {
                try await APIClient.submitTaskLog(
                    taskId: step.taskId,
                    startedAt: startedAt,
                    result: result,
                    elapsedSeconds: elapsedSeconds
                )
                isSubmitting = false
                onRecorded()
            } catch {
                errorMessage = Copy.submitFailed
                isSubmitting = false
            }
        }
    }
}
