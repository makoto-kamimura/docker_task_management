import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TODAY } from '@shared/copy'
import { sessionSnapshot } from '@shared/today'
import { formatClock } from '@shared/timer'
import { useSessionStore } from '../../store/session-store'
import { ActionButton } from '../ui'
import { colors } from '../../theme'

/**
 * 隙間時間（15分）の残りを出す帯。Web の components/today/SessionBanner.tsx と同じ振る舞い。
 * 一歩が終わって今日の一歩に戻ったとき、まだ時間があるなら次の一歩へ促し、
 * 使い切っていたら区切りを提案する（利用フロー 3 のループ）。
 */
export function SessionBanner() {
  const startedAt = useSessionStore((state) => state.startedAt)
  const restart = useSessionStore((state) => state.restart)
  const clear = useSessionStore((state) => state.clear)
  const [now, setNow] = useState(() => Date.now())

  const snapshot = startedAt ? sessionSnapshot(startedAt, now) : null
  const isOver = snapshot?.isOver ?? false

  useEffect(() => {
    if (!startedAt || isOver) return
    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [startedAt, isOver])

  if (!snapshot) return null

  return (
    <View style={[styles.banner, isOver && styles.bannerOver]} testID="session-banner">
      <Text style={styles.time}>
        {isOver ? TODAY.sessionOver : TODAY.sessionRemaining(formatClock(snapshot.remainingSeconds))}
      </Text>
      {isOver ? (
        <View style={styles.actions}>
          <ActionButton title={TODAY.sessionContinue} onPress={restart} testID="session-continue" />
          <ActionButton title={TODAY.sessionFinish} onPress={clear} testID="session-finish" />
        </View>
      ) : (
        <Text style={styles.note}>{TODAY.sessionNext}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    gap: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    backgroundColor: colors.accentBg,
  },
  bannerOver: { borderColor: colors.border, backgroundColor: 'transparent' },
  time: { fontSize: 15, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  note: { fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
})
