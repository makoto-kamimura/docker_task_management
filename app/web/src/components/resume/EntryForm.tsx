import type { SubmitEvent } from 'react'
import { COMMON, RESUME } from '@shared/copy'
import {
  ENTRY_KINDS,
  ENTRY_KIND_LABELS,
  MONTH_OPTIONS,
  formatMonthOption,
  yearOptions,
  type EntryFormState,
} from '@shared/resume'
import type { ResumeEntryKind, ResumeTimeline } from '@shared/types'

interface EntryFormProps {
  timeline: ResumeTimeline
  form: EntryFormState
  onChange: (next: EntryFormState) => void
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

/** 学歴・職歴・免許資格の 1 行を追加・編集する。将来の履歴書では「目標」として登録する。 */
export function EntryForm({ timeline, form, onChange, onSubmit, onCancel, isSaving, error }: EntryFormProps) {
  const isEditing = form.editingId !== null
  const id = `resume-${timeline}`
  const years = yearOptions(timeline)
  // 編集中の行が選択肢の範囲外の年でも、選択が消えないように足しておく。
  const yearChoices = years.includes(form.year) ? years : [form.year, ...years]

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (!form.content.trim()) return
    onSubmit()
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{isEditing ? RESUME.editEntry : RESUME.addEntry(timeline)}</h2>

      <div className="field">
        <label htmlFor={`${id}-kind`}>{RESUME.kindLabel}</label>
        <select
          id={`${id}-kind`}
          value={form.kind}
          onChange={(e) => onChange({ ...form, kind: e.target.value as ResumeEntryKind })}
        >
          {ENTRY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {ENTRY_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>

      <div className="schedule-time-fields">
        <div className="field">
          <label htmlFor={`${id}-year`}>{RESUME.yearLabel}</label>
          <select id={`${id}-year`} value={form.year} onChange={(e) => onChange({ ...form, year: Number(e.target.value) })}>
            {yearChoices.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-month`}>{RESUME.monthLabel}</label>
          <select
            id={`${id}-month`}
            value={form.month ?? ''}
            onChange={(e) => onChange({ ...form, month: e.target.value === '' ? null : Number(e.target.value) })}
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month ?? 'none'} value={month ?? ''}>
                {formatMonthOption(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-content`}>{RESUME.contentLabel}</label>
        <input
          id={`${id}-content`}
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          placeholder={timeline === 'future' ? RESUME.futureContentPlaceholder : RESUME.contentPlaceholder(form.kind)}
          maxLength={200}
          required
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="schedule-form-actions">
        <button className="button" type="submit" disabled={isSaving}>
          {RESUME.submit(isEditing)}
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
