import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Redirect } from 'expo-router'
import type { Ionicons } from '@expo/vector-icons'
import { createTaskLog } from '@shared/api'
import { TIMER } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import { TASK_LOG_RESULTS, formatClock, timerSnapshot } from '@shared/timer'
import type { TaskLogResult } from '@shared/types'
import { useTimerStore } from '../src/store/timer-store'
import { IconText } from '../src/components/IconText'
import { Card, ErrorText, PrimaryButton, Screen, SecondaryButton } from '../src/components/ui'
import { colors } from '../src/theme'

/** Web（lucide）と Apple Watch（SF Symbols）と同じ意味の絵柄。 */
const RESULT_ICONS: Record<TaskLogResult, keyof typeof Ionicons.glyphMap> = {
  done: 'checkmark-circle-outline',
  partial: 'time-outline',
  skipped: 'close-circle-outline',
}

export default function TimerScreen() {
  const queryClient = useQueryClient()
  const { task, startedAt, stoppedAt, stop, clear } = useTimerStore()
  const [now, setNow] = useState(() => Date.now())

  const snapshot = task && startedAt ? timerSnapshot(startedAt, task.durationMinutes, stoppedAt, now) : null
  const isFinished = snapshot?.isFinished ?? false

  // 残り時間は開始時刻との差で毎回求めるので、アプリがバックグラウンドに回っても狂わない。
  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [isFinished])

  const mutation = useMutation({
    mutationFn: createTaskLog,
    onSuccess: () => {
      invalidate(queryClient, invalidates.taskLog)
      // store を空にすると下の Redirect で今日の一歩へ戻る。Web / Apple Watch も結果入力のあとは今日の一歩に戻る。
      clear()
    },
  })

  if (!task || !startedAt || !snapshot) {
    return <Redirect href="/(tabs)/today" />
  }

  function submitResult(result: TaskLogResult) {
    if (!task || !startedAt || !snapshot) return
    mutation.mutate({
      task_id: task.id,
      started_at: startedAt,
      result,
      elapsed_seconds: snapshot.elapsedSeconds,
      source: 'mobile',
    })
  }

  return (
    <Screen>
      <Text style={styles.title}>{task.title}</Text>

      {!isFinished && (
        <Card style={styles.card}>
          <Text style={styles.time}>{formatClock(snapshot.remainingSeconds)}</Text>
          <SecondaryButton title={TIMER.stop} onPress={stop} testID="timer-stop" />
        </Card>
      )}

      {isFinished && (
        <Card style={styles.card}>
          <IconText
            icon="sparkles-outline"
            color={colors.text}
            size={18}
            textStyle={styles.prompt}
            containerStyle={styles.promptRow}
          >
            {TIMER.prompt}
          </IconText>
          <View style={styles.resultRow}>
            {TASK_LOG_RESULTS.map(({ result, label }, index) => {
              const Button = index === 0 ? PrimaryButton : SecondaryButton

              return (
                <Button
                  key={result}
                  title={label}
                  icon={RESULT_ICONS[result]}
                  disabled={mutation.isPending}
                  onPress={() => submitResult(result)}
                  testID={`timer-${result}`}
                  style={styles.resultButton}
                />
              )
            })}
          </View>
          <ErrorText>{mutation.isError ? TIMER.submitFailed : null}</ErrorText>
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  card: { padding: 24, alignItems: 'center' },
  time: { fontSize: 48, color: colors.text, marginBottom: 16, fontVariant: ['tabular-nums'] },
  prompt: { fontSize: 18 },
  promptRow: { marginBottom: 16 },
  resultRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  resultButton: { paddingHorizontal: 14 },
})
