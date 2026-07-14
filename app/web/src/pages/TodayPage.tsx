import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchTodayRecommendation } from '../api/compass'
import { useTimerStore, DEFAULT_DURATION_MINUTES } from '../store/timer-store'

export function TodayPage() {
  const navigate = useNavigate()
  const startTimer = useTimerStore((state) => state.start)
  const { data: task, isLoading } = useQuery({
    queryKey: ['compass-today'],
    queryFn: fetchTodayRecommendation,
  })

  function handleStart() {
    if (!task) return
    startTimer({
      id: task.id,
      title: task.title,
      durationMinutes: task.duration_minutes ?? DEFAULT_DURATION_MINUTES,
    })
    navigate('/timer')
  }

  return (
    <div className="page">
      <h1>🧭 今日の一歩</h1>
      {isLoading && <p>読み込み中...</p>}
      {!isLoading && !task && <p>やりたいことを2件以上登録すると、おすすめが表示されます。</p>}
      {task && (
        <div className="card">
          <h2>{task.title}</h2>
          <p style={{ opacity: 0.7 }}>{task.duration_minutes ?? DEFAULT_DURATION_MINUTES}分</p>
          <button className="button" onClick={handleStart}>
            開始する
          </button>
        </div>
      )}
    </div>
  )
}
