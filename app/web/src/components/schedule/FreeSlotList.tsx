import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { COMMON, SCHEDULE } from '@shared/copy'
import { queries } from '@shared/queries'
import { WEEKDAY_LABELS, formatDuration, formatMinute, formatTimeRange } from '@shared/schedule'

/** 選んだ曜日の隙間時間（予定の塗り残し）。それぞれの開始時刻に「今日の一歩」をリマインドする。 */
export function FreeSlotList({ dayOfWeek }: { dayOfWeek: number }) {
  const { data: freeSlots, isLoading } = useQuery(queries.freeSlots(dayOfWeek))

  return (
    <section className="card">
      <h2 className="title-with-icon">
        <Bell size={18} aria-hidden="true" />
        {SCHEDULE.freeSlotsTitle(WEEKDAY_LABELS[dayOfWeek])}
      </h2>

      {isLoading && <p className="hint-text">{COMMON.loading}</p>}
      {freeSlots && freeSlots.slots.length === 0 && <p className="hint-text">{SCHEDULE.noFreeSlots}</p>}

      {freeSlots && freeSlots.slots.length > 0 && (
        <ul className="schedule-slot-list">
          {freeSlots.slots.map((slot) => (
            <li key={slot.start_minute}>
              <span className="schedule-time">{formatTimeRange(slot.start_minute, slot.end_minute)}</span>
              <span className="schedule-duration">{formatDuration(slot.duration_minutes)}</span>
              <span className="hint-text">{SCHEDULE.remindAt(formatMinute(slot.start_minute))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
