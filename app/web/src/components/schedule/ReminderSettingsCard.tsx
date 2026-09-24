import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { updateReminderSettings } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates, queries, queryKeys } from '@shared/queries'
import { MIN_GAP_CHOICES, endMinuteOptions, formatDuration, formatMinute, startMinuteOptions } from '@shared/schedule'
import type { ReminderSettings } from '@shared/types'

interface MinuteSelectProps {
  id: string
  label: string
  value: number
  options: number[]
  format: (minute: number) => string
  onChange: (minute: number) => void
}

function MinuteSelect({ id, label, value, options, format, onChange }: MinuteSelectProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {options.map((minute) => (
          <option key={minute} value={minute}>
            {format(minute)}
          </option>
        ))}
      </select>
    </div>
  )
}

/** 隙間時間リマインダーの設定（曜日によらず共通）。短すぎる隙間と深夜を弾く。 */
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
    <section className="card">
      <h2 className="title-with-icon">
        <SlidersHorizontal size={18} aria-hidden="true" />
        {SCHEDULE.reminderSettingsTitle}
      </h2>

      {!settings && <p className="hint-text">{COMMON.loading}</p>}

      {settings && (
        <>
          <MinuteSelect
            id="reminder-min-gap"
            label={SCHEDULE.minGapLabel}
            value={settings.reminder_min_gap_minutes}
            options={MIN_GAP_CHOICES}
            format={formatDuration}
            onChange={(minutes) => update({ reminder_min_gap_minutes: minutes })}
          />

          <div className="schedule-time-fields">
            <MinuteSelect
              id="reminder-window-start"
              label={SCHEDULE.windowStartLabel}
              value={settings.reminder_window_start_minute}
              options={startMinuteOptions()}
              format={formatMinute}
              onChange={(minute) => update({ reminder_window_start_minute: minute })}
            />
            <MinuteSelect
              id="reminder-window-end"
              label={SCHEDULE.windowEndLabel}
              value={settings.reminder_window_end_minute}
              options={endMinuteOptions(settings.reminder_window_start_minute)}
              format={formatMinute}
              onChange={(minute) => update({ reminder_window_end_minute: minute })}
            />
          </div>

          {mutation.isError && <p className="error-text">{errorMessage(mutation.error, COMMON.saveFailed)}</p>}
        </>
      )}
    </section>
  )
}
