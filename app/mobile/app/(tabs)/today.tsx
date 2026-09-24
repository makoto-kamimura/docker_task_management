import { useEffect, useMemo, useRef } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { updateTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCREENS, TODAY } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import { findBreakdownItem, formatPath } from '@shared/tasks'
import { durationOf } from '@shared/timer'
import { useSessionStore } from '../../src/store/session-store'
import { useTimerStore } from '../../src/store/timer-store'
import { syncTodayStepToWatch } from '../../src/watch/sync'
import { BreakdownCard } from '../../src/components/today/BreakdownCard'
import { CompareBoard } from '../../src/components/today/CompareBoard'
import { SessionBanner } from '../../src/components/today/SessionBanner'
import { Card, ErrorText, Hint, PrimaryButton, Screen, SecondaryButton } from '../../src/components/ui'
import { colors } from '../../src/theme'

/**
 * 今日の一歩。利用フロー 3 のループをこの 1 画面で回す（Web の pages/TodayPage.tsx と同じ）。
 *   実施できるやりたいこと → 開始する / 15分でできない（＝次のやりたいこと）
 *   実施できるものが無い   → 二択で選ぶ
 *   優先度が確定した       → やりたいことの細分化
 */
export default function TodayScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ autostart?: string }>()
  const startTimer = useTimerStore((state) => state.start)
  const startSession = useSessionStore((state) => state.startIfIdle)
  const { data, isLoading } = useQuery(queries.todayStep())
  const autoStarted = useRef(false)

  const breakdownMutation = useMutation({
    mutationFn: (id: number) => updateTask(id, { needs_breakdown: true }),
    onSuccess: () => invalidate(queryClient, invalidates.task),
  })

  const kind = data?.kind ?? 'empty'
  const task = data?.task ?? null
  const path = data?.path ?? []

  // 細分化のときだけ、対象タスクの子を出すためにツリーを使う。
  const { data: tasks } = useQuery({ ...queries.taskTree(), enabled: kind === 'breakdown' })
  const breakdownItem = useMemo(() => findBreakdownItem(tasks ?? [], task?.id), [tasks, task?.id])

  function handleStart() {
    if (!task) return
    startSession()
    startTimer({ id: task.id, title: task.title, durationMinutes: durationOf(task) })
    router.push('/timer')
  }

  // 通知の [開始] から来たときは隙間時間の計測を始め、実施できる一歩ならタイマーまで開く。
  // 二択・細分化のときはこの画面にとどめる（何をするかを見せてから操作してもらう）。
  useEffect(() => {
    if (params.autostart !== '1' || isLoading || autoStarted.current) return
    autoStarted.current = true
    startSession()
    if (kind === 'task' && task) handleStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.autostart, isLoading, kind, task])

  useEffect(() => {
    if (!isLoading) {
      syncTodayStepToWatch(data)
    }
  }, [data, isLoading])

  return (
    <Screen>
      <SessionBanner />

      {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}

      {!isLoading && kind === 'task' && task && (
        <Card style={styles.card}>
          {path.length > 0 && (
            <Text style={styles.path} numberOfLines={2}>
              {formatPath(path)}
            </Text>
          )}
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.duration}>{durationOf(task)}分</Text>
          <PrimaryButton title={TODAY.start} onPress={handleStart} testID="today-start-button" />
          <SecondaryButton
            title={TODAY.breakdown}
            onPress={() => breakdownMutation.mutate(task.id)}
            disabled={breakdownMutation.isPending}
            testID="today-breakdown-button"
            style={styles.breakdownButton}
          />
          <Hint>{TODAY.breakdownHint}</Hint>
          <ErrorText>
            {breakdownMutation.isError ? errorMessage(breakdownMutation.error, COMMON.saveFailed) : null}
          </ErrorText>
        </Card>
      )}

      {!isLoading && kind === 'compare' && (
        <View testID="today-compare-step">
          <Text style={styles.stepKind}>{SCREENS.compare.nav}</Text>
          <Text style={styles.stepTitle}>{SCREENS.compare.title}</Text>
          <Hint>{TODAY.compareLead}</Hint>
          <View style={styles.stepBody}>
            <CompareBoard onChoose={startSession} />
          </View>
        </View>
      )}

      {!isLoading && kind === 'breakdown' && (
        <View testID="today-breakdown-step">
          <Text style={styles.stepKind}>{SCREENS.todo.nav}</Text>
          {path.length > 0 && (
            <Text style={styles.path} numberOfLines={2}>
              {formatPath(path)}
            </Text>
          )}
          <Text style={styles.stepTitle}>{task?.title ?? SCREENS.todo.title}</Text>
          <Hint>{TODAY.breakdownLead}</Hint>
          <View style={styles.stepBody}>
            {breakdownItem ? (
              <BreakdownCard item={breakdownItem} defaultOpen onDone={startSession} />
            ) : (
              <Hint>{TODAY.breakdownEmpty}</Hint>
            )}
          </View>
        </View>
      )}

      {!isLoading && kind === 'empty' && (
        <Card style={styles.card}>
          <Hint>{TODAY.empty}</Hint>
          <View style={styles.flow}>
            {TODAY.flow.map((step, index) => (
              <Text key={step} style={styles.flowStep}>
                {index + 1}. {step}
              </Text>
            ))}
          </View>
          <PrimaryButton
            title={TODAY.emptyAction}
            onPress={() => router.push('/(tabs)/tasks')}
            testID="today-register-button"
          />
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { padding: 24, alignItems: 'center' },
  path: { fontSize: 12, color: colors.textMuted, marginBottom: 12, textAlign: 'center' },
  taskTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' },
  duration: { color: colors.textMuted, marginBottom: 16 },
  breakdownButton: { marginTop: 12 },
  stepKind: { fontSize: 12, fontWeight: '600', color: colors.accent, marginBottom: 4 },
  stepTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  stepBody: { marginTop: 16 },
  flow: { marginVertical: 16, gap: 4 },
  flowStep: { fontSize: 14, color: colors.textMuted },
})
