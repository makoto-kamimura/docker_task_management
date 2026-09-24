import Foundation

/// Direct-to-Laravel client used by the watch app so a step can be fetched
/// and a result recorded even when the iPhone isn't nearby (design.md 3.2).
/// 呼び出す API と送る値は Web / iPhone（app/web/src/shared/api.ts）と同じ。
enum APIClient {
    enum ClientError: Error {
        case unauthenticated
        case invalidURL
        case requestFailed(status: Int)
    }

    /// iPhone から受け取ったベース URL を優先する（iPhone と同じサーバーを呼ぶため）。
    /// まだ受け取っていなければ Info.plist の API_BASE_URL、それもなければローカルの開発サーバー。
    private static var baseURL: String {
        SharedStore.loadApiBaseUrl()
            ?? (Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String)
            ?? "http://localhost:8000/api/v1"
    }

    @discardableResult
    private static func send(_ path: String, method: String, body: [String: Any]? = nil) async throws -> Data {
        guard let token = SharedStore.loadToken() else {
            throw ClientError.unauthenticated
        }
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw ClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            throw ClientError.requestFailed(status: status)
        }
        return data
    }

    /// 今日の一歩 1 件と、その種類。二択・細分化のときは step が nil になる。
    struct TodayResult {
        let kind: TodayStepKind
        let step: TodayStep?
    }

    /// GET /compass/today。実施できる一歩がなければ step は nil で、kind が次にすることを示す。
    static func fetchTodayStep() async throws -> TodayResult {
        let data = try await send("/compass/today", method: "GET")
        let envelope = try JSONDecoder().decode(TodayEnvelope.self, from: data)
        let kind = envelope.kind.flatMap(TodayStepKind.init(rawValue:))
            ?? (envelope.data == nil ? .empty : .task)

        // 細分化の対象タスクは Watch では実施できないので、一歩としては持たない。
        guard kind == .task, let task = envelope.data else {
            return TodayResult(kind: kind, step: nil)
        }

        return TodayResult(kind: kind, step: TodayStep(
            taskId: task.id,
            title: task.title,
            durationMinutes: task.durationMinutes,
            path: (envelope.path ?? []).map(\.title)
        ))
    }

    /// 「15分でできない」。needs_breakdown を立てると、今日の一歩の候補から外れ、細分化の対象になる。
    static func markNeedsBreakdown(taskId: Int) async throws {
        try await send("/tasks/\(taskId)", method: "PATCH", body: ["needs_breakdown": true])
    }

    static func submitTaskLog(taskId: Int, startedAt: Date, result: TaskLogResult, elapsedSeconds: Int) async throws {
        try await send("/task-logs", method: "POST", body: [
            "task_id": taskId,
            "started_at": ISO8601DateFormatter().string(from: startedAt),
            "result": result.rawValue,
            "elapsed_seconds": elapsedSeconds,
            "source": "watch",
        ])
    }

    private struct TodayEnvelope: Decodable {
        let kind: String?
        let data: TodayTaskDTO?
        let path: [PathItemDTO]?
    }

    private struct TodayTaskDTO: Decodable {
        let id: Int
        let title: String
        let durationMinutes: Int?

        enum CodingKeys: String, CodingKey {
            case id, title
            case durationMinutes = "duration_minutes"
        }
    }

    private struct PathItemDTO: Decodable {
        let title: String
    }
}
