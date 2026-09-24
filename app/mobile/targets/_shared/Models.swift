import Foundation

/// 今日の一歩として何を実施するか。Web / iPhone（@shared/types の TodayStepKind）と同じ値。
/// Watch は「実施する一歩」だけを扱い、二択・細分化は iPhone / Web に任せる（design.md 13.1）。
enum TodayStepKind: String, Codable {
    case task
    case compare
    case breakdown
    case empty
}

/// 今日の一歩。iPhone（src/watch/sync.ts）から WatchConnectivity で受け取るか、API から直接取る。
struct TodayStep: Codable, Hashable {
    /// 所要時間が未設定のタスクに使う長さ。Web / iPhone（@shared/timer の DEFAULT_DURATION_MINUTES）と同じ値。
    static let defaultDurationMinutes = 15

    let taskId: Int
    let title: String
    let durationMinutes: Int
    /// ルートから葉の親までのタイトル（パンくず）。
    let path: [String]

    init(taskId: Int, title: String, durationMinutes: Int?, path: [String]) {
        self.taskId = taskId
        self.title = title
        self.durationMinutes = durationMinutes ?? TodayStep.defaultDurationMinutes
        self.path = path
    }

    // 以前の版で保存した（path を持たない）データも読めるようにする。
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        taskId = try container.decode(Int.self, forKey: .taskId)
        title = try container.decode(String.self, forKey: .title)
        durationMinutes = try container.decodeIfPresent(Int.self, forKey: .durationMinutes)
            ?? TodayStep.defaultDurationMinutes
        path = try container.decodeIfPresent([String].self, forKey: .path) ?? []
    }

    /// パンくずの表示。Web / iPhone（@shared/tasks の formatPath）と同じ区切り。
    var pathText: String {
        path.joined(separator: " → ")
    }
}

/// 結果入力の選択肢。並び順・文言は Web / iPhone（@shared/timer の TASK_LOG_RESULTS）と同じ。
enum TaskLogResult: String, CaseIterable, Identifiable {
    case done
    case partial
    case skipped

    var id: String { rawValue }

    var label: String {
        switch self {
        case .done: return "完了"
        case .partial: return "少しだけ"
        case .skipped: return "また今度"
        }
    }

    /// Web（lucide の CheckCircle2 / Clock / XCircle）・iPhone（Ionicons）と同じ意味の SF Symbols。
    var symbol: String {
        switch self {
        case .done: return "checkmark.circle.fill"
        case .partial: return "clock.fill"
        case .skipped: return "xmark.circle.fill"
        }
    }
}
