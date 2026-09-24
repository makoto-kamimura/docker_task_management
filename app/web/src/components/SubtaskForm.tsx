import { useState, type SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, TASKS } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'

interface SubtaskFormProps {
  parentId: number
  onClose: () => void
  /**
   * 追加後もフォームを開いたままにする。細分化では 1 つのタスクを続けて何件にも分解するため。
   * やりたいことのツリーでは 1 件足したら閉じる。
   */
  keepOpen?: boolean
  closeLabel?: string
}

export function SubtaskForm({ parentId, onClose, keepOpen = false, closeLabel = COMMON.cancel }: SubtaskFormProps) {
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

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim(), parent_id: parentId })
  }

  return (
    <form className="subtask-form" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={TASKS.subtaskPlaceholder}
        autoFocus
        required
      />
      <button className="button" type="submit" disabled={mutation.isPending}>
        {COMMON.add}
      </button>
      <button className="button-secondary" type="button" onClick={onClose}>
        {closeLabel}
      </button>
      {mutation.isError && <p className="error-text">{errorMessage(mutation.error, TASKS.createFailed)}</p>}
    </form>
  )
}
