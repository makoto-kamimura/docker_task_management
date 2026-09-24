import { useState, type MouseEvent } from 'react'
import { SCHEDULE } from '@shared/copy'
import {
  HOUR_LABELS,
  MAX_DIRECT_LABELS,
  MINUTES_PER_DAY,
  MIN_DIRECT_LABEL_MINUTES,
  donutAccessibilityLabel,
  donutGeometry,
  formatDuration,
  formatTimeRange,
  scheduledMinutes,
  type ScheduleSlice,
} from '@shared/schedule'

const CX = 230
const CY = 170
const R_OUTER = 100
const R_INNER = 64
/** 時刻の目盛り数字を置く半径。 */
const R_HOUR_LABEL = 114
/** 直接ラベルを置く半径。目盛り数字の外側に逃がす。 */
const R_DIRECT_LABEL = 140

/** 直接ラベルを出すときはその文字ぶん外側まで、出さないときはリング周りだけを切り出す。 */
const VIEW_BOX_WITH_LABELS = '0 0 460 340'
const VIEW_BOX_COMPACT = '106 46 248 248'

const geometry = donutGeometry(CX, CY, R_OUTER, R_INNER)

/** 8 色を使い切ったあとは同じ色相にハッチングを重ねて区別する（色相は増やさない）。 */
function hatchLevel(slice: ScheduleSlice): number {
  return ((slice.patternLevel - 1) % 2) + 1
}

function fillOf(slice: ScheduleSlice): string {
  return slice.patternLevel === 0
    ? `var(--series-${slice.colorIndex + 1})`
    : `url(#schedule-hatch-${slice.colorIndex}-${hatchLevel(slice)})`
}

/** 弧の中央から外へ引き出すラベルの位置。 */
function leaderOf(start: number, end: number) {
  const mid = (geometry.angleOf(start) + geometry.angleOf(end)) / 2

  return {
    from: geometry.pointOf(mid, R_OUTER + 11),
    to: geometry.pointOf(mid, R_DIRECT_LABEL - 4),
    text: geometry.pointOf(mid, R_DIRECT_LABEL),
    anchor: Math.cos(mid) >= 0 ? 'start' : 'end',
  } as const
}

function DirectLabel({ start, end, title, isDraft = false }: { start: number; end: number; title: string; isDraft?: boolean }) {
  const { from, to, text, anchor } = leaderOf(start, end)

  return (
    <g>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        className={isDraft ? 'schedule-draft-leader' : 'schedule-leader'}
      />
      <text
        x={text[0]}
        y={text[1] + 4}
        textAnchor={anchor}
        className={isDraft ? 'schedule-direct-label schedule-direct-label-draft' : 'schedule-direct-label'}
      >
        {title}
      </text>
    </g>
  )
}

interface HoverState {
  slice: ScheduleSlice
  x: number
  y: number
}

/** フォーム入力中の予定（未保存）。時刻を動かすたびに円グラフへ即時反映するためのプレビュー。 */
export interface ScheduleDraft {
  title: string
  start_minute: number
  end_minute: number
}

