import { useState } from 'react'
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

/** 「コピー」で開く、同じ予定を他の曜日にも登録するパネル。 */
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
    <li className="schedule-copy-panel">
      <p className="hint-text">
        {SCHEDULE.copyPrompt(block.title, formatTimeRange(block.start_minute, block.end_minute))}
      </p>
      <div className="schedule-copy-days">
        {WEEK_ORDER.filter((day) => day !== block.day_of_week).map((day) => (
          <label key={day} className="schedule-copy-day">
            <input type="checkbox" checked={days.has(day)} onChange={() => toggleDay(day)} />
            {WEEKDAY_LABELS[day]}曜
          </label>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="schedule-form-actions">
        <button
          className="button"
          type="button"
          onClick={() => {
            setError(null)
            mutation.mutate()
          }}
          disabled={days.size === 0 || mutation.isPending}
        >
          {SCHEDULE.copySubmit}
        </button>
        <button className="button button-secondary" type="button" onClick={onClose}>
          {COMMON.cancel}
        </button>
      </div>
    </li>
  )
}
