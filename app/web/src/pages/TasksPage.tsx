import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass } from 'lucide-react'
import { deleteTask } from '@shared/api'
import { COMMON, SCREENS, TASKS } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import { buildTaskTree, canAddChild, deleteTaskMessage, isStepLeaf, type TaskTreeNode } from '@shared/tasks'
import { TaskForm } from '../components/TaskForm'
import { SubtaskForm } from '../components/SubtaskForm'
import { PageTitle } from '../components/PageTitle'

function TreeNode({ node }: { node: TaskTreeNode }) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => invalidate(queryClient, invalidates.task),
  })

  function handleDelete() {
    if (window.confirm(deleteTaskMessage(node))) {
      deleteMutation.mutate(node.task.id)
    }
  }

  return (
    <li className="tree-node">
      <div className="tree-row">
        <span className={isStepLeaf(node) ? 'tree-leaf leaf-with-icon' : undefined}>
          {isStepLeaf(node) && <Compass size={14} aria-hidden="true" />}
          {node.task.title}
        </span>
        <span className="tree-actions">
          {canAddChild(node) && (
            <button className="tree-action" type="button" onClick={() => setAdding((v) => !v)}>
              {TASKS.addChild}
            </button>
          )}
          <button className="tree-action" type="button" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {COMMON.delete}
          </button>
        </span>
      </div>
      {adding && <SubtaskForm parentId={node.task.id} onClose={() => setAdding(false)} />}
      {node.children.length > 0 && (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.task.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function TasksPage() {
  const { data: tasks, isLoading } = useQuery(queries.taskTree())
  const roots = useMemo(() => buildTaskTree(tasks ?? []), [tasks])

  return (
    <div className="page">
      <PageTitle>{SCREENS.tasks.title}</PageTitle>
      <div className="layout-aside">
        <aside className="layout-aside-panel">
          <TaskForm />
        </aside>
        <section>
          {isLoading && <p>{COMMON.loading}</p>}
          {!isLoading && roots.length === 0 && <p>{TASKS.empty}</p>}
          {roots.length > 0 && (
            <ul className="task-tree">
              {roots.map((root) => (
                <TreeNode key={root.task.id} node={root} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
