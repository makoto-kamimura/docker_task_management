import { createScheduleBlock } from './api'
import type { ScheduleBlock, TitlePreset } from './types'

/** 1日の分数。end_minute は 24:00 = 1440 を取りうる。 */
export const MINUTES_PER_DAY = 1440

/** 時刻選択の刻み（分）。円グラフで読み取れる粒度に合わせて 15 分単位にしている。 */
export const TIME_STEP_MINUTES = 15

/** カラースロット数（dataviz のカテゴリカル 8 色）。 */
export const SERIES_SLOT_COUNT = 8

/** 0=日 〜 6=土。API の day_of_week と同じ並び（JS Date#getDay と一致）。 */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

/** 週の表示順。月曜始まりで並べる（生活の実感に合わせる）。値そのものは 0=日 のまま。 */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** 時間割の中のタブ。表示名は @shared/copy の SCHEDULE.tabs。 */
export const SCHEDULE_TABS = ['timetable', 'slots'] as const
export type ScheduleTab = (typeof SCHEDULE_TABS)[number]

/** フォームを開いたときの既定の時刻（9:00〜10:00）。 */
export const DEFAULT_BLOCK_START = 9 * 60
export const DEFAULT_BLOCK_LENGTH = 60

/** 「これより短い隙間は通知しない」の選択肢。 */
export const MIN_GAP_CHOICES = [15, 30, 45, 60, 90, 120]

/**
 * 睡眠とみなすタイトルのキーワード。夜の睡眠だけでなく昼寝も同じ「眠った時間」として数える。
 * 部分一致で拾うので「昼寝（30分）」のような書き方でも対象になる。
 */
export const SLEEP_KEYWORDS = ['睡眠', '昼寝']

/**
 * 運動とみなすタイトルのキーワード。
 * 睡眠と違って「ジム」ひとつには決まらないので、部分一致で拾う。
 * こうしておくと「朝ジム」「ヨガ（軽め）」のように自分で書いたタイトルも数に入る。
 */
export const EXERCISE_KEYWORDS = [
  '運動',
  'ジム',
  '散歩',
  'ウォーキング',
  'ランニング',
  'ジョギング',
  '筋トレ',
  'トレーニング',
  'ヨガ',
  'ストレッチ',
  '水泳',
  'スイミング',
  'サイクリング',
  '自転車',
]

export function formatMinute(minute: number): string {
  return `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, '0')}`
}

