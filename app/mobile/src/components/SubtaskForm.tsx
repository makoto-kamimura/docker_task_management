import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, TASKS } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import { ErrorText, PrimaryButton, SecondaryButton, TextField } from './ui'

interface SubtaskFormProps {
  parentId: number
  onClose: () => void
  /**
   * 追加後もフォームを開いたままにする。細分化では 1 つのタスクを続けて何件にも分解するため。
   * やりたいことのツリーでは 1 件足したら閉じる。
   */
  keepOpen?: boolean
  closeLabel?: string
  testIDPrefix: string
}

/** 子タスクの追加フォーム。Web の components/SubtaskForm.tsx と同じ振る舞い。 */
export function SubtaskForm({
  parentId,
  onClose,
  keepOpen = false,
  closeLabel = COMMON.cancel,
  testIDPrefix,
}: SubtaskFormProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      invalidate(queryClient, invalidates.task)
      setTitle('')
      if (!keepOpen) onClose()
    },
  })

  function handleSubmit() {
    if (!title.trim()) return
    mutation.mutate({ title: title.trim(), parent_id: parentId })
  }

  return (
    <View style={styles.container}>
      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder={TASKS.subtaskPlaceholder}
        autoFocus
        onSubmitEditing={handleSubmit}
        testID={`${testIDPrefix}-input`}
      />
      <View style={styles.actions}>
        <PrimaryButton
          title={COMMON.add}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          testID={`${testIDPrefix}-add-button`}
          style={styles.button}
        />
        <SecondaryButton title={closeLabel} onPress={onClose} style={styles.button} />
      </View>
      <ErrorText>{mutation.isError ? errorMessage(mutation.error, TASKS.createFailed) : null}</ErrorText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 8, gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, paddingVertical: 10 },
})
