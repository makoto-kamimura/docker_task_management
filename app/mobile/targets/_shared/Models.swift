import Foundation

struct TodayStep: Codable, Equatable {
    let taskId: Int
    let title: String
    let durationMinutes: Int
}
