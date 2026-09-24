import { useState, type Dispatch, type SubmitEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { COMMON, SCHEDULE } from '@shared/copy'
import { queries } from '@shared/queries'
import {
  WEEKDAY_LABELS,
  endMinuteOptions,
  formatMinute,
  ownTitlePresets,
  startMinuteOptions,
  titleSuggestions,
  type ScheduleFormAction,
  type ScheduleFormState,
} from '@shared/schedule'
import { PresetEditor } from './PresetEditor'

interface ScheduleFormProps {
  dayOfWeek: number
  state: ScheduleFormState
  dispatch: Dispatch<ScheduleFormAction>
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

/** 予定の追加・編集フォーム。状態遷移は共通の scheduleFormReducer に任せる。 */
export function ScheduleForm({ dayOfWeek, state, dispatch, onSubmit, onCancel, isSaving, error }: ScheduleFormProps) {
  const { data: tasks } = useQuery(queries.taskTree())
  // 既定の項目＋自分で登録した項目。並び順もサーバー側で決まっている。
  const { data: presets } = useQuery(queries.titlePresets())

  // タイトル入力欄のサジェスト。フォーカス中だけ出す。
  const [isSuggesting, setIsSuggesting] = useState(false)
  // 「よく使う項目」の編集パネル。ふだんは畳んでフォームを短く保つ。
  const [isEditingPresets, setIsEditingPresets] = useState(false)

  const suggestions = titleSuggestions(presets ?? [], state.title)
  const isEditing = state.editingId !== null

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!state.title.trim()) return
    onSubmit()
  }

  function selectTask(value: string) {
    const taskId = value === '' ? null : Number(value)
    const taskTitle = tasks?.find((task) => task.id === taskId)?.title
    dispatch({ type: 'setTask', taskId, taskTitle })
  }

  return (
    <form className="card schedule-form" onSubmit={handleSubmit}>
      <h2>{SCHEDULE.formTitle(WEEKDAY_LABELS[dayOfWeek], isEditing)}</h2>

      <div className="field">
        <label htmlFor="schedule-task">{SCHEDULE.taskLabel}</label>
        <select id="schedule-task" value={state.taskId ?? ''} onChange={(event) => selectTask(event.target.value)}>
          <option value="">{SCHEDULE.noTask}</option>
          {tasks?.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      <div className="field schedule-title-field">
        <label htmlFor="schedule-title">{SCHEDULE.titleLabel}</label>
        {/* サジェストは入力欄の真下に出したいので、位置の基準をこの入れ物にする。 */}
        <div className="schedule-title-input">
          <input
            id="schedule-title"
            value={state.title}
            onChange={(event) => dispatch({ type: 'setTitle', title: event.target.value })}
            onFocus={() => setIsSuggesting(true)}
            onBlur={() => setIsSuggesting(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsSuggesting(false)
            }}
            placeholder={SCHEDULE.titlePlaceholder}
            maxLength={100}
            required
            autoComplete="off"
            role="combobox"
            aria-expanded={isSuggesting && suggestions.length > 0}
            aria-controls="schedule-title-suggestions"
          />

          {isSuggesting && suggestions.length > 0 && (
            <ul className="schedule-suggestions" id="schedule-title-suggestions" role="listbox">
              {suggestions.map((preset) => (
                <li key={preset.id ?? preset.label}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    // blur が先に走ると click が届かないので、押し下げの時点で確定させる。
                    onMouseDown={(event) => {
                      event.preventDefault()
                      dispatch({ type: 'setTitle', title: preset.label })
                      setIsSuggesting(false)
                    }}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="link-button"
          type="button"
          aria-expanded={isEditingPresets}
          onClick={() => setIsEditingPresets((current) => !current)}
        >
          {isEditingPresets ? SCHEDULE.presetsClose : SCHEDULE.presetsOpen}
        </button>

        {isEditingPresets && (
          <PresetEditor
            ownPresets={ownTitlePresets(presets ?? [])}
            onCreated={(label) => dispatch({ type: 'setTitle', title: label })}
          />
        )}
      </div>

      <div className="schedule-time-fields">
        <div className="field">
          <label htmlFor="schedule-start">{SCHEDULE.startLabel}</label>
          <select
            id="schedule-start"
            value={state.startMinute}
            onChange={(event) => dispatch({ type: 'setStart', minute: Number(event.target.value) })}
          >
            {startMinuteOptions().map((minute) => (
              <option key={minute} value={minute}>
                {formatMinute(minute)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="schedule-end">{SCHEDULE.endLabel}</label>
          <select
            id="schedule-end"
            value={state.endMinute}
            onChange={(event) => dispatch({ type: 'setEnd', minute: Number(event.target.value) })}
          >
            {endMinuteOptions(state.startMinute).map((minute) => (
              <option key={minute} value={minute}>
                {formatMinute(minute)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="schedule-form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {SCHEDULE.submit(isEditing)}
        </button>
        {isEditing && (
          <button className="button button-secondary" type="button" onClick={onCancel}>
            {COMMON.cancel}
          </button>
        )}
      </div>
    </form>
  )
}
