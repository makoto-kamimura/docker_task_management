import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { submitComparison } from '@shared/api'
import { COMMON, COMPARE } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'

/**
 * 二択で選ぶ盤面。「今日の一歩」の中（実施できるやりたいことが無いとき）と、
 * 単独の /compare の両方から同じものを使う。
 *
 * @param onChoose 回答したことを呼び出し側に伝える（今日の一歩では隙間時間の計測を始める）
 */
export function CompareBoard({ onChoose }: { onChoose?: () => void }) {
  const queryClient = useQueryClient()
  // 「あとで決める」で飛ばしたペア。回答として記録せず、次のペアの候補から外すだけ。
  const [excludePairs, setExcludePairs] = useState<[number, number][]>([])
  const { data: pair, isLoading } = useQuery(queries.comparisonNext(excludePairs))

  const mutation = useMutation({
    mutationFn: submitComparison,
    onSuccess: () => invalidate(queryClient, invalidates.comparison),
  })
  const { mutate, isPending } = mutation

  const choose = useCallback(
    (winnerId: number, loserId: number) => {
      onChoose?.()
      mutate({ winner_task_id: winnerId, loser_task_id: loserId })
    },
    [mutate, onChoose],
  )

  function skip() {
    if (!pair) return
    setExcludePairs((prev) => [...prev, [pair.left.id, pair.right.id]])
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!pair || isPending) return
      if (event.key === 'ArrowLeft') choose(pair.left.id, pair.right.id)
      if (event.key === 'ArrowRight') choose(pair.right.id, pair.left.id)
    }
    window.addEventListener('keydown', handleKeydown)

    return () => window.removeEventListener('keydown', handleKeydown)
  }, [pair, isPending, choose])

  if (isLoading) return <p>{COMMON.loading}</p>
  if (!pair) return <p>{COMPARE.needTwo}</p>

  return (
    <>
      <div className="compare-row">
        <button className="compare-card" disabled={isPending} onClick={() => choose(pair.left.id, pair.right.id)}>
          {pair.left.title}
        </button>
        <button className="compare-card" disabled={isPending} onClick={() => choose(pair.right.id, pair.left.id)}>
          {pair.right.title}
        </button>
      </div>
      <button className="button-secondary" onClick={skip} disabled={isPending}>
        {COMPARE.skip}
      </button>
      <p className="hint-text">{COMPARE.keyboardHint}</p>
    </>
  )
}
