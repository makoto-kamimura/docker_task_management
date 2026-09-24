/**
 * 画面の文言。Web とモバイルで同じ言い回しを使うためにここへ集める。
 * Apple Watch（app/mobile/targets/_shared/Copy.swift）も同じ文言を写して使う。
 */

export const APP_NAME = '人生のコンパス'
export const APP_TAGLINE = '迷う時間を、進む時間へ。'

/** ログイン後の画面。ナビゲーション（Web のサイドメニュー / モバイルのタブ）はこの順に並べる。 */
export const SCREENS = {
  today: { nav: '今日の一歩', title: '今日の一歩' },
  tasks: { nav: 'やりたいこと', title: 'やりたいこと登録' },
  dashboard: { nav: 'ダッシュボード', title: 'ダッシュボード' },
  schedule: { nav: '時間割', title: '時間割' },
  resume: { nav: '履歴書', title: '履歴書' },
  // ここから下は「今日の一歩」の中で実施する画面。ナビゲーションには出さず、
  // 今日の一歩から案内する（あとから単独で開きたいとき用に URL は残す）。
  compare: { nav: '二択で選ぶ', title: 'どちらが今重要？' },
  todo: { nav: 'やりたいことの細分化', title: 'やりたいことの細分化' },
} as const

export type ScreenKey = keyof typeof SCREENS

/**
 * ナビゲーションの区分。利用フローのとおり「隙間時間に進む」画面と
 * 「あとで振り返る」画面を分けて並べる。
 */
export const NAV_SECTIONS: readonly { key: string; label: string; screens: readonly ScreenKey[] }[] = [
  { key: 'act', label: '進む', screens: ['today', 'tasks'] },
  { key: 'review', label: '振り返る', screens: ['dashboard', 'schedule', 'resume'] },
]

export const SCREEN_ORDER: ScreenKey[] = NAV_SECTIONS.flatMap((section) => [...section.screens])

/** ナビゲーションには出さないが、URL とタブの登録だけ要る画面。 */
export const FLOW_SCREENS: ScreenKey[] = ['compare', 'todo']

export const COMMON = {
  loading: '読み込み中...',
  unexpectedError: '予期せぬエラーが発生しました。',
  saveFailed: '保存に失敗しました。',
  cancel: 'キャンセル',
  delete: '削除',
  edit: '編集',
  add: '追加',
  close: '閉じる',
  logout: 'ログアウト',
} as const

export const AUTH = {
  loginTitle: 'ログイン',
  registerTitle: '新規登録',
  name: '名前',
  email: 'メールアドレス',
  password: 'パスワード',
  newPassword: 'パスワード（8文字以上）',
  loginSubmit: 'ログイン',
  registerSubmit: '登録する',
  toRegister: 'アカウントをお持ちでない方は新規登録',
  toLogin: 'すでにアカウントをお持ちの方はログイン',
} as const

export const TODAY = {
  empty: 'やりたいことを登録すると、おすすめが表示されます。',
  emptyAction: 'やりたいことを登録する',
  start: '開始する',
  breakdown: '15分でできない',
  breakdownHint: '押すと別のやりたいことが表示されます。細分化はあとで今日の一歩として案内します',
  /** 今日の一歩が「二択で選ぶ」になったとき（実施できるやりたいことが無い）。 */
  compareLead: '今すぐ実施できるやりたいことがありません。どちらを先にやりたいか選ぶことが、今日の一歩です。',
  /** 今日の一歩が「細分化」になったとき（優先度が確定した）。 */
  breakdownLead: '優先順位が決まりました。上位のやりたいことを15分でできる一歩に分けることが、今日の一歩です。',
  breakdownEmpty: '細分化が必要なやりたいことはありません。',
  /** 隙間時間の残り。使い切るまでは、終わるたびに次の一歩を選び直す。 */
  sessionRemaining: (clock: string) => `隙間時間の残り ${clock}`,
  sessionNext: 'まだ時間があります。続けてもう一歩進みましょう。',
  sessionOver: '15分たちました。おつかれさま。',
  sessionContinue: 'もう一歩つづける',
  sessionFinish: '今日はここまで',
  /** 利用フローの見取り図。今日の一歩が無いときに出す。 */
  flow: ['やりたいことを登録', '隙間時間に通知', '今日の一歩を実施', 'あとで振り返り'],
  /** Apple Watch だけが出す。トークンは iPhone から受け取るため。 */
  watchNeedsLogin: 'iPhoneでログインしてください',
  /** Apple Watch は二択・細分化を持たないので iPhone / Web へ促す（design.md 13.1）。 */
  watchPhoneOnly: 'iPhoneで今日の一歩を選んでください',
} as const

