import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '../api/tasks'
import { ApiError } from '../lib/api-client'

export function TaskForm() {
  const queryClient = useQueryClient()
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim() })
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">やりたいこと（タイトルのみ）</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: Reactを勉強する"
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="button" type="submit" disabled={mutation.isPending}>
        追加する
      </button>
    </form>
  )
}
