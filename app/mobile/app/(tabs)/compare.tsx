import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNextPair, submitComparison } from '../../src/api/comparisons'
import { colors } from '../../src/theme'

export default function CompareScreen() {
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!pair) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>どちらが今重要？</Text>
        <Text style={styles.hint}>比較するには「やりたいこと」を2件以上登録してください。</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>どちらが今重要？</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.card}
          disabled={mutation.isPending}
          onPress={() => choose(pair.left.id, pair.right.id)}
          testID="compare-left"
        >
          <Text style={styles.cardText}>{pair.left.title}</Text>
        </Pressable>
        <Pressable
          style={styles.card}
          disabled={mutation.isPending}
          onPress={() => choose(pair.right.id, pair.left.id)}
          testID="compare-right"
        >
          <Text style={styles.cardText}>{pair.right.title}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.skipButton} onPress={skip} disabled={mutation.isPending} testID="compare-skip">
        <Text style={styles.skipButtonText}>あとで決める</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: colors.text },
  hint: { color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12, marginVertical: 24 },
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
  skipButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: { color: colors.text },
})