export const TIMER = {
  title: 'タイマー',
  stop: '終了する',
  prompt: 'お疲れ様！ できた？',
  submitFailed: '送信に失敗しました。',
} as const

export const TASKS = {
  inputLabel: 'やりたいこと（タイトルのみ）',
  placeholder: '例: Reactを勉強する',
  submit: '追加する',
  subtaskPlaceholder: '例: 公式ページを15分読む',
  addChild: '＋子タスク',
  empty: 'まだ登録がありません。',
  createFailed: '登録に失敗しました。',
  deleteTitle: 'タスクを削除',
} as const

export const TODO = {
  description: '「15分でできない」と答えたやりたいことです。15〜30分で終わる小さな一歩に分けましょう。',
  empty: '細分化が必要なやりたいことはありません。',
  split: '＋分解する',
  done: '分解完了',
} as const

export const COMPARE = {
  needTwo: '比較するには「やりたいこと」を2件以上登録してください。',
  skip: 'あとで決める',
  keyboardHint: '← / → キーでも選べます',
} as const

export const DASHBOARD = {
  recommendation: '今日のおすすめ',
  noRecommendation: 'おすすめはまだありません',
  completedThisWeek: '今週完了数',
  comparisonCount: '比較回数',
  streakDays: '継続日数',
  ranking: 'ランキング',
  rankingEmpty: 'タスクがまだありません。',
} as const

export const SCHEDULE = {
  /** 時間割の中のタブ。予定の登録と、隙間時間（リマインド）の確認・設定を分けて置く。 */
  tabs: { timetable: '週間タイムテーブル', slots: 'スキマ時間設定' },
  tabsLabel: '時間割の表示',
  timetableIntro: '1週間の使い方を曜日ごとに登録すると、塗り残しがそのまま「隙間時間」になります。',
  slotsIntro:
    '隙間時間の始まりに加えて、「スキマ」をONにした予定の開始時刻にも「今日の一歩」をリマインドします。',
  today: '今日',
  emptyDay: (day: string) => `${day}曜の予定はまだありません。下のフォームから登録してください。`,
  plannedSummary: (planned: string, free: string) => `予定 ${planned} ／ 空き ${free}`,
  dayStatTotal: (label: string, value: string) => `${label}: ${value}`,
  chartPlanned: '予定',
  chartFree: (free: string) => `空き ${free}`,
  draftTitle: '新しい予定',
  copy: 'コピー',
  notifyToggle: (on: boolean) => `スキマ ${on ? 'ON' : 'OFF'}`,
  copyPrompt: (title: string, range: string) => `「${title}」（${range}）を同じ内容でコピーする曜日を選んでください。`,
  copySubmit: 'コピーする',
  deleteTitle: '予定を削除',
  deleteMessage: (title: string) => `「${title}」を削除します。よろしいですか？`,
  freeSlotsTitle: (day: string) => `${day}曜の隙間時間`,
  noFreeSlots: 'リマインドできる隙間がありません。予定を減らすか、リマインドの設定をゆるめてください。',
  reminderSettingsTitle: 'リマインドの設定',
  remindAt: (time: string) => `${time} にリマインド`,
  minGapLabel: 'これより短い隙間は通知しない',
  windowStartLabel: '通知してよい時間帯（開始）',
  windowEndLabel: '通知してよい時間帯（終了）',
  formTitle: (day: string, isEditing: boolean) => `${day}曜の${isEditing ? '予定を編集' : '予定を追加'}`,
  taskLabel: 'やりたいことから選ぶ（任意）',
  noTask: '紐付けない',
  titleLabel: 'タイトル',
  titlePlaceholder: '例: 仕事',
  startLabel: '開始',
  endLabel: '終了',
  pickTime: (label: string) => `${label}を選ぶ`,
  submit: (isEditing: boolean) => (isEditing ? '保存' : '追加'),
  presetsOpen: 'よく使う項目を追加・削除',
  presetsClose: '項目の編集を閉じる',
  presetPlaceholder: '例: 散歩',
  presetInputLabel: '追加する項目名',
  presetsEmpty: '自分で追加した項目はまだありません。よく登録する予定を入れておくと、次回から選ぶだけで済みます。',
  presetCreateFailed: '項目の登録に失敗しました。',
  presetDeleteFailed: '項目の削除に失敗しました。',
} as const

