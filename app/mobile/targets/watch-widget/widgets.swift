import WidgetKit
import SwiftUI

/// T-306: 「今日の一歩」タイトルを表示するコンプリケーション。
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> TodayStepEntry {
        TodayStepEntry(date: Date(), title: "今日の一歩")
    }

    func getSnapshot(in context: Context, completion: @escaping (TodayStepEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodayStepEntry>) -> Void) {
        let entry = currentEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func currentEntry() -> TodayStepEntry {
        let title = SharedStore.loadTodayStep()?.title ?? "今日の一歩は未設定"
        return TodayStepEntry(date: Date(), title: title)
    }
}

struct TodayStepEntry: TimelineEntry {
    let date: Date
    let title: String
}

struct watchWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: Provider.Entry

    var body: some View {
        switch widgetFamily {
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) {
                    Text("🧭")
                        .font(.title3)
                    Text(entry.title)
                        .font(.system(size: 9))
                        .lineLimit(1)
                }
            }
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text("🧭 今日の一歩")
                    .font(.caption2)
                    .widgetAccentable()
                Text(entry.title)
                    .font(.headline)
                    .lineLimit(2)
            }
        case .accessoryInline:
            Text("🧭 \(entry.title)")
        default:
            Text(entry.title)
        }
    }
}

struct watchWidget: Widget {
    let kind: String = "watchWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            watchWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("今日の一歩")
        .description("今日のおすすめタスクを文字盤に表示します。")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}

#Preview(as: .accessoryRectangular) {
    watchWidget()
} timeline: {
    TodayStepEntry(date: .now, title: "5分だけ瞑想する")
}
