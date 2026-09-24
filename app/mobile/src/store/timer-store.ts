import { create } from 'zustand'

interface TimerTask {
  id: number
  title: string
  durationMinutes: number
}

interface TimerState {
  task: TimerTask | null
  startedAt: string | null
  /** 「終了する」を押した時刻（ms）。画面を閉じて開き直しても結果入力から再開できるよう store に持つ。 */
  stoppedAt: number | null
  start: (task: TimerTask) => void
  stop: () => void
  clear: () => void
}

export const useTimerStore = create<TimerState>((set) => ({
  task: null,
  startedAt: null,
  stoppedAt: null,
  start: (task) => set({ task, startedAt: new Date().toISOString(), stoppedAt: null }),
  stop: () => set((state) => ({ stoppedAt: state.stoppedAt ?? Date.now() })),
  clear: () => set({ task: null, startedAt: null, stoppedAt: null }),
}))
