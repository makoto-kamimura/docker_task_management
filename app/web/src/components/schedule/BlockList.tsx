import { Fragment, useState, type CSSProperties } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { CopyPanel } from './CopyPanel'
import { DAY_STAT_ICONS } from './icons'

function swatchStyle(slice: ScheduleSlice): CSSProperties {
  const color = `var(--series-${slice.colorIndex + 1})`

  if (slice.patternLevel === 0) {
    return { background: color }
  }

  const angle = slice.patternLevel % 2 === 1 ? '45deg' : '135deg'

  return { background: `repeating-linear-gradient(${angle}, ${color} 0 3px, var(--bg) 3px 5px)` }
}

/** 1 日ぶんの予定の一覧。円グラフの凡例を兼ねる。 */
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
    if (window.confirm(SCHEDULE.deleteMessage(block.title))) {
      deleteMutation.mutate(block.id)
    }
  }

  return (
    <>
      <ul className="schedule-list">
        {slices.map((slice) => {
          const { block } = slice

          return (
            <Fragment key={block.id}>
              <li>
                <span className="schedule-swatch" style={swatchStyle(slice)} aria-hidden="true" />
                <span className="schedule-time">{formatTimeRange(block.start_minute, block.end_minute)}</span>
                <span className="schedule-title-cell">
                  <span className="schedule-title">{block.title}</span>
                  {/* 合計に数えている予定が一目で分かるようにする。 */}
                  {includedStatKeys(block).map((key) => {
                    const Icon = DAY_STAT_ICONS[key]
                    const label = DAY_STAT_LABELS[key].includedIn

                    return (
                      <span key={key} className="schedule-title-mark" title={label}>
                        <Icon size={12} aria-label={label} />
                      </span>
                    )
                  })}
                </span>
                <span className="schedule-duration">{formatDuration(block.duration_minutes)}</span>
                <span className="tree-actions">
                  <button className="tree-action" type="button" onClick={() => onEdit(block)}>
                    {COMMON.edit}
                  </button>
                  <button
                    className="tree-action"
                    type="button"
                    aria-expanded={copyingId === block.id}
                    onClick={() => setCopyingId((current) => (current === block.id ? null : block.id))}
                  >
                    {SCHEDULE.copy}
                  </button>
                  <button
                    className={`tree-action${block.notify_at_start ? ' is-on' : ''}`}
                    type="button"
                    aria-pressed={block.notify_at_start}
                    title={notifyToggleHint(block)}
                    onClick={() => notifyMutation.mutate(block)}
                    disabled={notifyMutation.isPending}
                  >
                    {SCHEDULE.notifyToggle(block.notify_at_start)}
                  </button>
                  <button
                    className="tree-action"
                    type="button"
                    onClick={() => handleDelete(block)}
                    disabled={deleteMutation.isPending}
                  >
                    {COMMON.delete}
                  </button>
                </span>
              </li>

              {copyingId === block.id && <CopyPanel block={block} onClose={() => setCopyingId(null)} />}
            </Fragment>
          )
        })}
      </ul>
      {actionError && <p className="error-text">{errorMessage(actionError, COMMON.saveFailed)}</p>}
    </>
  )
}
