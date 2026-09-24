import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { submitComparison } from '@shared/api'
import { COMMON, COMPARE } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import type { Task } from '@shared/types'
import { Hint, SecondaryButton } from '../ui'
import { colors } from '../../theme'

/**
 * 二択で選ぶ盤面。「今日の一歩」の中（実施できるやりたいことが無いとき）と、
 * 単独の二択画面の両方から同じものを使う。Web の components/today/CompareBoard.tsx と同じ振る舞い。
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

  function choose(winner: Task, loser: Task) {
    onChoose?.()
    mutation.mutate({ winner_task_id: winner.id, loser_task_id: loser.id })
  }

  function skip() {
    if (!pair) return
    setExcludePairs((prev) => [...prev, [pair.left.id, pair.right.id]])
  }

  if (isLoading) return <ActivityIndicator accessibilityLabel={COMMON.loading} />
  if (!pair) return <Hint>{COMPARE.needTwo}</Hint>

  return (
    <>
      <View style={styles.row}>
        <Pressable
          style={styles.card}
          disabled={mutation.isPending}
          onPress={() => choose(pair.left, pair.right)}
          testID="compare-left"
        >
          <Text style={styles.cardText}>{pair.left.title}</Text>
        </Pressable>
        <Pressable
          style={styles.card}
          disabled={mutation.isPending}
          onPress={() => choose(pair.right, pair.left)}
          testID="compare-right"
        >
          <Text style={styles.cardText}>{pair.right.title}</Text>
        </Pressable>
      </View>

      <SecondaryButton title={COMPARE.skip} onPress={skip} disabled={mutation.isPending} testID="compare-skip" />
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  cardText: { fontSize: 16, color: colors.text, textAlign: 'center' },
})
