import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTitlePreset, deleteTitlePreset } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import type { TitlePreset } from '@shared/types'

interface PresetEditorProps {
  /** 自分で登録した項目。既定の項目は消せないのでここには出さない。 */
  ownPresets: TitlePreset[]
  /** 登録した項目をすぐ使えるよう、そのままタイトルに入れる。 */
  onCreated: (label: string) => void
}

export function PresetEditor({ ownPresets, onCreated }: PresetEditorProps) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')

  const createMutation = useMutation({
    mutationFn: createTitlePreset,
    onSuccess: (preset) => {
      invalidate(queryClient, invalidates.titlePresets)
      setLabel('')
      onCreated(preset.label)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTitlePreset,
    onSuccess: () => invalidate(queryClient, invalidates.titlePresets),
  })

  function handleAdd() {
    if (!label.trim()) return
    deleteMutation.reset()
    createMutation.mutate(label.trim())
  }

  const error = createMutation.isError
    ? errorMessage(createMutation.error, SCHEDULE.presetCreateFailed)
    : deleteMutation.isError
      ? SCHEDULE.presetDeleteFailed
      : null

  return (
    <div className="schedule-preset-editor">
      <div className="schedule-preset-add">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            // フォーム全体が送信されて予定が登録されてしまうのを防ぐ。
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAdd()
            }
          }}
          placeholder={SCHEDULE.presetPlaceholder}
          maxLength={100}
          aria-label={SCHEDULE.presetInputLabel}
        />
        <button
          className="button"
          type="button"
          onClick={handleAdd}
          disabled={!label.trim() || createMutation.isPending}
        >
          {COMMON.add}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {ownPresets.length === 0 ? (
        <p className="hint-text">{SCHEDULE.presetsEmpty}</p>
      ) : (
        <ul className="schedule-preset-list">
          {ownPresets.map((preset) => (
            <li key={preset.id}>
              <span className="schedule-title">{preset.label}</span>
              <button
                className="tree-action"
                type="button"
                onClick={() => preset.id !== null && deleteMutation.mutate(preset.id)}
                disabled={deleteMutation.isPending}
              >
                {COMMON.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
