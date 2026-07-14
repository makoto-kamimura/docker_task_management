import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../api/dashboard'

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })

  if (isLoading || !data) {
    return (
      <div className="page">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>ダッシュボード</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>今日のおすすめ</h2>
        <p>{data.today_recommendation ? data.today_recommendation.title : 'おすすめはまだありません'}</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>TOP10</h2>
        <ol className="rank-list">
          {data.top_tasks.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ display: 'flex', gap: 24 }}>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{data.completed_this_week}</p>
          <p style={{ opacity: 0.7 }}>今週完了数</p>
        </div>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{data.comparison_count}</p>
          <p style={{ opacity: 0.7 }}>比較回数</p>
        </div>
        <div>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{data.streak_days}</p>
          <p style={{ opacity: 0.7 }}>継続日数</p>
        </div>
      </div>
    </div>
  )
}
