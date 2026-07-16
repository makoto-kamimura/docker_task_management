import Foundation

/// Direct-to-Laravel client used by the watch app so a step can be fetched
/// and a result recorded even when the iPhone isn't nearby (design.md 3.2).
enum APIClient {
    enum ClientError: Error {
        case unauthenticated
        case requestFailed(status: Int)
    }

    /// Overridden per-target via the `API_BASE_URL` Info.plist key; falls back
    /// to the local Docker dev server used by design.md 2章.
    private static var baseURL: String {
        (Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String) ?? "http://localhost:8000/api/v1"
    }

    private static func authorizedRequest(path: String, method: String) throws -> URLRequest {
        guard let token = SharedStore.loadToken() else {
            throw ClientError.unauthenticated
        }
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw ClientError.requestFailed(status: 0)
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return request
    }

    static func fetchTodayStep() async throws -> TodayStep? {
        let request = try authorizedRequest(path: "/compass/today", method: "GET")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw ClientError.requestFailed(status: (response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let envelope = try JSONDecoder().decode(TodayEnvelope.self, from: data)
        guard let task = envelope.data else { return nil }
        return TodayStep(taskId: task.id, title: task.title, durationMinutes: task.durationMinutes ?? 15)
    }

    static func submitTaskLog(taskId: Int, startedAt: Date, result: String, elapsedSeconds: Int) async throws {
        var request = try authorizedRequest(path: "/task-logs", method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "task_id": taskId,
            "started_at": ISO8601DateFormatter().string(from: startedAt),
            "result": result,
            "elapsed_seconds": elapsedSeconds,
            "source": "watch",
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw ClientError.requestFailed(status: (response as? HTTPURLResponse)?.statusCode ?? 0)
        }
    }

    private struct TodayEnvelope: Decodable {
        let data: TodayTaskDTO?
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
}