export function formatTimeRange(start: number, end: number): string {
  return `${formatMinute(start)}〜${formatMinute(end)}`
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest}分`
  if (rest === 0) return `${hours}時間`

  return `${hours}時間${rest}分`
}

export function todayDayOfWeek(): number {
  return new Date().getDay()
}

/** from（含む）から to（含む）までを TIME_STEP_MINUTES 刻みで並べた選択肢。 */
export function minuteOptions(from: number, to: number): number[] {
  const options: number[] = []

  for (let minute = from; minute <= to; minute += TIME_STEP_MINUTES) {
    options.push(minute)
  }

  return options
}

/** 開始時刻の選択肢（0:00〜23:45）。 */
export function startMinuteOptions(): number[] {
  return minuteOptions(0, MINUTES_PER_DAY - TIME_STEP_MINUTES)
}

/** 終了時刻の選択肢（開始 +15 分〜24:00）。開始より前の終了は API が 422 で弾くので最初から出さない。 */
export function endMinuteOptions(startMinute: number): number[] {
  return minuteOptions(startMinute + TIME_STEP_MINUTES, MINUTES_PER_DAY)
}

export interface ScheduleSlice {
  block: ScheduleBlock
  /** 0〜7。同じタイトルの予定は同じ色になる。 */
  colorIndex: number
  /**
   * 8 種類を使い切ったあとの識別手段。0 = 塗り、1 以上は同じ色相にテクスチャを重ねる
   * （Web はハッチング、モバイルは明度差）。色相を増やさないのは、生成した 9 色目が CVD で判別できないため。
   */
  patternLevel: number
}

/**
 * タイトルごとの色スロットを 1 週間ぶんまとめて決める。
 * 曜日をまたいで同じ «仕事» が同じ色になるようにするため、曜日ごとに割り当て直さない。
 */
export function buildTitleSlots(weekBlocks: ScheduleBlock[]): Map<string, number> {
  const slotByTitle = new Map<string, number>()

  const ordered = [...weekBlocks].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_minute - b.start_minute,
  )

  for (const block of ordered) {
    const key = block.title.trim()
    if (!slotByTitle.has(key)) {
      slotByTitle.set(key, slotByTitle.size)
    }
  }

  return slotByTitle
}

/**
 * 1日ぶんの予定を開始時刻順に並べ、タイトル単位で色を割り当てる。
 * titleSlots を渡すと週で共有した色を使う。
 */
export function buildSlices(blocks: ScheduleBlock[], titleSlots?: Map<string, number>): ScheduleSlice[] {
  const slots = titleSlots ?? buildTitleSlots(blocks)

  return [...blocks]
    .sort((a, b) => a.start_minute - b.start_minute)
    .map((block) => {
      const slot = slots.get(block.title.trim()) ?? 0

      return {
        block,
        colorIndex: slot % SERIES_SLOT_COUNT,
        patternLevel: Math.floor(slot / SERIES_SLOT_COUNT),
      }
    })
}

export function blocksOfDay(weekBlocks: ScheduleBlock[], dayOfWeek: number): ScheduleBlock[] {
  return weekBlocks.filter((block) => block.day_of_week === dayOfWeek)
}

export function scheduledMinutes(blocks: ScheduleBlock[]): number {
  return blocks.reduce((total, block) => total + block.duration_minutes, 0)
}

export function isSleepTitle(title: string): boolean {
  const trimmed = title.trim()

  return SLEEP_KEYWORDS.some((keyword) => trimmed.includes(keyword))
}

export function isExerciseTitle(title: string): boolean {
  const trimmed = title.trim()

  return EXERCISE_KEYWORDS.some((keyword) => trimmed.includes(keyword))
}

export interface DayStats {
  /** 予定の合計。 */
  planned: number
  /** 睡眠の合計。同じ日に夜の睡眠と昼寝を分けて登録していても合算する。 */
  sleep: number
  exercise: number
  /** 「スキマ」に指定した予定の合計。タイトルではなく通知の指定で数える。 */
  notify: number
}

export const EMPTY_DAY_STATS: DayStats = { planned: 0, sleep: 0, exercise: 0, notify: 0 }

export function dayStats(blocks: ScheduleBlock[]): DayStats {
  return {
    planned: scheduledMinutes(blocks),
    sleep: scheduledMinutes(blocks.filter((block) => isSleepTitle(block.title))),
    exercise: scheduledMinutes(blocks.filter((block) => isExerciseTitle(block.title))),
    notify: scheduledMinutes(blocks.filter((block) => block.notify_at_start)),
  }
}

/** 曜日タブにも同じ合計を出すので、7 曜日ぶんまとめて数えておく。 */
export function weekStats(weekBlocks: ScheduleBlock[]): Map<number, DayStats> {
  return new Map(WEEK_ORDER.map((day) => [day, dayStats(blocksOfDay(weekBlocks, day))]))
}

export type DayStatKey = 'sleep' | 'exercise' | 'notify'

/** 睡眠・運動・スキマの合計の見出し。アイコンは端末ごとに key から引く。 */
export const DAY_STAT_LABELS: Record<DayStatKey, { short: string; total: string; includedIn?: string }> = {
  sleep: { short: '睡眠', total: '睡眠合計', includedIn: '睡眠合計に含まれます' },
  exercise: { short: '運動', total: '運動時間合計', includedIn: '運動時間合計に含まれます' },
  notify: { short: 'スキマ', total: 'スキマ合計' },
}

export const DAY_STAT_KEYS: DayStatKey[] = ['sleep', 'exercise', 'notify']

/** 曜日タブに出す合計。0 のものは出さず、未登録の曜日をすっきり保つ。 */
export function visibleDayStats(stats: DayStats): { key: DayStatKey; minutes: number }[] {
  return DAY_STAT_KEYS.map((key) => ({ key, minutes: stats[key] })).filter((stat) => stat.minutes > 0)
}

export function freeTimeLabel(stats: DayStats): string {
  return stats.planned === 0 ? '未登録' : `空き ${formatDuration(MINUTES_PER_DAY - stats.planned)}`
}

/** 曜日タブの読み上げ名。アイコンだけだと意味が伝わらないので、ボタン全体の名前をここで作る。 */
export function weekdayAccessibilityLabel(day: number, stats: DayStats): string {
  return [
    `${WEEKDAY_LABELS[day]}曜`,
    freeTimeLabel(stats),
    ...visibleDayStats(stats).map((stat) => `${DAY_STAT_LABELS[stat.key].short} ${formatDuration(stat.minutes)}`),
  ].join('、')
}

/** 予定の一覧で、合計に数えている予定に付ける印。 */
export function includedStatKeys(block: ScheduleBlock): DayStatKey[] {
  const keys: DayStatKey[] = []
  if (isSleepTitle(block.title)) keys.push('sleep')
  if (isExerciseTitle(block.title)) keys.push('exercise')

  return keys
}

/**
 * タイトル欄に出す「よく使う項目」。何も打っていなければ全件、打っていれば部分一致で絞る。
 * 打った文字とちょうど同じものは、選んでも何も変わらないので出さない。
 */
export function titleSuggestions(presets: TitlePreset[], typed: string): TitlePreset[] {
  const text = typed.trim()
  if (text === '') return presets

  return presets.filter((preset) => preset.label !== text && preset.label.includes(text))
}

export function ownTitlePresets(presets: TitlePreset[]): TitlePreset[] {
  return presets.filter((preset) => !preset.is_default)
}

export function notifyToggleHint(block: ScheduleBlock): string {
  return block.notify_at_start
    ? `${formatMinute(block.start_minute)} に「今日の一歩」を通知します`
    : 'ONにすると開始時刻に「今日の一歩」を通知します'
}

// ---- 予定フォーム -------------------------------------------------------------

export interface ScheduleFormState {
  /** 編集中の予定。null なら新規登録。 */
  editingId: number | null
  title: string
  taskId: number | null
  startMinute: number
  endMinute: number
}

export type ScheduleFormAction =
  | { type: 'reset'; nextStart: number }
  | { type: 'edit'; block: ScheduleBlock }
  | { type: 'setTitle'; title: string }
  | { type: 'setTask'; taskId: number | null; taskTitle?: string }
  | { type: 'setStart'; minute: number }
  | { type: 'setEnd'; minute: number }

export function initialScheduleForm(nextStart = DEFAULT_BLOCK_START): ScheduleFormState {
  return {
    editingId: null,
    title: '',
    taskId: null,
    startMinute: Math.min(nextStart, MINUTES_PER_DAY - TIME_STEP_MINUTES),
    endMinute: Math.min(nextStart + DEFAULT_BLOCK_LENGTH, MINUTES_PER_DAY),
  }
}

/** 予定フォームの状態遷移。useReducer に渡して使う。 */
export function scheduleFormReducer(state: ScheduleFormState, action: ScheduleFormAction): ScheduleFormState {
  switch (action.type) {
    case 'reset':
      // 続けて登録しやすいように、直前の予定の終わりを次の開始時刻にする。
      return initialScheduleForm(action.nextStart)
    case 'edit':
      return {
        editingId: action.block.id,
        title: action.block.title,
        taskId: action.block.task_id,
        startMinute: action.block.start_minute,
        endMinute: action.block.end_minute,
      }
    case 'setTitle':
      return { ...state, title: action.title }
    case 'setTask':
      // タイトルが空のときだけ、選んだやりたいことの名前をタイトルに入れる。
      return {
        ...state,
        taskId: action.taskId,
        title: state.title.trim() === '' && action.taskTitle ? action.taskTitle : state.title,
      }
    case 'setStart':
      return {
        ...state,
        startMinute: action.minute,
        endMinute:
          state.endMinute <= action.minute
            ? Math.min(action.minute + DEFAULT_BLOCK_LENGTH, MINUTES_PER_DAY)
            : state.endMinute,
      }
    case 'setEnd':
      return { ...state, endMinute: action.minute }
  }
}

// ---- 他の曜日へコピー ---------------------------------------------------------

/**
 * 同じタイトル・時刻・スキマ指定のまま、選んだ曜日へまとめてコピーする。
 * 重複などで一部の曜日だけ失敗しても、成功した曜日は反映したいので allSettled でまとめて実行する。
 *
 * @returns コピーできなかった曜日
 */
export async function copyScheduleBlock(block: ScheduleBlock, days: number[]): Promise<number[]> {
  const results = await Promise.allSettled(
    days.map((day) =>
      createScheduleBlock({
        title: block.title,
        day_of_week: day,
        start_minute: block.start_minute,
        end_minute: block.end_minute,
        task_id: block.task_id,
        notify_at_start: block.notify_at_start,
      }),
    ),
  )

  return days.filter((_, index) => results[index].status === 'rejected')
}

export function copyFailureMessage(failedDays: number[]): string {
  return `${failedDays.map((day) => WEEKDAY_LABELS[day]).join('・')}曜は予定が重複しているためコピーできませんでした。`
}

// ---- 円グラフの幾何 -----------------------------------------------------------

/** 隣り合う塗りを 2px の余白で分ける（線で囲まず、マーク側を削って作る）。 */
const GAP_PX = 2

/** 直接ラベルを併記する上限。これを超える場合は一覧（凡例）だけで識別する。 */
export const MAX_DIRECT_LABELS = 4

/** 直接ラベルを出す最短の長さ。短い弧に引き出し線を付けると隣と重なる。 */
export const MIN_DIRECT_LABEL_MINUTES = 45

/** 0 時を頂点に時計回りで 24 時間を 1 周とする、ドーナツ円グラフの座標計算。 */
export function donutGeometry(cx: number, cy: number, rOuter: number, rInner: number) {
  const gapAngle = GAP_PX / 2 / rInner

  function angleOf(minute: number): number {
    return (minute / MINUTES_PER_DAY) * Math.PI * 2 - Math.PI / 2
  }

  function pointOf(angle: number, radius: number): [number, number] {
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  }

  function arcPath(startAngle: number, endAngle: number): string {
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    const [x1, y1] = pointOf(startAngle, rOuter)
    const [x2, y2] = pointOf(endAngle, rOuter)
    const [x3, y3] = pointOf(endAngle, rInner)
    const [x4, y4] = pointOf(startAngle, rInner)

    return [
      `M ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ')
  }

  /** 予定 1 件ぶんの塗り。余白 2 本ぶんより短い予定は削らない（消えてしまうため）。 */
  function slicePath(start: number, end: number): string {
    const sweep = angleOf(end) - angleOf(start)
    const gap = sweep > gapAngle * 3 ? gapAngle : 0

    return arcPath(angleOf(start) + gap, angleOf(end) - gap)
  }

  /** 1 時間ごとの目盛り（3 時間ごとは長め）。 */
  function hourTicks(): { hour: number; from: [number, number]; to: [number, number]; major: boolean }[] {
    return Array.from({ length: 24 }, (_, hour) => {
      const angle = angleOf(hour * 60)
      const major = hour % 3 === 0

      return { hour, from: pointOf(angle, rOuter + 3), to: pointOf(angle, rOuter + (major ? 9 : 5)), major }
    })
  }

  return { angleOf, pointOf, arcPath, slicePath, hourTicks, trackRadius: (rOuter + rInner) / 2, trackWidth: rOuter - rInner }
}

/** 3 時間ごとだけ数字を出す。24 個すべて置くと小さい画面では潰れて読めない。 */
export const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21]

export function donutAccessibilityLabel(planned: number): string {
  return `24時間の時間割。予定 ${formatDuration(planned)}、空き ${formatDuration(MINUTES_PER_DAY - planned)}。`
}
