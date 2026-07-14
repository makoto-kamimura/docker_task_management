import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTimerStore } from '../store/timer-store'
import { createTaskLog, type TaskLogResult } from '../api/taskLogs'

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function TimerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { task, startedAt, clear } = useTimerStore()
  const totalSeconds = (task?.durationMinutes ?? 0) * 60
  const [remaining, setRemaining] = useState(totalSeconds)
  const [finished, setFinished] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!task || finished) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [task, finished])

  const mutation = useMutation({
    mutationFn: createTaskLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['compass-today'] })
      setSubmitted(true)
      clear()
      navigate('/dashboard')
    },
  })

  if ((!task || !startedAt) && !submitted) {
    return <Navigate to="/today" replace />
  }

  if (!task || !startedAt) {
    return null
  }

  const elapsedSeconds = totalSeconds - remaining

  function submitResult(result: TaskLogResult) {
    if (!task || !startedAt) return
    mutation.mutate({
      task_id: task.id,
      started_at: startedAt,
      result,
      elapsed_seconds: elapsedSeconds,
      source: 'web',
    })
  }

  return (
    <div className="page">
      <h1>{task.title}</h1>
      {!finished && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, margin: '16px 0' }}>{formatTime(remaining)}</p>
          <button className="button-secondary" onClick={() => setFinished(true)}>
            終了する
          </button>
        </div>
      )}
      {finished && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>👏 お疲れ様！ できた？</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button className="button" disabled={mutation.isPending} onClick={() => submitResult('done')}>
              😊 完了
            </button>
            <button
              className="button-secondary"
              disabled={mutation.isPending}
              onClick={() => submitResult('partial')}
            >
              😅 少しだけ
            </button>
            <button
              className="button-secondary"
              disabled={mutation.isPending}
              onClick={() => submitResult('skipped')}
            >
              ❌ また今度
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
