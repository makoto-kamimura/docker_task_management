import { SCHEDULE } from '@shared/copy'
import {
  DAY_STAT_LABELS,
  EMPTY_DAY_STATS,
  WEEKDAY_LABELS,
  WEEK_ORDER,
  formatDuration,
  freeTimeLabel,
  todayDayOfWeek,
  visibleDayStats,
  weekdayAccessibilityLabel,
  type DayStats,
} from '@shared/schedule'
import { DAY_STAT_ICONS } from './icons'

interface WeekBarProps {
  selected: number
  stats: Map<number, DayStats>
  onSelect: (day: number) => void
}

/** 月曜始まりの 7 曜日タブ。各曜日の空き時間と、睡眠・運動・スキマの合計を並べて比べられるようにする。 */
export function WeekBar({ selected, stats, onSelect }: WeekBarProps) {
  const today = todayDayOfWeek()

  return (
    <div className="schedule-weekbar" role="tablist" aria-label="曜日">
      {WEEK_ORDER.map((day) => {
        const dayStats = stats.get(day) ?? EMPTY_DAY_STATS

        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={day === selected}
            className={`schedule-weekday${day === selected ? ' active' : ''}`}
            onClick={() => onSelect(day)}
            aria-label={weekdayAccessibilityLabel(day, dayStats)}
          >
            <span className="schedule-weekday-label">{WEEKDAY_LABELS[day]}</span>
            <span className="schedule-weekday-free">{freeTimeLabel(dayStats)}</span>
            {visibleDayStats(dayStats).map(({ key, minutes }) => {
              const Icon = DAY_STAT_ICONS[key]

              return (
                <span
                  key={key}
                  className="schedule-weekday-stat"
                  title={`${DAY_STAT_LABELS[key].short} ${formatDuration(minutes)}`}
                >
                  <Icon size={10} aria-hidden="true" />
                  {formatDuration(minutes)}
                </span>
              )
            })}
            {day === today && <span className="schedule-weekday-today">{SCHEDULE.today}</span>}
          </button>
        )
      })}
    </div>
  )
}
