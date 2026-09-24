import { Platform } from 'react-native'
import type { TodayStep, TodayStepKind } from '@shared/types'
import { durationOf } from '@shared/timer'

// react-native-watch-connectivity は TurboModuleRegistry.getEnforcing() を
// モジュール読み込み時に同期実行するため、ネイティブモジュールが存在しない環境
// (Expo Go・Android 実機・シミュレータ等)では import した瞬間に例外を投げてアプリ全体が
// クラッシュする。ネイティブビルド以外でも安全に動くよう遅延 require + try/catch で無効化する。
type UpdateApplicationContext = (context: Record<string, unknown>) => void
let updateApplicationContext: UpdateApplicationContext | null = null
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    updateApplicationContext = require('react-native-watch-connectivity').updateApplicationContext
  } catch {
    updateApplicationContext = null
  }
}

/** Watch 側（targets/watch/PhoneConnector.swift）が読むキー。名前を変えるときは両方直す。 */
interface WatchTodayStep {
  taskId: number
  title: string
  durationMinutes: number
  /** ルートから葉の親までのタイトル（パンくず）。 */
  path: string[]
}

interface WatchContext {
  /** iPhone と同じサーバーを Watch から直接呼べるように、ベース URL も渡す。 */
  apiBaseUrl: string
  token: string | null
  todayStep: WatchTodayStep | null
  /** 一歩が無いときに Watch が何を案内するか（二択 / 細分化）。targets/_shared/Models.swift の TodayStepKind。 */
  todayStepKind: TodayStepKind
}

// WCSession's updateApplicationContext replaces the whole dictionary on
// every call, so every key must always be sent together.
let current: WatchContext = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  token: null,
  todayStep: null,
  todayStepKind: 'empty',
}

function push() {
  const update = updateApplicationContext
  if (Platform.OS !== 'ios' || !update) return
  update({ ...current })
}

export function syncAuthToWatch(token: string | null): void {
  current = { ...current, token }
  push()
}

export function syncTodayStepToWatch(step: TodayStep | undefined): void {
  // Watch はタイマーで実施する一歩だけを扱う。二択・細分化は kind だけ伝えて案内を出してもらう。
  const task = step?.kind === 'task' ? step.task : null
  current = {
    ...current,
    todayStepKind: step?.kind ?? 'empty',
    todayStep: task
      ? {
          taskId: task.id,
          title: task.title,
          durationMinutes: durationOf(task),
          path: (step?.path ?? []).map((item) => item.title),
        }
      : null,
  }
  push()
}
