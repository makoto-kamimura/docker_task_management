import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNextPair, submitComparison } from '../api/comparisons'

export function ComparePage() {
  const queryClient = useQueryClient()
  const [excludePairs, setExcludePairs] = useState<[number, number][]>([])

  const { data: pair, isLoading } = useQuery({
    queryKey: ['comparisons-next', excludePairs],
    queryFn: () => fetchNextPair(excludePairs),
  })

  const mutation = useMutation({
    mutationFn: submitComparison,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['comparisons-next'] })
    },
  })

  const choose = useCallback(
    (winnerId: number, loserId: number) => {
      mutation.mutate({ winner_task_id: winnerId, loser_task_id: loserId })
    },
    [mutation],
  )

  const skip = useCallback(() => {
    if (!pair) return
    setExcludePairs((prev) => [...prev, [pair.left.id, pair.right.id]])
  }, [pair])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (!pair || mutation.isPending) return
      if (event.key === 'ArrowLeft') choose(pair.left.id, pair.right.id)
      if (event.key === 'ArrowRight') choose(pair.right.id, pair.left.id)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [pair, mutation.isPending, choose])

  if (isLoading) {
    return (
      <div className="page">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!pair) {
    return (
      <div className="page">
        <h1>どちらが今重要？</h1>
        <p>比較するには「やりたいこと」を2件以上登録してください。</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>どちらが今重要？</h1>
      <div className="compare-row">
        <button
          className="compare-card"
          disabled={mutation.isPending}
          onClick={() => choose(pair.left.id, pair.right.id)}
        >
          {pair.left.title}
        </button>
        <button
          className="compare-card"
          disabled={mutation.isPending}
          onClick={() => choose(pair.right.id, pair.left.id)}
        >
          {pair.right.title}
        </button>
      </div>
      <button className="button-secondary" onClick={skip} disabled={mutation.isPending}>
        あとで決める
      </button>
      <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>← / → キーでも選べます</p>
    </div>
  )
}
