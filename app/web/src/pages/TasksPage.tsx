import { useQuery } from '@tanstack/react-query'
import { fetchTasks } from '../api/tasks'
import { TaskForm } from '../components/TaskForm'

export function TasksPage() {
  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })

  return (
    <div className="page">
      <h1>やりたいこと登録</h1>
      <TaskForm />
      {isLoading && <p>読み込み中...</p>}
      {tasks && (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