export function ScheduleDonut({ slices, draft }: { slices: ScheduleSlice[]; draft?: ScheduleDraft | null }) {
  const [hover, setHover] = useState<HoverState | null>(null)

  const planned = scheduledMinutes(slices.map((slice) => slice.block))
  const hasDraft = !!draft && draft.end_minute > draft.start_minute

  const hatches = new Map<string, ScheduleSlice>()
  for (const slice of slices) {
    if (slice.patternLevel > 0) {
      hatches.set(`${slice.colorIndex}-${hatchLevel(slice)}`, slice)
    }
  }

  // 予定が少ないときだけ直接ラベルを出す。増えるとラベル同士が重なって読めなくなるので、
  // そのときは下の一覧（凡例兼テーブル）だけで識別する。プレビュー中の予定は件数に関係なく常に出す。
  const labelled =
    slices.length <= MAX_DIRECT_LABELS
      ? slices.filter((slice) => slice.block.duration_minutes >= MIN_DIRECT_LABEL_MINUTES)
      : []
  const viewBox = labelled.length > 0 || hasDraft ? VIEW_BOX_WITH_LABELS : VIEW_BOX_COMPACT

  function handleMove(event: MouseEvent<SVGPathElement>, slice: ScheduleSlice) {
    const bounds = event.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
    if (!bounds) return

    setHover({ slice, x: event.clientX - bounds.left, y: event.clientY - bounds.top })
  }

  return (
    <div className="schedule-chart">
      <svg viewBox={viewBox} className="schedule-donut" role="img" aria-label={donutAccessibilityLabel(planned)}>
        <defs>
          {[...hatches].map(([key, slice]) => (
            <pattern
              key={key}
              id={`schedule-hatch-${key}`}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${hatchLevel(slice) === 1 ? 45 : 135})`}
            >
              <rect width="6" height="6" fill={`var(--series-${slice.colorIndex + 1})`} />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--bg)" strokeWidth="2" />
            </pattern>
          ))}
        </defs>

        {/* 空き時間のトラック。予定はこの上に載るので、残りがそのまま空きに見える。 */}
        <circle
          cx={CX}
          cy={CY}
          r={geometry.trackRadius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={geometry.trackWidth}
        />

        {geometry.hourTicks().map(({ hour, from, to, major }) => (
          <line
            key={hour}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
            stroke="var(--border)"
            strokeWidth={major ? 1.5 : 1}
          />
        ))}

        {HOUR_LABELS.map((hour) => {
          const [x, y] = geometry.pointOf(geometry.angleOf(hour * 60), R_HOUR_LABEL)

          return (
            <text key={hour} x={x} y={y + 3} textAnchor="middle" className="schedule-hour-label">
              {hour}
            </text>
          )
        })}

        {slices.map((slice) => (
          <path
            key={slice.block.id}
            d={geometry.slicePath(slice.block.start_minute, slice.block.end_minute)}
            fill={fillOf(slice)}
            className="schedule-arc"
            onMouseMove={(event) => handleMove(event, slice)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${slice.block.title} ${formatTimeRange(slice.block.start_minute, slice.block.end_minute)}`}</title>
          </path>
        ))}

        {labelled.map((slice) => (
          <DirectLabel
            key={slice.block.id}
            start={slice.block.start_minute}
            end={slice.block.end_minute}
            title={slice.block.title}
          />
        ))}

        {/* フォームの時刻入力に連動するプレビュー。破線の枠だけを重ね描きし、確定済みの塗りとは区別する。 */}
        {hasDraft && draft && (
          <g className="schedule-draft">
            <path
              d={geometry.arcPath(geometry.angleOf(draft.start_minute), geometry.angleOf(draft.end_minute))}
              fill="none"
              className="schedule-arc-draft"
            />
            <DirectLabel
              start={draft.start_minute}
              end={draft.end_minute}
              title={draft.title || SCHEDULE.draftTitle}
              isDraft
            />
          </g>
        )}

        <text x={CX} y={CY - 14} textAnchor="middle" className="schedule-center-caption">
          {SCHEDULE.chartPlanned}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" className="schedule-center-value">
          {formatDuration(planned)}
        </text>
        <text x={CX} y={CY + 32} textAnchor="middle" className="schedule-center-caption">
          {SCHEDULE.chartFree(formatDuration(MINUTES_PER_DAY - planned))}
        </text>
      </svg>

      {hover && (
        <div className="schedule-tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.slice.block.title}</strong>
          <span>
            {formatTimeRange(hover.slice.block.start_minute, hover.slice.block.end_minute)} ／{' '}
            {formatDuration(hover.slice.block.duration_minutes)}
          </span>
        </div>
      )}
    </div>
  )
}
