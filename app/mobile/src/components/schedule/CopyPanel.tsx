import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import {
  WEEKDAY_LABELS,
  WEEK_ORDER,
  copyFailureMessage,
  copyScheduleBlock,
  formatTimeRange,
} from '@shared/schedule'
import type { ScheduleBlock } from '@shared/types'
import { Chip, ErrorText, Hint, PrimaryButton, SecondaryButton } from '../ui'
import { colors } from '../../theme'

/** 「コピー」で開く、同じ予定を他の曜日にも登録するパネル。Web の CopyPanel と同じ振る舞い。 */
export function CopyPanel({ block, onClose }: { block: ScheduleBlock; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => copyScheduleBlock(block, [...days]),
    onSuccess: (failedDays) => {
      invalidate(queryClient, invalidates.schedule)
      if (failedDays.length === 0) {
        onClose()
      } else {
        setError(copyFailureMessage(failedDays))
      }
    },
  })

  function toggleDay(day: number) {
    setDays((current) => {
      const next = new Set(current)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }

      return next
    })
  }

  return (
    <View style={styles.panel}>
      <Hint>{SCHEDULE.copyPrompt(block.title, formatTimeRange(block.start_minute, block.end_minute))}</Hint>
      <View style={styles.days}>
        {WEEK_ORDER.filter((day) => day !== block.day_of_week).map((day) => (
          <Chip key={day} label={`${WEEKDAY_LABELS[day]}曜`} selected={days.has(day)} onPress={() => toggleDay(day)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <View style={styles.actions}>
        <PrimaryButton
          title={SCHEDULE.copySubmit}
          onPress={() => {
            setError(null)
            mutation.mutate()
          }}
          disabled={days.size === 0 || mutation.isPending}
          style={styles.button}
        />
        <SecondaryButton title={COMMON.cancel} onPress={onClose} style={styles.button} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.accentBg, borderRadius: 8, padding: 12, marginBottom: 8 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1, paddingVertical: 10 },
})
