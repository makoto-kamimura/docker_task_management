import { create } from 'zustand'

interface TimerTask {
  id: number
  title: string
  durationMinutes: number
}

interface TimerState {
  task: TimerTask | null
  startedAt: string | null
  start: (task: TimerTask) => void
  clear: () => void
}

export const DEFAULT_DURATION_MINUTES = 15

export const useTimerStore = create<TimerState>((set) => ({
  task: null,
  startedAt: null,
  start: (task) => set({ task, startedAt: new Date().toISOString() }),
  clear: () => set({ task: null, startedAt: null }),
}))
