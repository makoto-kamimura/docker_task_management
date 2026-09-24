import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { COMMON, SCHEDULE } from '@shared/copy'
import { queries } from '@shared/queries'
import { WEEKDAY_LABELS, formatDuration, formatMinute, formatTimeRange } from '@shared/schedule'
import { IconText } from '../IconText'
import { Card, Hint } from '../ui'
import { colors } from '../../theme'

/** 選んだ曜日の隙間時間（予定の塗り残し）。Web の FreeSlotList と同じ内容。 */
export function FreeSlotList({ dayOfWeek }: { dayOfWeek: number }) {
  const { data: freeSlots, isLoading } = useQuery(queries.freeSlots(dayOfWeek))

  return (
    <Card style={styles.card}>
      <IconText
        icon="notifications-outline"
        color={colors.text}
        size={18}
        textStyle={styles.title}
        containerStyle={styles.titleRow}
      >
        {SCHEDULE.freeSlotsTitle(WEEKDAY_LABELS[dayOfWeek])}
      </IconText>

      {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}
      {freeSlots && freeSlots.slots.length === 0 && <Hint>{SCHEDULE.noFreeSlots}</Hint>}

      {freeSlots?.slots.map((slot) => (
        <View key={slot.start_minute} style={styles.slot}>
          <Text style={styles.slotTime}>{formatTimeRange(slot.start_minute, slot.end_minute)}</Text>
          <Text style={styles.slotHint}>
            {formatDuration(slot.duration_minutes)} ／ {SCHEDULE.remindAt(formatMinute(slot.start_minute))}
          </Text>
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  titleRow: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  slot: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 2,
  },
  slotTime: { fontSize: 15, color: colors.text },
  slotHint: { fontSize: 12, color: colors.textMuted },
})
