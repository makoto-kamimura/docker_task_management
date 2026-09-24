import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COMMON, RESUME } from '@shared/copy'
import { ENTRY_KIND_LABELS, formatYearMonth, goalSteps } from '@shared/resume'
import { isStepLeaf, type TaskTreeNode } from '@shared/tasks'
import type { ResumeEntry } from '@shared/types'
import { SubtaskForm } from '../SubtaskForm'
import { ActionButton, Hint } from '../ui'
import { colors } from '../../theme'

interface GoalCardProps {
  entry: ResumeEntry
  /** 結んでいる「やりたいこと」のツリー。タスクを消していれば null。 */
  node: TaskTreeNode | null
  onEdit: () => void
  onAchieve: () => void
  onRelink: () => void
  onDelete: () => void
  isBusy: boolean
}

/** 将来の履歴書の目標 1 件と、そこへ向かうために必要なタスク。Web の GoalCard と同じ操作。 */
export function GoalCard({ entry, node, onEdit, onAchieve, onRelink, onDelete, isBusy }: GoalCardProps) {
  const [adding, setAdding] = useState(false)
  const steps = node ? goalSteps(node) : []

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="flag-outline" size={16} color={colors.accent} style={styles.titleIcon} />
        <View style={styles.titleBody}>
          <Text style={styles.meta}>
            {formatYearMonth(entry.year, entry.month)}・{ENTRY_KIND_LABELS[entry.kind]}
          </Text>
          <Text style={styles.title}>{entry.content}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionButton title={COMMON.edit} onPress={onEdit} />
        <ActionButton title={RESUME.achieve} onPress={onAchieve} disabled={isBusy} testID={`goal-achieve-${entry.id}`} />
        <ActionButton title={COMMON.delete} onPress={onDelete} disabled={isBusy} />
      </View>

      {node === null && (
        <View style={styles.missing}>
          <Hint>{RESUME.taskMissing}</Hint>
          <ActionButton title={RESUME.relinkTask} onPress={onRelink} disabled={isBusy} />
        </View>
      )}

      {node !== null && (
        <View style={styles.steps}>
          {steps.length === 0 && <Hint>{RESUME.stepsEmpty}</Hint>}
          {steps.map((step) => (
            <View key={step.task.id} style={[styles.step, { paddingLeft: (step.depth - 2) * 16 }]}>
              {isStepLeaf(step) && <Ionicons name="compass-outline" size={12} color={colors.textMuted} />}
              <Text style={[styles.stepText, isStepLeaf(step) && styles.leaf]}>{step.task.title}</Text>
            </View>
          ))}

          {adding ? (
            <SubtaskForm
              parentId={node.task.id}
              onClose={() => setAdding(false)}
              keepOpen
              closeLabel={COMMON.close}
              testIDPrefix={`goal-step-${entry.id}`}
            />
          ) : (
            <View style={styles.addRow}>
              <ActionButton title={RESUME.addStep} onPress={() => setAdding(true)} testID={`goal-add-step-${entry.id}`} />
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  titleRow: { flexDirection: 'row', gap: 6 },
  titleIcon: { marginTop: 3 },
  titleBody: { flex: 1 },
  meta: { fontSize: 12, color: colors.textMuted },
  title: { fontSize: 16, color: colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  missing: { marginTop: 8, gap: 6, alignItems: 'flex-start' },
  steps: { marginTop: 8, marginLeft: 22 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3 },
  stepText: { fontSize: 14, color: colors.text, flexShrink: 1 },
  leaf: { fontWeight: '600' },
  addRow: { flexDirection: 'row', marginTop: 6 },
})
