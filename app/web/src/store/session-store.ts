import { create } from 'zustand'

/**
 * 隙間時間ひと区切り（15分）の進行。通知から起動して一歩を始めた時点で動きだし、
 * 一歩が終わるたびに「まだ時間があるか」を今日の一歩の画面が判断するのに使う。
 * 残り時間は開始時刻から計算する（@shared/today の sessionSnapshot）ので、ここでは開始時刻だけ持つ。
 */
interface SessionState {
  startedAt: string | null
  /** すでに始まっていれば何もしない。一歩を始める操作のたびに呼んでよい。 */
  startIfIdle: () => void
  /** 使い切ったあとに「もう一歩つづける」で測り直す。 */
  restart: () => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  startedAt: null,
  startIfIdle: () => {
    if (get().startedAt === null) set({ startedAt: new Date().toISOString() })
  },
  restart: () => set({ startedAt: new Date().toISOString() }),
  clear: () => set({ startedAt: null }),
}))
