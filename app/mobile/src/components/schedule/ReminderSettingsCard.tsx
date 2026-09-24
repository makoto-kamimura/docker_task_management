import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateReminderSettings } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates, queries, queryKeys } from '@shared/queries'
import { MIN_GAP_CHOICES, endMinuteOptions, formatDuration, formatMinute, startMinuteOptions } from '@shared/schedule'
import type { ReminderSettings } from '@shared/types'
import { IconText } from '../IconText'
import { Card, Chip, ChipRow, ErrorText, Label } from '../ui'
import { colors } from '../../theme'
import { TimeField } from './TimeField'

/** 隙間時間リマインダーの設定（曜日によらず共通）。Web の ReminderSettingsCard と同じ内容。 */
export function ReminderSettingsCard() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery(queries.reminderSettings())

  const mutation = useMutation({
    mutationFn: updateReminderSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.reminderSettings, next)
      invalidate(queryClient, invalidates.reminderSettings)
    },
  })

  function update(input: Partial<ReminderSettings>) {
    mutation.mutate(input)
  }

  return (
    <Card style={styles.card}>
      <IconText
        icon="options-outline"
        color={colors.text}
        size={18}
        textStyle={styles.title}
        containerStyle={styles.titleRow}
      >
        {SCHEDULE.reminderSettingsTitle}
      </IconText>

      {!settings && <ActivityIndicator accessibilityLabel={COMMON.loading} />}

      {settings && (
        <>
          <Label>{SCHEDULE.minGapLabel}</Label>
          <ChipRow>
            {MIN_GAP_CHOICES.map((minutes) => (
              <Chip
                key={minutes}
                label={formatDuration(minutes)}
                selected={settings.reminder_min_gap_minutes === minutes}
                onPress={() => update({ reminder_min_gap_minutes: minutes })}
              />
            ))}
          </ChipRow>

          <View style={styles.timeRow}>
            <TimeField
              label={SCHEDULE.windowStartLabel}
              value={settings.reminder_window_start_minute}
              options={startMinuteOptions()}
              format={formatMinute}
              onChange={(minute) => update({ reminder_window_start_minute: minute })}
            />
            <TimeField
              label={SCHEDULE.windowEndLabel}
              value={settings.reminder_window_end_minute}
              options={endMinuteOptions(settings.reminder_window_start_minute)}
              format={formatMinute}
              onChange={(minute) => update({ reminder_window_end_minute: minute })}
            />
          </View>

          <ErrorText>{mutation.isError ? errorMessage(mutation.error, COMMON.saveFailed) : null}</ErrorText>
        </>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  titleRow: { marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 12 },
})
