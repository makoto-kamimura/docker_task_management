import { useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, fetchTasks } from '../../src/api/tasks'
import { ApiError } from '../../src/lib/api-client'
import { colors } from '../../src/theme'

export default function TasksScreen() {
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : '登録に失敗しました。')
    },
  })

  function handleSubmit() {
    if (!title.trim()) return
    mutation.mutate({ title: title.trim() })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>やりたいこと登録</Text>

      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="例: Reactを勉強する"
        onSubmitEditing={handleSubmit}
        testID="task-title-input"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={mutation.isPending} testID="task-add-button">
        <Text style={styles.buttonText}>追加する</Text>
      </Pressable>

      {isLoading && <ActivityIndicator style={{ marginTop: 16 }} />}
      <FlatList
        style={{ marginTop: 16 }}
        data={tasks ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 8 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  taskItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  taskTitle: { fontSize: 16, color: colors.text },
})
