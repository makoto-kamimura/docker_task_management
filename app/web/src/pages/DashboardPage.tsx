import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { COMMON, DASHBOARD, SCREENS } from '@shared/copy'
import { queries } from '@shared/queries'
import { formatRating, rankTasks } from '@shared/tasks'
import { PageTitle } from '../components/PageTitle'

export function DashboardPage() {
  const { data, isLoading } = useQuery(queries.dashboard())
  const { data: tasks, isLoading: isRankingLoading } = useQuery(queries.ranking())
  const ranking = useMemo(() => rankTasks(tasks ?? []), [tasks])

  return (
    <div className="page">
      <PageTitle>{SCREENS.dashboard.title}</PageTitle>
      {isLoading && <p>{COMMON.loading}</p>}

      {/* 広い画面では左に今日のおすすめと数字、右にランキングを並べる。 */}
      <div className="dashboard-grid">
        <div className="dashboard-summary">
          {data && (
            <>
              <div className="card">
                <h2>{DASHBOARD.recommendation}</h2>
                <p>{data.today_recommendation?.title ?? DASHBOARD.noRecommendation}</p>
              </div>

              <div className="stat-row">
                {[
                  { label: DASHBOARD.completedThisWeek, value: data.completed_this_week },
                  { label: DASHBOARD.comparisonCount, value: data.comparison_count },
                  { label: DASHBOARD.streakDays, value: data.streak_days },
                ].map((stat) => (
                  <div key={stat.label} className="card stat-tile">
                    <p className="stat-value">{stat.value}</p>
                    <p className="muted-text">{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2>{DASHBOARD.ranking}</h2>
          {isRankingLoading && <p>{COMMON.loading}</p>}
          {!isRankingLoading && ranking.length === 0 && <p>{DASHBOARD.rankingEmpty}</p>}
          {ranking.length > 0 && (
            <ol className="rank-list">
              {ranking.map((task) => (
                <li key={task.id}>
                  <span>{task.title}</span>
                  <span className="rank-score">{formatRating(task.rating)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
