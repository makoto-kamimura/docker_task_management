import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { COMMON, DASHBOARD } from '@shared/copy'
import { queries } from '@shared/queries'
import { formatRating, rankTasks } from '@shared/tasks'
import { Card, Hint, Screen, SectionTitle } from '../../src/components/ui'
import { colors } from '../../src/theme'

export default function DashboardScreen() {
  const { data, isLoading } = useQuery(queries.dashboard())
  const { data: tasks, isLoading: isRankingLoading } = useQuery(queries.ranking())
  const ranking = useMemo(() => rankTasks(tasks ?? []), [tasks])

  return (
    <Screen>
      {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}

      {data && (
        <>
          <Card style={styles.section}>
            <SectionTitle>{DASHBOARD.recommendation}</SectionTitle>
            <Text style={styles.body}>{data.today_recommendation?.title ?? DASHBOARD.noRecommendation}</Text>
          </Card>

          <Card style={[styles.section, styles.statRow]}>
            {[
              { label: DASHBOARD.completedThisWeek, value: data.completed_this_week },
              { label: DASHBOARD.comparisonCount, value: data.comparison_count },
              { label: DASHBOARD.streakDays, value: data.streak_days },
            ].map((stat) => (
              <View key={stat.label}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <Card style={styles.section}>
        <SectionTitle>{DASHBOARD.ranking}</SectionTitle>
        {isRankingLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}
        {!isRankingLoading && ranking.length === 0 && <Hint>{DASHBOARD.rankingEmpty}</Hint>}
        {ranking.map((task, index) => (
          <View key={task.id} style={styles.rankRow}>
            <Text style={styles.rankPosition}>{index + 1}</Text>
            <Text style={styles.rankTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={styles.rankScore}>{formatRating(task.rating)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  body: { fontSize: 16, color: colors.text },
  statRow: { flexDirection: 'row', gap: 24 },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankPosition: { minWidth: 20, color: colors.accent, fontSize: 14, fontWeight: '700' },
  rankTitle: { flex: 1, color: colors.text, fontSize: 15 },
  rankScore: { color: colors.textMuted, fontSize: 14 },
})