export const RESUME = {
  tabs: { current: '今の履歴書', future: '将来の履歴書' },
  tabsLabel: '履歴書の表示',
  currentIntro: '就職・転職で出す履歴書の内容です。個人情報の項目はどれも任意で、入力した内容は暗号化して保存します。',
  futureIntro:
    'なりたい将来の履歴書を先に書きます。書いた目標は「やりたいこと」に登録されるので、' +
    '必要なタスクに分解すれば、二択比較や「今日の一歩」でそのまま進められます。',
  profileTitle: 'プロフィール',
  profileEmpty: 'まだ入力がありません。',
  profileEdit: '編集',
  profileSave: '保存',
  historyEmpty: 'まだ登録がありません。',
  addEntry: (timeline: 'current' | 'future') => (timeline === 'future' ? '目標を追加' : '行を追加'),
  editEntry: '行を編集',
  kindLabel: '種類',
  yearLabel: '年',
  monthLabel: '月',
  contentLabel: '内容',
  contentPlaceholder: (kind: 'education' | 'work' | 'license') =>
    kind === 'education' ? '例: 〇〇大学 経済学部 卒業' : kind === 'work' ? '例: 株式会社〇〇 入社' : '例: 普通自動車第一種運転免許 取得',
  futureContentPlaceholder: '例: 情報処理安全確保支援士 合格',
  submit: (isEditing: boolean) => (isEditing ? '保存' : '追加'),
  goalBadge: '目標',
  goalsTitle: '目標と必要なタスク',
  goalsEmpty: 'まだ目標がありません。下のフォームから、なりたい将来の学歴・職歴・資格を登録してください。',
  stepsEmpty: 'まだタスクがありません。「＋必要なタスク」で、この目標に近づく一歩を登録しましょう。',
  addStep: '＋必要なタスク',
  achieve: '達成した',
  achieveConfirm: (content: string) =>
    `「${content}」を達成として今の履歴書へ移します。紐付いた「やりたいこと」は完了扱いになり、ランキングと今日の一歩から外れます。よろしいですか？`,
  relinkTask: 'やりたいことに登録',
  taskMissing: '紐付いた「やりたいこと」が削除されています。',
  previewTitle: '見本',
  previewLabel: '履歴書の見本（入力中の内容を反映）',
  previewHint: '入力中の内容がそのまま見本に反映されます（保存前の値は破線で表示）。',
  previewOpen: '見本を見る',
  pdf: (timeline: 'current' | 'future') => (timeline === 'future' ? '将来の履歴書をPDFで保存' : 'PDFで保存'),
  /** Web はブラウザの印刷画面から PDF にする。 */
  pdfWebHint: '印刷画面が開きます。送信先で「PDFに保存」を選んでください。',
  pdfFailed: 'PDFを作れませんでした。',
  deleteTitle: '行を削除',
  deleteMessage: (content: string, isFuture: boolean) =>
    isFuture
      ? `「${content}」を削除します。紐付いた「やりたいこと」は残ります。よろしいですか？`
      : `「${content}」を削除します。よろしいですか？`,
} as const
