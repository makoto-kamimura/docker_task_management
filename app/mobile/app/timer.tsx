import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTimerStore } from '../src/store/timer-store'
import { createTaskLog, type TaskLogResult } from '../src/api/taskLogs'
import { colors } from '../src/theme'

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function TimerScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { task, startedAt, clear } = useTimerStore()
  const totalSeconds = (task?.durationMinutes ?? 0) * 60
  const [remaining, setRemaining] = useState(totalSeconds)
  const [finished, setFinished] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!task || finished) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [task, finished])

  const mutation = useMutation({
    mutationFn: createTaskLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['compass-today'] })
      setSubmitted(true)
      clear()
      router.replace('/(tabs)/today')
    },
  })

  useEffect(() => {
    if ((!task || !startedAt) && !submitted) {
      router.replace('/(tabs)/today')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, startedAt, submitted])

  if (!task || !startedAt) {
    return null
  }

  const elapsedSeconds = totalSeconds - remaining

  function submitResult(result: TaskLogResult) {
    if (!task || !startedAt) return
    mutation.mutate({
      task_id: task.id,
      started_at: startedAt,
      result,
      elapsed_seconds: elapsedSeconds,
      source: 'mobile',
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>

      {!finished && (
        <View style={styles.card}>
          <Text style={styles.time}>{formatTime(remaining)}</Text>
          <Pressable style={styles.secondaryButton} onPress={() => setFinished(true)} testID="timer-stop">
            <Text style={styles.secondaryButtonText}>終了する</Text>
          </Pressable>
        </View>
      )}

      {finished && (
        <View style={styles.card}>
          <Text style={styles.finishedText}>👏 お疲れ様！ できた？</Text>
          <View style={styles.resultRow}>
            <Pressable
              style={styles.primaryButton}
              disabled={mutation.isPending}
              onPress={() => submitResult('done')}
              testID="timer-done"
            >
              <Text style={styles.buttonText}>😊 完了</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              disabled={mutation.isPending}
              onPress={() => submitResult('partial')}
              testID="timer-partial"
            >
              <Text style={styles.secondaryButtonText}>😅 少しだけ</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              disabled={mutation.isPending}
              onPress={() => submitResult('skipped')}
              testID="timer-skipped"
            >
              <Text style={styles.secondaryButtonText}>❌ また今度</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  time: { fontSize: 48, color: colors.text, marginBottom: 16 },
  finishedText: { fontSize: 18, color: colors.text, marginBottom: 16 },
  resultRow: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondaryButtonText: { color: colors.text, fontWeight: '600' },
})
