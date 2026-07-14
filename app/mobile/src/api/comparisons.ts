import { apiRequest } from '../lib/api-client'
import type { Task } from './types'

interface NextPairResponse {
  data: { left: Task; right: Task } | null
}

export function fetchNextPair(excludePairs: [number, number][]) {
  return apiRequest<NextPairResponse>('/comparisons/next', {
    params: { exclude: excludePairs.map(([a, b]) => `${a}_${b}`) },
  }).then((res) => res.data)
}

export function submitComparison(input: { winner_task_id: number; loser_task_id: number }) {
  return apiRequest<void>('/comparisons', { method: 'POST', body: input })
}
