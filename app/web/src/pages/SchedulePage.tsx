import { useMemo, useReducer, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PieChart } from 'lucide-react'
import { createScheduleBlock, updateScheduleBlock } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE, SCREENS } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import {
  DAY_STAT_KEYS,
  DAY_STAT_LABELS,
  DEFAULT_BLOCK_START,
  EMPTY_DAY_STATS,
  MINUTES_PER_DAY,
  SCHEDULE_TABS,
  WEEKDAY_LABELS,
  blocksOfDay,
  buildSlices,
  buildTitleSlots,
  formatDuration,
  initialScheduleForm,
  scheduleFormReducer,
  todayDayOfWeek,
  weekStats,
  type ScheduleTab,
} from '@shared/schedule'
import type { ScheduleBlockInput } from '@shared/types'
import { PageTitle } from '../components/PageTitle'
import { Tabs } from '../components/Tabs'
import { BlockList } from '../components/schedule/BlockList'
import { FreeSlotList } from '../components/schedule/FreeSlotList'
import { ReminderSettingsCard } from '../components/schedule/ReminderSettingsCard'
import { ScheduleDonut } from '../components/schedule/ScheduleDonut'
import { ScheduleForm } from '../components/schedule/ScheduleForm'
import { WeekBar } from '../components/schedule/WeekBar'
import { DAY_STAT_ICONS } from '../components/schedule/icons'

const TAB_ITEMS = SCHEDULE_TABS.map((key) => ({ key, label: SCHEDULE.tabs[key] }))

export function SchedulePage() {
  const queryClient = useQueryClient()
  // 表示中のタブは URL（?tab=slots）に持ち、再読み込みやブックマークでも同じタブを開く。
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: ScheduleTab = searchParams.get('tab') === 'slots' ? 'slots' : 'timetable'
  const [dayOfWeek, setDayOfWeek] = useState(todayDayOfWeek)
  const [form, dispatch] = useReducer(scheduleFormReducer, undefined, () => initialScheduleForm())

  const { data: weekBlocks, isLoading } = useQuery(queries.scheduleWeek())

  const titleSlots = useMemo(() => buildTitleSlots(weekBlocks ?? []), [weekBlocks])
  const slices = useMemo(
    () => buildSlices(blocksOfDay(weekBlocks ?? [], dayOfWeek), titleSlots),
    [weekBlocks, dayOfWeek, titleSlots],
  )
  const stats = useMemo(() => weekStats(weekBlocks ?? []), [weekBlocks])
  const dayStats = stats.get(dayOfWeek) ?? EMPTY_DAY_STATS

  // フォームの時刻を動かすたびに円グラフへ即時反映するプレビュー。編集中の予定は
  // 元の位置を円グラフから外し、代わりに破線のプレビューを新しい位置に出す。
  const chartSlices = form.editingId === null ? slices : slices.filter((slice) => slice.block.id !== form.editingId)
  const draft = { title: form.title.trim(), start_minute: form.startMinute, end_minute: form.endMinute }

  const saveMutation = useMutation({
    mutationFn: (input: ScheduleBlockInput) =>
      form.editingId === null ? createScheduleBlock(input) : updateScheduleBlock(form.editingId, input),
    onSuccess: (block) => {
      invalidate(queryClient, invalidates.schedule)
      setDayOfWeek(block.day_of_week)
      dispatch({ type: 'reset', nextStart: block.end_minute })
    },
  })

  function handleSubmit() {
    saveMutation.mutate({
      title: form.title.trim(),
      day_of_week: dayOfWeek,
      start_minute: form.startMinute,
      end_minute: form.endMinute,
      task_id: form.taskId,
    })
  }

  function resetForm() {
    saveMutation.reset()
    dispatch({ type: 'reset', nextStart: DEFAULT_BLOCK_START })
  }

  function changeTab(next: ScheduleTab) {
    setSearchParams(next === 'timetable' ? {} : { tab: next }, { replace: true })
  }

  /** 曜日を変えたら、別の曜日の予定を編集し続けないようフォームを初期状態に戻す。 */
  function changeDay(next: number) {
    setDayOfWeek(next)
    resetForm()
  }

  return (
    <div className="page">
      <PageTitle icon={PieChart}>{SCREENS.schedule.title}</PageTitle>
      <Tabs tabs={TAB_ITEMS} value={tab} onChange={changeTab} label={SCHEDULE.tabsLabel} idPrefix="schedule" />
      <p className="hint-text">{tab === 'timetable' ? SCHEDULE.timetableIntro : SCHEDULE.slotsIntro}</p>

      {/* 曜日の選択は両方のタブで共通。スキマ時間設定でも、選んだ曜日の隙間時間を出す。 */}
      <WeekBar selected={dayOfWeek} stats={stats} onSelect={changeDay} />

      {isLoading && <p>{COMMON.loading}</p>}

      {tab === 'slots' && (
        <div className="layout-halves" role="tabpanel" id="schedule-slots" aria-labelledby="schedule-tab-slots">
          <FreeSlotList dayOfWeek={dayOfWeek} />
          <ReminderSettingsCard />
        </div>
      )}

      {/* 円グラフは左に固定し、右で一覧をスクロールしたりフォームを動かしたりしても、プレビューが見えるようにする。 */}
      {tab === 'timetable' && (
        <div className="layout-split" role="tabpanel" id="schedule-timetable" aria-labelledby="schedule-tab-timetable">
          <div className="layout-split-sticky">
            {!isLoading && (
              <>
                <ScheduleDonut slices={chartSlices} draft={draft} />

                <div className="schedule-day-stats">
                  {DAY_STAT_KEYS.map((key) => {
                    const Icon = DAY_STAT_ICONS[key]

                    return (
                      <span key={key} className="hint-text schedule-day-stat">
                        <Icon size={14} aria-hidden="true" />
                        {SCHEDULE.dayStatTotal(DAY_STAT_LABELS[key].total, formatDuration(dayStats[key]))}
                      </span>
                    )
                  })}
                </div>

                {slices.length > 0 && (
                  <p className="hint-text">
                    {SCHEDULE.plannedSummary(
                      formatDuration(dayStats.planned),
                      formatDuration(MINUTES_PER_DAY - dayStats.planned),
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="layout-split-main">
            {!isLoading &&
              (slices.length === 0 ? (
                <p className="hint-text">{SCHEDULE.emptyDay(WEEKDAY_LABELS[dayOfWeek])}</p>
              ) : (
                <BlockList
                  slices={slices}
                  onEdit={(block) => {
                    saveMutation.reset()
                    dispatch({ type: 'edit', block })
                  }}
                />
              ))}

            <ScheduleForm
              dayOfWeek={dayOfWeek}
              state={form}
              dispatch={dispatch}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isSaving={saveMutation.isPending}
              error={saveMutation.isError ? errorMessage(saveMutation.error, COMMON.saveFailed) : null}
            />
          </div>
        </div>
      )}
    </div>
  )
}
