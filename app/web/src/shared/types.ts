/** API（/api/v1）のレスポンス・リクエストの型。Web とモバイルで同じ定義を使う。 */

export interface User {
  id: number
  name: string
  email: string
}

export type DeadlineType = 'today' | 'week' | 'month' | 'none'
export type TaskStatus = 'active' | 'archived'

export interface Task {
  id: number
  parent_id: number | null
  title: string
  duration_minutes: number | null
  deadline_type: DeadlineType
  rating: number
  status: TaskStatus
  /** 「15分でできない」を押したタスク。今日の一歩の候補から外れ、細分化の対象になる。 */
  needs_breakdown: boolean
  last_done_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  parent_id?: number
}

export type TaskUpdate = Partial<{
  title: string
  duration_minutes: number | null
  deadline_type: DeadlineType
  status: TaskStatus
  needs_breakdown: boolean
  parent_id: number | null
}>

export interface TaskPathItem {
  id: number
  title: string
}

/**
 * 今日の一歩として何を実施するか（API の kind）。
 * 実施できるやりたいことが無いときも手が止まらないよう、二択・細分化そのものを一歩として案内する。
 * - task      : 実施する葉タスク
 * - compare   : 二択で選ぶ（実施できる葉が無い。task は null）
 * - breakdown : 細分化する（優先度は確定済み。task が対象）
 * - empty     : やりたいことが未登録
 */
export type TodayStepKind = 'task' | 'compare' | 'breakdown' | 'empty'

/** 今日の一歩 1 件と、ルートから task の親までのパンくず。 */
export interface TodayStep {
  kind: TodayStepKind
  task: Task | null
  path: TaskPathItem[]
}

export interface ComparisonPair {
  left: Task
  right: Task
}

export type TaskLogResult = 'done' | 'partial' | 'skipped'

/** 記録した端末。Web / iPhone / Apple Watch で値を分けて集計できるようにしている。 */
export type TaskLogSource = 'web' | 'mobile' | 'watch'

export interface TaskLogInput {
  task_id: number
  started_at: string
  result: TaskLogResult
  elapsed_seconds?: number
  source: TaskLogSource
}

export interface Dashboard {
  today_recommendation: Task | null
  top_tasks: Task[]
  completed_this_week: number
  comparison_count: number
  streak_days: number
}

export interface ScheduleBlock {
  id: number
  task_id: number | null
  title: string
  /** 0=日 〜 6=土。特定の日付ではなく毎週繰り返す型として持つ。 */
  day_of_week: number
  /** 0:00 からの経過分（0〜1439） */
  start_minute: number
  /** 0:00 からの経過分（1〜1440。1440 = 24:00） */
  end_minute: number
  duration_minutes: number
  /** 「スキマ」指定。ON なら開始時刻に「今日の一歩」を通知する。 */
  notify_at_start: boolean
  created_at: string
  updated_at: string
}

export interface ScheduleBlockInput {
  title: string
  day_of_week: number
  start_minute: number
  end_minute: number
  task_id?: number | null
  notify_at_start?: boolean
}

/** 予定の塗り残し。この開始時刻に「今日の一歩」がリマインドされる。 */
export interface FreeSlot {
  start_minute: number
  end_minute: number
  duration_minutes: number
}

export interface FreeSlots {
  day_of_week: number
  min_gap_minutes: number
  window_start_minute: number
  window_end_minute: number
  slots: FreeSlot[]
}

/** 予定タイトルの「よく使う項目」。既定の項目は id を持たず、削除もできない。 */
export interface TitlePreset {
  id: number | null
  label: string
  is_default: boolean
}

export interface ReminderSettings {
  /** これより短い隙間ではリマインドしない。 */
  reminder_min_gap_minutes: number
  reminder_window_start_minute: number
  reminder_window_end_minute: number
}

export type DevicePlatform = 'ios' | 'android' | 'watchos'

// ---- 履歴書 --------------------------------------------------------------------

/** 今の履歴書（current）か、なりたい将来の履歴書（future）か。 */
export type ResumeTimeline = 'current' | 'future'

/** 学歴・職歴・免許資格。JIS 様式では学歴と職歴は同じ欄に見出しを分けて書く。 */
export type ResumeEntryKind = 'education' | 'work' | 'license'

export interface ResumeEntry {
  id: number
  timeline: ResumeTimeline
  kind: ResumeEntryKind
  year: number
  /** 1〜12。未入力なら null（年だけ書く）。 */
  month: number | null
  content: string
  /** 将来の行が目標として結んでいる「やりたいこと」のルートタスク。タスクを消すと null。 */
  task_id: number | null
  created_at: string
  updated_at: string
}

export interface ResumeEntryInput {
  timeline: ResumeTimeline
  kind: ResumeEntryKind
  year: number
  month: number | null
  content: string
}

/** 履歴書の個人情報・自由記述。どの項目も任意（未入力は null）。 */
export interface ResumeProfile {
  name: string | null
  name_kana: string | null
  /** YYYY-MM-DD */
  birth_date: string | null
  gender: string | null
  postal_code: string | null
  address: string | null
  address_kana: string | null
  phone: string | null
  email: string | null
  contact_postal_code: string | null
  contact_address: string | null
  contact_phone: string | null
  motivation: string | null
  self_pr: string | null
  requests: string | null
  commute_minutes: number | null
  dependents_count: number | null
  has_spouse: boolean | null
  spouse_dependent: boolean | null
}

export interface Resume {
  profile: ResumeProfile
  entries: ResumeEntry[]
}
