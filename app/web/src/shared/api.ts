import { apiData, apiRequest } from './api-client'
import type {
  ComparisonPair,
  Dashboard,
  DevicePlatform,
  FreeSlots,
  ReminderSettings,
  Resume,
  ResumeEntry,
  ResumeEntryInput,
  ResumeProfile,
  ScheduleBlock,
  ScheduleBlockInput,
  Task,
  TaskInput,
  TaskLogInput,
  TaskPathItem,
  TaskUpdate,
  TitlePreset,
  TodayStep,
  TodayStepKind,
  User,
} from './types'

// ---- 認証 ------------------------------------------------------------------

interface AuthResponse {
  user: User
  token: string
}

export function register(input: { name: string; email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input })
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input })
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' })
}

// ---- やりたいこと（タスクツリー） --------------------------------------------

/** 既定はルートだけを rating 降順（= ランキング）。'all' でサブタスクを含む全件。 */
export function fetchTasks(scope?: 'all') {
  return apiData<Task[]>('/tasks', { params: { scope } })
}

export function createTask(input: TaskInput) {
  return apiData<Task>('/tasks', { method: 'POST', body: input })
}

export function updateTask(id: number, input: TaskUpdate) {
  return apiData<Task>(`/tasks/${id}`, { method: 'PATCH', body: input })
}

export function deleteTask(id: number) {
  return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' })
}

// ---- 二択比較 -----------------------------------------------------------------

/** 「あとで決める」で飛ばしたペアを除いて、次に比べるペアを返す。 */
export function fetchNextPair(excludePairs: readonly (readonly [number, number])[]) {
  return apiData<ComparisonPair | null>('/comparisons/next', {
    params: { exclude: excludePairs.map(([a, b]) => `${a}_${b}`) },
  })
}

export function submitComparison(input: { winner_task_id: number; loser_task_id: number }) {
  return apiRequest<void>('/comparisons', { method: 'POST', body: input })
}

// ---- 今日の一歩・実施記録・ダッシュボード ------------------------------------

export async function fetchTodayStep(): Promise<TodayStep> {
  const res = await apiRequest<{ kind?: TodayStepKind; data: Task | null; path: TaskPathItem[] }>('/compass/today')

  // kind は後から足したので、返ってこない古い API でも task の有無から決める。
  return { kind: res.kind ?? (res.data ? 'task' : 'empty'), task: res.data, path: res.path }
}

export function createTaskLog(input: TaskLogInput) {
  return apiRequest<void>('/task-logs', { method: 'POST', body: input })
}

export function fetchDashboard() {
  return apiData<Dashboard>('/dashboard')
}

// ---- 週間タイムテーブル -------------------------------------------------------

/** 曜日を省略すると 1 週間ぶん全件（曜日 → 開始時刻順）。 */
export function fetchScheduleBlocks(dayOfWeek?: number) {
  return apiData<ScheduleBlock[]>('/schedule-blocks', { params: { day_of_week: dayOfWeek } })
}

export function fetchFreeSlots(dayOfWeek: number) {
  return apiData<FreeSlots>('/schedule-blocks/free-slots', { params: { day_of_week: dayOfWeek } })
}

export function createScheduleBlock(input: ScheduleBlockInput) {
  return apiData<ScheduleBlock>('/schedule-blocks', { method: 'POST', body: input })
}

export function updateScheduleBlock(id: number, input: Partial<ScheduleBlockInput>) {
  return apiData<ScheduleBlock>(`/schedule-blocks/${id}`, { method: 'PATCH', body: input })
}

export function deleteScheduleBlock(id: number) {
  return apiRequest<void>(`/schedule-blocks/${id}`, { method: 'DELETE' })
}

/** 既定の項目（削除不可）＋自分で登録した項目を、この並び順で返す。 */
export function fetchTitlePresets() {
  return apiData<TitlePreset[]>('/title-presets')
}

export function createTitlePreset(label: string) {
  return apiData<TitlePreset>('/title-presets', { method: 'POST', body: { label } })
}

export function deleteTitlePreset(id: number) {
  return apiRequest<void>(`/title-presets/${id}`, { method: 'DELETE' })
}

export function fetchReminderSettings() {
  return apiData<ReminderSettings>('/reminder-settings')
}

export function updateReminderSettings(input: Partial<ReminderSettings>) {
  return apiData<ReminderSettings>('/reminder-settings', { method: 'PATCH', body: input })
}

// ---- 履歴書 -------------------------------------------------------------------

export function fetchResume() {
  return apiData<Resume>('/resume')
}

export function updateResumeProfile(input: Partial<ResumeProfile>) {
  return apiData<ResumeProfile>('/resume/profile', { method: 'PATCH', body: input })
}

/** 将来の行は、同名の「やりたいこと」（ルートタスク）も一緒に作られる。 */
export function createResumeEntry(input: ResumeEntryInput) {
  return apiData<ResumeEntry>('/resume/entries', { method: 'POST', body: input })
}

export function updateResumeEntry(id: number, input: Partial<Omit<ResumeEntryInput, 'timeline'>>) {
  return apiData<ResumeEntry>(`/resume/entries/${id}`, { method: 'PATCH', body: input })
}

/** 将来の行を達成した → 今の履歴書へ移す（結んだタスクは archived になる）。 */
export function achieveResumeEntry(id: number) {
  return apiData<ResumeEntry>(`/resume/entries/${id}/achieve`, { method: 'POST' })
}

/** タスクを消した将来の行に、もう一度「やりたいこと」を作って結ぶ。 */
export function createResumeEntryTask(id: number) {
  return apiData<ResumeEntry>(`/resume/entries/${id}/task`, { method: 'POST' })
}

/** 行だけを消す。結んだ「やりたいこと」は残る。 */
export function deleteResumeEntry(id: number) {
  return apiRequest<void>(`/resume/entries/${id}`, { method: 'DELETE' })
}

// ---- プッシュ通知 -------------------------------------------------------------

export function registerDeviceToken(input: { platform: DevicePlatform; token: string }) {
  return apiRequest<void>('/devices', { method: 'POST', body: input })
}
