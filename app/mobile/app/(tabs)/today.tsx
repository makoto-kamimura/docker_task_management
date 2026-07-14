import { useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { fetchTodayRecommendation } from '../../src/api/compass'
import { useTimerStore, DEFAULT_DURATION_MINUTES } from '../../src/store/timer-store'
import { colors } from '../../src/theme'

export default function TodayScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ autostart?: string }>()
  const startTimer = useTimerStore((state) => state.start)
  const { data: task, isLoading } = useQuery({
    queryKey: ['compass-today'],
    queryFn: fetchTodayRecommendation,
  })
  const autoStarted = useRef(false)

  function handleStart() {
    if (!task) return
    startTimer({
      id: task.id,
      title: task.title,
      durationMinutes: task.duration_minutes ?? DEFAULT_DURATION_MINUTES,
    })
    router.push('/timer')
  }

  useEffect(() => {
    if (params.autostart === '1' && task && !autoStarted.current) {
      autoStarted.current = true
      handleStart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.autostart, task])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧭 今日の一歩</Text>

      {isLoading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {!isLoading && !task && (
        <Text style={styles.hint}>やりたいことを2件以上登録すると、おすすめが表示されます。</Text>
      )}
      {task && (
        <View style={styles.card}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.duration}>{task.duration_minutes ?? DEFAULT_DURATION_MINUTES}分</Text>
          <Pressable style={styles.button} onPress={handleStart} testID="today-start-button">
            <Text style={styles.buttonText}>開始する</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: colors.text },
  hint: { color: colors.textMuted },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  taskTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
  duration: { color: colors.textMuted, marginBottom: 16 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
