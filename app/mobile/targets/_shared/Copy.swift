import Foundation

/// 画面の文言。Web / iPhone（app/web/src/shared/copy.ts）と同じ言い回しを写している。変えるときは両方直す。
enum Copy {
    static let todayTitle = "今日の一歩"
    static let todayEmpty = "やりたいことを登録すると、おすすめが表示されます。"
    static let start = "開始する"
    static let breakdown = "15分でできない"
    static let breakdownHint = "押すと別のやりたいことが表示されます。細分化はあとで今日の一歩として案内します"
    /// Watch だけが出す。トークンは iPhone から受け取るため。
    static let needsLogin = "iPhoneでログインしてください"
    /// 二択・細分化は Watch では扱わないので iPhone / Web へ促す（@shared/copy の TODAY.watchPhoneOnly）。
    static let phoneOnly = "iPhoneで今日の一歩を選んでください"

    static let timerStop = "終了する"
    static let timerPrompt = "お疲れ様！ できた？"
    static let submitFailed = "送信に失敗しました。"
    static let saveFailed = "保存に失敗しました。"

    /// コンプリケーション（Watch だけの表示先）。
    static let widgetEmpty = "今日の一歩は未設定"
    static let widgetDescription = "今日のおすすめタスクを文字盤に表示します。"

    static func minutes(_ value: Int) -> String {
        "\(value)分"
    }
}

/// 絵文字の代わりに使う SF Symbols。Web（lucide）・iPhone（Ionicons）と同じ意味の絵柄を選んでいる。
enum Symbols {
    /// 今日の一歩（Web: Compass / iPhone: compass-outline）。
    static let compass = "safari"
    /// 結果入力の見出し（Web: Sparkles / iPhone: sparkles-outline）。
    static let prompt = "sparkles"
}
