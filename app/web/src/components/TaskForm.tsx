import { useState, type SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { TASKS } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'

/** やりたいこと（ルート）の追加フォーム。登録に要るのはタイトルだけ。 */
export function TaskForm() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('')
      invalidate(queryClient, invalidates.task)
    },
  })

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim() })
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">{TASKS.inputLabel}</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={TASKS.placeholder}
          required
        />
      </div>
      {mutation.isError && <p className="error-text">{errorMessage(mutation.error, TASKS.createFailed)}</p>}
      <button className="button" type="submit" disabled={mutation.isPending}>
        {TASKS.submit}
      </button>
    </form>
  )
}
