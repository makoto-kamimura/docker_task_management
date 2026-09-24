import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Sparkles, CheckCircle2, Clock, XCircle, type LucideIcon } from 'lucide-react'
import { createTaskLog } from '@shared/api'
import { TIMER } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import { TASK_LOG_RESULTS, formatClock, timerSnapshot } from '@shared/timer'
import type { TaskLogResult } from '@shared/types'
import { useTimerStore } from '../store/timer-store'

const RESULT_ICONS: Record<TaskLogResult, LucideIcon> = {
  done: CheckCircle2,
  partial: Clock,
  skipped: XCircle,
}

export function TimerPage() {
  const queryClient = useQueryClient()
  const { task, startedAt, stoppedAt, stop, clear } = useTimerStore()
  const [now, setNow] = useState(() => Date.now())

  const snapshot = task && startedAt ? timerSnapshot(startedAt, task.durationMinutes, stoppedAt, now) : null
  const isFinished = snapshot?.isFinished ?? false

  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [isFinished])

  const mutation = useMutation({
    mutationFn: createTaskLog,
    onSuccess: () => {
      invalidate(queryClient, invalidates.taskLog)
      // store を空にすると下の Navigate で今日の一歩へ戻る。iPhone / Apple Watch も結果入力のあとは今日の一歩に戻る。
      clear()
    },
  })

  if (!task || !startedAt || !snapshot) {
    return <Navigate to="/today" replace />
  }

  function submitResult(result: TaskLogResult) {
    if (!task || !startedAt || !snapshot) return
    mutation.mutate({
      task_id: task.id,
      started_at: startedAt,
      result,
      elapsed_seconds: snapshot.elapsedSeconds,
      source: 'web',
    })
  }

  return (
    <div className="page page-medium">
      <h1>{task.title}</h1>
      {!isFinished && (
        <div className="card timer-card">
          <p className="timer-clock">{formatClock(snapshot.remainingSeconds)}</p>
          <button className="button-secondary" onClick={stop}>
            {TIMER.stop}
          </button>
        </div>
      )}
      {isFinished && (
        <div className="card timer-card">
          <p className="title-with-icon timer-prompt">
            <Sparkles size={18} aria-hidden="true" />
            {TIMER.prompt}
          </p>
          <div className="button-row button-row-center">
            {TASK_LOG_RESULTS.map(({ result, label }, index) => {
              const Icon = RESULT_ICONS[result]

              return (
                <button
                  key={result}
                  className={`${index === 0 ? 'button' : 'button-secondary'} title-with-icon`}
                  disabled={mutation.isPending}
                  onClick={() => submitResult(result)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>
          {mutation.isError && <p className="error-text">{TIMER.submitFailed}</p>}
        </div>
      )}
    </div>
  )
}
