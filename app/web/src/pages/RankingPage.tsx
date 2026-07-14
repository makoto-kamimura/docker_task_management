import { useQuery } from '@tanstack/react-query'
import { fetchTasks } from '../api/tasks'

export function RankingPage() {
  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })

  return (
    <div className="page">
      <h1>ランキング</h1>
      {isLoading && <p>読み込み中...</p>}
      {tasks && tasks.length === 0 && <p>タスクがまだありません。</p>}
      {tasks && tasks.length > 0 && (
        <ol className="rank-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 14 }}>{Math.round(task.rating)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
