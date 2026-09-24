import type { Task, TaskLogResult } from './types'

/**
 * 所要時間が未設定のタスクに使う長さ。「今日の一歩」は 15〜30 分で終わる粒度にする前提なので短い方に合わせる。
 * Apple Watch（app/mobile/targets/_shared/Models.swift の TodayStep.defaultDurationMinutes）も同じ値を使う。
 */
export const DEFAULT_DURATION_MINUTES = 15

export function durationOf(task: Pick<Task, 'duration_minutes'>): number {
  return task.duration_minutes ?? DEFAULT_DURATION_MINUTES
}

export interface TimerSnapshot {
  remainingSeconds: number
  elapsedSeconds: number
  isFinished: boolean
}

/**
 * 開始時刻からの経過で残り時間を出す。1 秒ごとに減算する方式だと、画面を離れたりアプリが
 * バックグラウンドに回ったりしている間に止まってずれるため、壁時計との差で毎回求め直す。
 *
 * @param stoppedAt 「終了する」を押した時刻。押していなければ null（now まで経過したものとして扱う）
 */
export function timerSnapshot(
  startedAt: string,
  durationMinutes: number,
  stoppedAt: number | null,
  now: number,
): TimerSnapshot {
  const totalSeconds = Math.max(durationMinutes, 1) * 60
  const until = stoppedAt ?? now
  const elapsedSeconds = Math.min(totalSeconds, Math.max(0, Math.floor((until - Date.parse(startedAt)) / 1000)))

  return {
    remainingSeconds: totalSeconds - elapsedSeconds,
    elapsedSeconds,
    isFinished: stoppedAt !== null || elapsedSeconds >= totalSeconds,
  }
}

/** 残り時間の表示（MM:SS）。 */
export function formatClock(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0')

  return `${minutes}:${seconds}`
}

/** 結果入力の選択肢。並び順と文言は Web / iPhone / Apple Watch で共通。 */
export const TASK_LOG_RESULTS: readonly { result: TaskLogResult; label: string }[] = [
  { result: 'done', label: '完了' },
  { result: 'partial', label: '少しだけ' },
  { result: 'skipped', label: 'また今度' },
]
