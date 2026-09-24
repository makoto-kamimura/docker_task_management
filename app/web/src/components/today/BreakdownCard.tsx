import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTask } from '@shared/api'
import { COMMON, TODO } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import type { BreakdownItem } from '@shared/tasks'
import { SubtaskForm } from '../SubtaskForm'

/**
 * 分解待ち 1 件のカード。「今日の一歩」の細分化（1 件だけ出す）と、
 * 単独の /todo（分解待ちを一覧する）の両方から同じものを使う。
 *
 * @param onDone 「分解完了」を押したことを呼び出し側に伝える（今日の一歩では隙間時間の計測を始める）
 */
export function BreakdownCard({
  item,
  defaultOpen = false,
  onDone,
}: {
  item: BreakdownItem
  defaultOpen?: boolean
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(defaultOpen)

  const doneMutation = useMutation({
    mutationFn: (id: number) => updateTask(id, { needs_breakdown: false }),
    onSuccess: () => invalidate(queryClient, invalidates.task),
  })

  function finish() {
    onDone?.()
    doneMutation.mutate(item.task.id)
  }

  return (
    <li className="tree-node">
      <div className="tree-row">
        <span>{item.task.title}</span>
        <span className="tree-actions">
          <button className="tree-action" type="button" onClick={() => setAdding((v) => !v)}>
            {TODO.split}
          </button>
          {item.children.length > 0 && (
            <button className="tree-action" type="button" onClick={finish} disabled={doneMutation.isPending}>
              {TODO.done}
            </button>
          )}
        </span>
      </div>

      {item.children.length > 0 && (
        <ul className="tree-children">
          {item.children.map((child) => (
            <li key={child.id} className="tree-row">
              <span>{child.title}</span>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <SubtaskForm parentId={item.task.id} onClose={() => setAdding(false)} keepOpen closeLabel={COMMON.close} />
      )}
    </li>
  )
}
