import WidgetKit
import SwiftUI

/// 「今日の一歩」タイトルを表示するコンプリケーション。
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> TodayStepEntry {
        TodayStepEntry(date: Date(), title: Copy.todayTitle)
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
        TodayStepEntry(date: Date(), title: SharedStore.loadTodayStep()?.title ?? Copy.widgetEmpty)
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
                    Image(systemName: Symbols.compass)
                        .font(.title3)
                    Text(entry.title)
                        .font(.system(size: 9))
                        .lineLimit(1)
                }
            }
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Label(Copy.todayTitle, systemImage: Symbols.compass)
                    .font(.caption2)
                    .widgetAccentable()
                Text(entry.title)
                    .font(.headline)
                    .lineLimit(2)
            }
        case .accessoryInline:
            Label(entry.title, systemImage: Symbols.compass)
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
        .configurationDisplayName(Copy.todayTitle)
        .description(Copy.widgetDescription)
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
