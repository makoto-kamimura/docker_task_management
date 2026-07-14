import { apiRequest } from '../lib/api-client'
import type { Task } from './types'

interface DashboardData {
  today_recommendation: Task | null
  top_tasks: Task[]
  completed_this_week: number
  comparison_count: number
  streak_days: number
}

interface Envelope<T> {
  data: T
}

export function fetchDashboard() {
  return apiRequest<Envelope<DashboardData>>('/dashboard').then((res) => res.data)
}
