import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { deleteScheduleBlock, updateScheduleBlock } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import {
  DAY_STAT_LABELS,
  formatDuration,
  formatTimeRange,
  includedStatKeys,
  notifyToggleHint,
  type ScheduleSlice,
} from '@shared/schedule'
import type { ScheduleBlock } from '@shared/types'
import { ActionButton, ErrorText } from '../ui'
import { colors } from '../../theme'
import { CopyPanel } from './CopyPanel'
import { DAY_STAT_ICONS, sliceColor, sliceOpacity } from './icons'

/** 1 日ぶんの予定の一覧。円グラフの凡例を兼ねる。Web の BlockList と同じ操作を持つ。 */
export function BlockList({ slices, onEdit }: { slices: ScheduleSlice[]; onEdit: (block: ScheduleBlock) => void }) {
  const queryClient = useQueryClient()
  // 「他の曜日へコピー」パネル。同時に開けるのは 1 件だけ。
  const [copyingId, setCopyingId] = useState<number | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleBlock,
    onSuccess: () => invalidate(queryClient, invalidates.schedule),
  })

  // 「スキマ」の ON/OFF。この予定が始まる時刻に「今日の一歩」を通知するかどうか。
  const notifyMutation = useMutation({
    mutationFn: (block: ScheduleBlock) => updateScheduleBlock(block.id, { notify_at_start: !block.notify_at_start }),
    onSuccess: () => invalidate(queryClient, invalidates.schedule),
  })

  const actionError = deleteMutation.error ?? notifyMutation.error

  function handleDelete(block: ScheduleBlock) {
    Alert.alert(SCHEDULE.deleteTitle, SCHEDULE.deleteMessage(block.title), [
      { text: COMMON.cancel, style: 'cancel' },
      { text: COMMON.delete, style: 'destructive', onPress: () => deleteMutation.mutate(block.id) },
    ])
  }

  return (
    <View style={styles.list}>
      {slices.map((slice) => {
        const { block } = slice

        return (
          <View key={block.id}>
            <View style={styles.item}>
              <View style={styles.summary}>
                <View
                  style={[styles.swatch, { backgroundColor: sliceColor(slice), opacity: sliceOpacity(slice) }]}
                />
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {block.title}
                    </Text>
                    {/* 合計に数えている予定が一目で分かるようにする。 */}
                    {includedStatKeys(block).map((key) => (
                      <Ionicons
                        key={key}
                        name={DAY_STAT_ICONS[key]}
                        size={12}
                        color={colors.textMuted}
                        accessibilityLabel={DAY_STAT_LABELS[key].includedIn}
                      />
                    ))}
                  </View>
                  <Text style={styles.time}>
                    {formatTimeRange(block.start_minute, block.end_minute)} ／ {formatDuration(block.duration_minutes)}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <ActionButton title={COMMON.edit} onPress={() => onEdit(block)} />
                <ActionButton
                  title={SCHEDULE.copy}
                  active={copyingId === block.id}
                  onPress={() => setCopyingId((current) => (current === block.id ? null : block.id))}
                />
                <ActionButton
                  title={SCHEDULE.notifyToggle(block.notify_at_start)}
                  active={block.notify_at_start}
                  onPress={() => notifyMutation.mutate(block)}
                  disabled={notifyMutation.isPending}
                />
                <ActionButton
                  title={COMMON.delete}
                  onPress={() => handleDelete(block)}
                  disabled={deleteMutation.isPending}
                />
              </View>
              {/* Web はボタンの title（ホバー）で出す説明。タッチにはホバーがないので、ON の予定にだけ添える。 */}
              {block.notify_at_start && <Text style={styles.notifyHint}>{notifyToggleHint(block)}</Text>}
            </View>

            {copyingId === block.id && <CopyPanel block={block} onClose={() => setCopyingId(null)} />}
          </View>
        )
      })}
      <ErrorText>{actionError ? errorMessage(actionError, COMMON.saveFailed) : null}</ErrorText>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { marginTop: 8 },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 15, color: colors.text, flexShrink: 1 },
  time: { fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  notifyHint: { fontSize: 11, color: colors.textMuted },
})
