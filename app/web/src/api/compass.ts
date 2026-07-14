import { apiRequest } from '../lib/api-client'
import type { Task } from './types'

interface Envelope<T> {
  data: T
}

export function fetchTodayRecommendation() {
  return apiRequest<Envelope<Task | null>>('/compass/today').then((res) => res.data)
}
