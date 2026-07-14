export interface User {
  id: number
  name: string
  email: string
}

export type DeadlineType = 'today' | 'week' | 'month' | 'none'
export type TaskStatus = 'active' | 'archived'

export interface Task {
  id: number
  title: string
  duration_minutes: number | null
  deadline_type: DeadlineType
  rating: number
  status: TaskStatus
  last_done_at: string | null
  created_at: string
  updated_at: string
}
