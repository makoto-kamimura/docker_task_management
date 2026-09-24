/**
 * TanStack Query のキーと取得関数、更新後に取り直す範囲。
 * 画面ごとに invalidate する範囲がずれると、端末によって古い表示が残る差が出るので、ここで一元管理する。
 * （このディレクトリは Web とモバイルで共有するため、npm パッケージを import しない）
 */
import {
  fetchDashboard,
  fetchFreeSlots,
  fetchNextPair,
  fetchReminderSettings,
  fetchResume,
  fetchScheduleBlocks,
  fetchTasks,
  fetchTitlePresets,
  fetchTodayStep,
} from './api'

export const queryKeys = {
  todayStep: ['compass-today'],
  /** ルートだけのランキング。['tasks'] は taskTree も含めた前方一致の起点にもなる。 */
  tasks: ['tasks'],
  taskTree: ['tasks', 'tree'],
  comparisonNext: ['comparisons-next'],
  dashboard: ['dashboard'],
  scheduleWeek: ['schedule-blocks', 'week'],
  freeSlots: ['free-slots'],
  reminderSettings: ['reminder-settings'],
  titlePresets: ['title-presets'],
  resume: ['resume'],
} as const

export const queries = {
  todayStep: () => ({ queryKey: queryKeys.todayStep, queryFn: fetchTodayStep }),
  ranking: () => ({ queryKey: queryKeys.tasks, queryFn: () => fetchTasks() }),
  taskTree: () => ({ queryKey: queryKeys.taskTree, queryFn: () => fetchTasks('all') }),
  comparisonNext: (excludePairs: readonly (readonly [number, number])[]) => ({
    queryKey: [...queryKeys.comparisonNext, excludePairs],
    queryFn: () => fetchNextPair(excludePairs),
  }),
  dashboard: () => ({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard }),
  /** 1 週間ぶんまとめて取る。曜日タブの集計と、曜日をまたいだ色の統一に要る。 */
  scheduleWeek: () => ({ queryKey: queryKeys.scheduleWeek, queryFn: () => fetchScheduleBlocks() }),
  freeSlots: (dayOfWeek: number) => ({
    queryKey: [...queryKeys.freeSlots, dayOfWeek],
    queryFn: () => fetchFreeSlots(dayOfWeek),
  }),
  reminderSettings: () => ({ queryKey: queryKeys.reminderSettings, queryFn: fetchReminderSettings }),
  titlePresets: () => ({ queryKey: queryKeys.titlePresets, queryFn: fetchTitlePresets }),
  resume: () => ({ queryKey: queryKeys.resume, queryFn: fetchResume }),
}

/**
 * 更新の種類ごとに、取り直す必要があるクエリ。
 * たとえば二択の回答は rating を変えるので、ランキングだけでなく今日の一歩とダッシュボードにも効く。
 */
export const invalidates = {
  /**
   * やりたいことの追加・削除・分解。予定や将来の履歴書との紐付け（task_id）も消えうるので、
   * 時間割と履歴書も取り直す。
   */
  task: [
    queryKeys.tasks,
    queryKeys.todayStep,
    queryKeys.dashboard,
    queryKeys.comparisonNext,
    queryKeys.scheduleWeek,
    queryKeys.resume,
  ],
  /** 将来の履歴書の行は「やりたいこと」を作る・名前を変える・archived にするので、タスク側も取り直す。 */
  resume: [
    queryKeys.resume,
    queryKeys.tasks,
    queryKeys.todayStep,
    queryKeys.dashboard,
    queryKeys.comparisonNext,
  ],
  resumeProfile: [queryKeys.resume],
  comparison: [queryKeys.tasks, queryKeys.comparisonNext, queryKeys.todayStep, queryKeys.dashboard],
  /** 実施記録は last_done_at を更新し、次の「今日の一歩」と継続日数を変える。 */
  taskLog: [queryKeys.tasks, queryKeys.todayStep, queryKeys.dashboard],
  schedule: [queryKeys.scheduleWeek, queryKeys.freeSlots],
  reminderSettings: [queryKeys.reminderSettings, queryKeys.freeSlots],
  titlePresets: [queryKeys.titlePresets],
} as const

/** QueryClient のうち、ここで使う部分だけ（共有ディレクトリから npm パッケージを参照しないため）。 */
interface QueryInvalidator {
  invalidateQueries(filters: { queryKey: readonly unknown[] }): Promise<unknown>
}

export function invalidate(client: QueryInvalidator, keys: readonly (readonly unknown[])[]): Promise<unknown[]> {
  return Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })))
}
