import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { createTask, deleteTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, TASKS } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import {
  buildTaskTree,
  canAddChild,
  deleteTaskMessage,
  flattenTaskTree,
  isStepLeaf,
  type TaskTreeNode,
} from '@shared/tasks'
import { SubtaskForm } from '../../src/components/SubtaskForm'
import { ActionButton, ErrorText, Hint, Label, PrimaryButton, Screen, TextField } from '../../src/components/ui'
import { colors } from '../../src/theme'

/** 1 階層ぶんの字下げ。Web のツリー（.tree-children の padding-left）に合わせる。 */
const INDENT = 16

function TreeRow({ node, isAdding, onToggleAdd }: { node: TaskTreeNode; isAdding: boolean; onToggleAdd: () => void }) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => invalidate(queryClient, invalidates.task),
  })

  function handleDelete() {
    Alert.alert(TASKS.deleteTitle, deleteTaskMessage(node), [
      { text: COMMON.cancel, style: 'cancel' },
      { text: COMMON.delete, style: 'destructive', onPress: () => deleteMutation.mutate(node.task.id) },
    ])
  }

  return (
    <View style={{ marginLeft: (node.depth - 1) * INDENT }}>
      <View style={styles.row}>
        <View style={styles.titleRow}>
          {isStepLeaf(node) && <Ionicons name="compass-outline" size={14} color={colors.textMuted} />}
          <Text style={[styles.title, isStepLeaf(node) && styles.leafTitle]} numberOfLines={2}>
            {node.task.title}
          </Text>
        </View>
        <View style={styles.actions}>
          {canAddChild(node) && (
            <ActionButton title={TASKS.addChild} onPress={onToggleAdd} testID={`task-add-child-${node.task.id}`} />
          )}
          <ActionButton
            title={COMMON.delete}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            testID={`task-delete-${node.task.id}`}
          />
        </View>
      </View>
      {isAdding && <SubtaskForm parentId={node.task.id} onClose={onToggleAdd} testIDPrefix="subtask" />}
    </View>
  )
}

export default function TasksScreen() {
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useQuery(queries.taskTree())
  const [title, setTitle] = useState('')
  // 子タスクの入力欄は同時に 1 つだけ開く。
  const [addingParentId, setAddingParentId] = useState<number | null>(null)

  const rows = useMemo(() => flattenTaskTree(buildTaskTree(tasks ?? [])), [tasks])

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('')
      invalidate(queryClient, invalidates.task)
    },
  })

  function handleSubmit() {
    if (!title.trim()) return
    createMutation.mutate({ title: title.trim() })
  }

  return (
    <Screen>
      <Label>{TASKS.inputLabel}</Label>
      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder={TASKS.placeholder}
        onSubmitEditing={handleSubmit}
        testID="task-title-input"
      />
      <ErrorText>{createMutation.isError ? errorMessage(createMutation.error, TASKS.createFailed) : null}</ErrorText>
      <PrimaryButton
        title={TASKS.submit}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
        testID="task-add-button"
        style={styles.submit}
      />

      <View style={styles.list}>
        {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} />}
        {!isLoading && rows.length === 0 && <Hint>{TASKS.empty}</Hint>}
        {rows.map((node) => (
          <TreeRow
            key={node.task.id}
            node={node}
            isAdding={addingParentId === node.task.id}
            onToggleAdd={() => setAddingParentId((current) => (current === node.task.id ? null : node.task.id))}
          />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  submit: { marginTop: 12 },
  list: { marginTop: 16 },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  title: { fontSize: 16, color: colors.text, flexShrink: 1 },
  leafTitle: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6 },
})
