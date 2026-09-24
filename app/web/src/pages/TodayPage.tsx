import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, GitCompareArrows, ListTree } from 'lucide-react'
import { updateTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCREENS, TODAY } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import { findBreakdownItem, formatPath } from '@shared/tasks'
import { durationOf } from '@shared/timer'
import { useSessionStore } from '../store/session-store'
import { useTimerStore } from '../store/timer-store'
import { PageTitle } from '../components/PageTitle'
import { BreakdownCard } from '../components/today/BreakdownCard'
import { CompareBoard } from '../components/today/CompareBoard'
import { SessionBanner } from '../components/today/SessionBanner'
import { SCREEN_PATHS } from '../lib/routes'

/**
 * 今日の一歩。利用フロー 3 のループをこの 1 画面で回す。
 *   実施できるやりたいこと → 開始する / 15分でできない（＝次のやりたいこと）
 *   実施できるものが無い   → 二択で選ぶ
 *   優先度が確定した       → やりたいことの細分化
 * どれも終わるたびに API が次の一歩を選び直すので、15分の残りがある限りここへ戻ってくる。
 */
export function TodayPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startTimer = useTimerStore((state) => state.start)
  const startSession = useSessionStore((state) => state.startIfIdle)
  const { data, isLoading } = useQuery(queries.todayStep())

  const breakdownMutation = useMutation({
    mutationFn: (id: number) => updateTask(id, { needs_breakdown: true }),
    onSuccess: () => invalidate(queryClient, invalidates.task),
  })

  const kind = data?.kind ?? 'empty'
  const task = data?.task ?? null
  const path = data?.path ?? []

  // 細分化のときだけ、対象タスクの子を出すためにツリーを使う。
  const { data: tasks } = useQuery({ ...queries.taskTree(), enabled: kind === 'breakdown' })
  const breakdownItem = useMemo(() => findBreakdownItem(tasks ?? [], task?.id), [tasks, task?.id])

  function handleStart() {
    if (!task) return
    startSession()
    startTimer({ id: task.id, title: task.title, durationMinutes: durationOf(task) })
    navigate('/timer')
  }

  return (
    <div className="page page-medium">
      <PageTitle icon={Compass}>{SCREENS.today.title}</PageTitle>
      <SessionBanner />

      {isLoading && <p>{COMMON.loading}</p>}

      {!isLoading && kind === 'task' && task && (
        <div className="card today-card">
          {path.length > 0 && <p className="step-path">{formatPath(path)}</p>}
          <h2>{task.title}</h2>
          <p className="muted-text">{durationOf(task)}分</p>
          <div className="button-row">
            <button className="button" onClick={handleStart}>
              {TODAY.start}
            </button>
            <button
              className="button-secondary"
              onClick={() => breakdownMutation.mutate(task.id)}
              disabled={breakdownMutation.isPending}
            >
              {TODAY.breakdown}
            </button>
          </div>
          <p className="hint-text">{TODAY.breakdownHint}</p>
          {breakdownMutation.isError && (
            <p className="error-text">{errorMessage(breakdownMutation.error, COMMON.saveFailed)}</p>
          )}
        </div>
      )}

      {!isLoading && kind === 'compare' && (
        <div className="card today-card today-card-flow">
          <p className="title-with-icon step-kind">
            <GitCompareArrows size={16} aria-hidden="true" />
            {SCREENS.compare.nav}
          </p>
          <h2>{SCREENS.compare.title}</h2>
          <p className="hint-text">{TODAY.compareLead}</p>
          <CompareBoard onChoose={startSession} />
        </div>
      )}

      {!isLoading && kind === 'breakdown' && (
        <div className="card today-card today-card-flow">
          <p className="title-with-icon step-kind">
            <ListTree size={16} aria-hidden="true" />
            {SCREENS.todo.nav}
          </p>
          {path.length > 0 && <p className="step-path">{formatPath(path)}</p>}
          <h2>{task?.title ?? SCREENS.todo.title}</h2>
          <p className="hint-text">{TODAY.breakdownLead}</p>
          {breakdownItem ? (
            <ul className="task-tree">
              <BreakdownCard item={breakdownItem} defaultOpen onDone={startSession} />
            </ul>
          ) : (
            <p>{COMMON.loading}</p>
          )}
        </div>
      )}

      {!isLoading && kind === 'empty' && (
        <div className="card today-card">
          <h2>{SCREENS.today.title}</h2>
          <p>{TODAY.empty}</p>
          <ol className="flow-list">
            {TODAY.flow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="button-row">
            <Link className="button" to={SCREEN_PATHS.tasks}>
              {TODAY.emptyAction}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
