import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SCHEDULE } from '@shared/copy'
import {
  EMPTY_DAY_STATS,
  WEEKDAY_LABELS,
  WEEK_ORDER,
  formatDuration,
  freeTimeLabel,
  todayDayOfWeek,
  visibleDayStats,
  weekdayAccessibilityLabel,
  type DayStats,
} from '@shared/schedule'
import { colors } from '../../theme'
import { DAY_STAT_ICONS } from './icons'

interface WeekBarProps {
  selected: number
  stats: Map<number, DayStats>
  onSelect: (day: number) => void
}

/** 月曜始まりの 7 曜日タブ。各曜日の空き時間と、睡眠・運動・スキマの合計を並べて比べられるようにする。 */
export function WeekBar({ selected, stats, onSelect }: WeekBarProps) {
  const today = todayDayOfWeek()

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar}>
      {WEEK_ORDER.map((day) => {
        const dayStats = stats.get(day) ?? EMPTY_DAY_STATS
        const isSelected = day === selected

        return (
          <Pressable
            key={day}
            style={[styles.weekday, isSelected && styles.weekdaySelected]}
            onPress={() => onSelect(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={weekdayAccessibilityLabel(day, dayStats)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{WEEKDAY_LABELS[day]}</Text>
            <Text style={styles.small}>{freeTimeLabel(dayStats)}</Text>
            {visibleDayStats(dayStats).map(({ key, minutes }) => (
              <View key={key} style={styles.stat}>
                <Ionicons name={DAY_STAT_ICONS[key]} size={10} color={colors.textMuted} />
                <Text style={styles.small}>{formatDuration(minutes)}</Text>
              </View>
            ))}
            {day === today && <Text style={styles.small}>{SCHEDULE.today}</Text>}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  bar: { gap: 6, marginTop: 16, paddingBottom: 4 },
  weekday: {
    alignItems: 'center',
    gap: 2,
    minWidth: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  weekdaySelected: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  labelSelected: { color: colors.accent },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  small: { fontSize: 10, color: colors.textMuted },
})
