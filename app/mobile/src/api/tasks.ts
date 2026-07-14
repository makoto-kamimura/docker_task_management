import { apiRequest } from '../lib/api-client'
import type { DeadlineType, Task, TaskStatus } from './types'

interface Envelope<T> {
  data: T
}

export function fetchTasks() {
  return apiRequest<Envelope<Task[]>>('/tasks').then((res) => res.data)
}

export function createTask(input: { title: string }) {
  return apiRequest<Envelope<Task>>('/tasks', { method: 'POST', body: input }).then((res) => res.data)
}

export function updateTask(
  id: number,
  input: Partial<{ title: string; duration_minutes: number | null; deadline_type: DeadlineType; status: TaskStatus }>,
) {
  return apiRequest<Envelope<Task>>(`/tasks/${id}`, { method: 'PATCH', body: input }).then((res) => res.data)
}

export function deleteTask(id: number) {
  return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' })
}
