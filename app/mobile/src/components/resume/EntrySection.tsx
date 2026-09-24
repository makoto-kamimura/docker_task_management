import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RESUME } from '@shared/copy'
import { ENTRY_KIND_LABELS, formatYearMonth } from '@shared/resume'
import type { ResumeEntry, ResumeEntryKind } from '@shared/types'
import { Card, Hint, SectionTitle } from '../ui'
import { colors } from '../../theme'

interface EntrySectionProps {
  title: string
  kinds: ResumeEntryKind[]
  rows: ResumeEntry[]
  /** 行ごとの操作（今の履歴書の編集・削除）。将来の履歴書の見本では出さない。 */
  renderActions?: (entry: ResumeEntry) => ReactNode
}

/** 履歴書の 1 欄（学歴・職歴 / 免許・資格）。Web の EntrySection と同じ見せ方。 */
export function EntrySection({ title, kinds, rows, renderActions }: EntrySectionProps) {
  return (
    <Card style={styles.card}>
      <SectionTitle>{title}</SectionTitle>
      {rows.length === 0 && <Hint>{RESUME.historyEmpty}</Hint>}
      {kinds.map((kind) => {
        const kindRows = rows.filter((row) => row.kind === kind)
        if (kindRows.length === 0) return null

        return (
          <View key={kind} style={styles.kind}>
            {kinds.length > 1 && <Text style={styles.kindTitle}>{ENTRY_KIND_LABELS[kind]}</Text>}
            {kindRows.map((entry) => (
              <View key={entry.id} style={[styles.row, entry.timeline === 'future' && styles.goalRow]}>
                <Text style={styles.date}>{formatYearMonth(entry.year, entry.month)}</Text>
                <View style={styles.body}>
                  <Text style={styles.content}>
                    {entry.content}
                    {entry.timeline === 'future' && <Text style={styles.badge}>{`  ${RESUME.goalBadge}`}</Text>}
                  </Text>
                  {renderActions && <View style={styles.actions}>{renderActions(entry)}</View>}
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  kind: { marginTop: 4 },
  kindTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 8, marginBottom: 2 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalRow: { backgroundColor: colors.accentBg },
  date: { width: 84, fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  body: { flex: 1, gap: 6 },
  content: { fontSize: 15, color: colors.text },
  badge: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
})
