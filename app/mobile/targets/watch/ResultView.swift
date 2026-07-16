import SwiftUI

/// T-305: 終了時の結果ワンタップ入力（完了/少しだけ/また今度）。POST /task-logs (source=watch)。
struct ResultView: View {
    let step: TodayStep
    let startedAt: Date
    let elapsedSeconds: Int

    @State private var isSubmitting = false
    @State private var submittedResult: String?
    @State private var errorMessage: String?

    private let options: [(result: String, symbol: String, caption: String)] = [
        ("done", "checkmark.circle.fill", "完了"),
        ("partial", "circle.lefthalf.filled", "少しだけ"),
        ("skipped", "xmark.circle.fill", "また今度"),
    ]

    var body: some View {
        VStack(spacing: 10) {
            Text("👏 お疲れ様！ できた？")
                .font(.subheadline)
                .multilineTextAlignment(.center)

            if let submittedResult, let selected = options.first(where: { $0.result == submittedResult }) {
                Label(selected.caption, systemImage: selected.symbol)
                    .font(.headline)
            } else {
                HStack(spacing: 12) {
                    ForEach(options, id: \.result) { option in
                        resultButton(result: option.result, symbol: option.symbol, caption: option.caption)
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
        .padding()
    }

    private func resultButton(result: String, symbol: String, caption: String) -> some View {
        Button {
            submit(result: result)
        } label: {
            VStack(spacing: 2) {
                Image(systemName: symbol).font(.title2)
                Text(caption).font(.system(size: 10))
            }
        }
        .disabled(isSubmitting || submittedResult != nil)
    }

    private func submit(result: String) {
        isSubmitting = true
        errorMessage = nil
        Task {
            do {
                try await APIClient.submitTaskLog(
                    taskId: step.taskId,
                    startedAt: startedAt,
                    result: result,
                    elapsedSeconds: elapsedSeconds
                )
                await MainActor.run {
                    submittedResult = result
                    isSubmitting = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = "送信に失敗しました"
                    isSubmitting = false
                }
            }
        }
    }
}
