import { Platform } from 'react-native'
import { updateApplicationContext } from 'react-native-watch-connectivity'
import type { Task } from '../api/types'
import { DEFAULT_DURATION_MINUTES } from '../store/timer-store'

interface WatchTodayStep {
  taskId: number
  title: string
  durationMinutes: number
}

interface WatchContext {
  token: string | null
  todayStep: WatchTodayStep | null
}

// WCSession's updateApplicationContext replaces the whole dictionary on
// every call, so token/todayStep must always be sent together.
let current: WatchContext = { token: null, todayStep: null }

function push() {
  if (Platform.OS !== 'ios') return
  updateApplicationContext({ ...current })
}

export function syncAuthToWatch(token: string | null): void {
  current = { ...current, token }
  push()
}

export function syncTodayStepToWatch(task: Task | null | undefined): void {
  current = {
    ...current,
    todayStep: task
      ? {
          taskId: task.id,
          title: task.title,
          durationMinutes: task.duration_minutes ?? DEFAULT_DURATION_MINUTES,
        }
      : null,
  }
  push()
}
