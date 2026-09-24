import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListTree } from 'lucide-react'
import { COMMON, SCREENS, TODO } from '@shared/copy'
import { queries } from '@shared/queries'
import { buildBreakdownItems } from '@shared/tasks'
import { BreakdownCard } from '../components/today/BreakdownCard'
import { PageTitle } from '../components/PageTitle'

/**
 * やりたいことの細分化（単独で開いたとき）。ふだんは優先度が確定した時点で
 * 「今日の一歩」の中に 1 件ずつ出るが、まとめて分解したいとき用に URL は残してある。
 */
export function TodoPage() {
  const { data: tasks, isLoading } = useQuery(queries.taskTree())
  const items = useMemo(() => buildBreakdownItems(tasks ?? []), [tasks])

  return (
    <div className="page">
      <PageTitle icon={ListTree}>{SCREENS.todo.title}</PageTitle>
      <p className="hint-text">{TODO.description}</p>

      {isLoading && <p>{COMMON.loading}</p>}
      {!isLoading && items.length === 0 && <p>{TODO.empty}</p>}

      {items.length > 0 && (
        <ul className="task-tree card-grid">
          {items.map((item) => (
            <BreakdownCard key={item.task.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
