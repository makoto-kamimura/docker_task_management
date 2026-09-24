import { useMemo, useReducer, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createScheduleBlock, updateScheduleBlock } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
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
import { IconText } from '../../src/components/IconText'
import { Hint, Screen, SegmentedTabs } from '../../src/components/ui'
import { BlockList } from '../../src/components/schedule/BlockList'
import { FreeSlotList } from '../../src/components/schedule/FreeSlotList'
import { ReminderSettingsCard } from '../../src/components/schedule/ReminderSettingsCard'
import { ScheduleDonut } from '../../src/components/schedule/ScheduleDonut'
import { ScheduleForm } from '../../src/components/schedule/ScheduleForm'
import { WeekBar } from '../../src/components/schedule/WeekBar'
import { DAY_STAT_ICONS } from '../../src/components/schedule/icons'
import { colors } from '../../src/theme'

const TAB_ITEMS = SCHEDULE_TABS.map((key) => ({ key, label: SCHEDULE.tabs[key] }))

export default function ScheduleScreen() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<ScheduleTab>('timetable')
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
  const draft = { start_minute: form.startMinute, end_minute: form.endMinute }

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

  /** 曜日を変えたら、別の曜日の予定を編集し続けないようフォームを初期状態に戻す。 */
  function changeDay(next: number) {
    setDayOfWeek(next)
    resetForm()
  }

  return (
    <Screen>
      <SegmentedTabs tabs={TAB_ITEMS} value={tab} onChange={setTab} />
      <Hint>{tab === 'timetable' ? SCHEDULE.timetableIntro : SCHEDULE.slotsIntro}</Hint>

      {/* 曜日の選択は両方のタブで共通。スキマ時間設定でも、選んだ曜日の隙間時間を出す。 */}
      <WeekBar selected={dayOfWeek} stats={stats} onSelect={changeDay} />

      {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} style={styles.loading} />}

      {tab === 'slots' && (
        <>
          <FreeSlotList dayOfWeek={dayOfWeek} />
          <ReminderSettingsCard />
        </>
      )}

      {tab === 'timetable' && !isLoading && (
        <>
          <ScheduleDonut slices={chartSlices} draft={draft} />

          <View style={styles.dayStats}>
            {DAY_STAT_KEYS.map((key) => (
              <IconText key={key} icon={DAY_STAT_ICONS[key]} color={colors.textMuted} size={14} textStyle={styles.dayStat}>
                {SCHEDULE.dayStatTotal(DAY_STAT_LABELS[key].total, formatDuration(dayStats[key]))}
              </IconText>
            ))}
          </View>

          {slices.length === 0 ? (
            <Hint>{SCHEDULE.emptyDay(WEEKDAY_LABELS[dayOfWeek])}</Hint>
          ) : (
            <>
              <BlockList
                slices={slices}
                onEdit={(block) => {
                  saveMutation.reset()
                  dispatch({ type: 'edit', block })
                }}
              />
              <Hint>
                {SCHEDULE.plannedSummary(
                  formatDuration(dayStats.planned),
                  formatDuration(MINUTES_PER_DAY - dayStats.planned),
                )}
              </Hint>
            </>
          )}
        </>
      )}

      {tab === 'timetable' && (
        <ScheduleForm
          dayOfWeek={dayOfWeek}
          state={form}
          dispatch={dispatch}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isSaving={saveMutation.isPending}
          error={saveMutation.isError ? errorMessage(saveMutation.error, COMMON.saveFailed) : null}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  loading: { marginTop: 16 },
  dayStats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginBottom: 8 },
  dayStat: { fontSize: 12 },
})
