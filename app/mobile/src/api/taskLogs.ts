import { apiRequest } from '../lib/api-client'

export type TaskLogResult = 'done' | 'partial' | 'skipped'

export function createTaskLog(input: {
  task_id: number
  started_at: string
  result: TaskLogResult
  elapsed_seconds?: number
  source: 'mobile'
}) {
  return apiRequest<void>('/task-logs', { method: 'POST', body: input })
}
