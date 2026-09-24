import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTask } from '@shared/api'
import { COMMON, TODO } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import type { BreakdownItem } from '@shared/tasks'
import { SubtaskForm } from '../SubtaskForm'
import { ActionButton, Card } from '../ui'
import { colors } from '../../theme'

/**
 * 分解待ち 1 件のカード。「今日の一歩」の細分化（1 件だけ出す）と、
 * 単独の細分化画面（分解待ちを一覧する）の両方から同じものを使う。
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
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.task.title}</Text>
        <View style={styles.actions}>
          <ActionButton
            title={TODO.split}
            onPress={() => setAdding((v) => !v)}
            testID={`breakdown-split-${item.task.id}`}
          />
          {item.children.length > 0 && (
            <ActionButton
              title={TODO.done}
              onPress={finish}
              disabled={doneMutation.isPending}
              testID={`breakdown-done-${item.task.id}`}
            />
          )}
        </View>
      </View>

      {item.children.map((child) => (
        <Text key={child.id} style={styles.childTitle} numberOfLines={2}>
          └ {child.title}
        </Text>
      ))}

      {adding && (
        <SubtaskForm
          parentId={item.task.id}
          onClose={() => setAdding(false)}
          keepOpen
          closeLabel={COMMON.close}
          testIDPrefix="breakdown-subtask"
        />
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: 14, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  childTitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, marginLeft: 8 },
})
