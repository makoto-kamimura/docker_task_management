import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { updateResumeProfile } from '@shared/api'
import { ApiError, errorMessage } from '@shared/api-client'
import { COMMON, RESUME } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import {
  PROFILE_SECTIONS,
  draftToProfileInput,
  formatProfileValue,
  hasAnyProfileValue,
  profileToDraft,
  type ProfileDraft,
  type ProfileField,
} from '@shared/resume'
import type { ResumeProfile } from '@shared/types'

function FieldInput({ field, value, onChange }: { field: ProfileField; value: string; onChange: (next: string) => void }) {
  const id = `profile-${field.key}`

  if (field.type === 'textarea') {
    return <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={field.maxLength} rows={4} />
  }

  if (field.type === 'boolean') {
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option value="true">有</option>
        <option value="false">無</option>
      </select>
    )
  }

  return (
    <input
      id={id}
      type={field.type === 'tel' ? 'tel' : field.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      min={field.type === 'number' ? 0 : undefined}
      autoComplete="off"
    />
  )
}

interface ProfileCardProps {
  profile: ResumeProfile
  /** 入力中の値。null のあいだは表示モード。見本に同じ値を映すため、画面側で持つ。 */
  draft: ProfileDraft | null
  onDraftChange: (draft: ProfileDraft | null) => void
}

/** 履歴書の個人情報・自由記述。ふだんは表示だけにし、「編集」で全項目のフォームに切り替える。 */
export function ProfileCard({ profile, draft, onDraftChange: setDraft }: ProfileCardProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateResumeProfile,
    onSuccess: () => {
      invalidate(queryClient, invalidates.resumeProfile)
      setDraft(null)
    },
  })

  const fieldErrors = mutation.error instanceof ApiError ? (mutation.error.errors ?? {}) : {}

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    if (draft) mutation.mutate(draftToProfileInput(draft))
  }

  function startEditing() {
    mutation.reset()
    setDraft(profileToDraft(profile))
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="title-with-icon">
          <UserRound size={18} aria-hidden="true" />
          {RESUME.profileTitle}
        </h2>
        {!draft && (
          <button className="tree-action" type="button" onClick={startEditing}>
            {RESUME.profileEdit}
          </button>
        )}
      </div>

      {!draft && !hasAnyProfileValue(profile) && <p className="hint-text">{RESUME.profileEmpty}</p>}

      {!draft && hasAnyProfileValue(profile) &&
        PROFILE_SECTIONS.map((section) => (
          <div key={section.title} className="profile-section">
            <h3>{section.title}</h3>
            <dl className="profile-list">
              {section.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'profile-row profile-row-wide' : 'profile-row'}>
                  <dt>{field.label}</dt>
                  <dd className={profile[field.key] === null ? 'muted-text' : undefined}>
                    {formatProfileValue(field, profile[field.key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

      {draft && (
        <form onSubmit={handleSubmit}>
          {PROFILE_SECTIONS.map((section) => (
            <fieldset key={section.title} className="profile-section">
              <legend>{section.title}</legend>
              {section.fields.map((field) => (
                <div key={field.key} className="field">
                  <label htmlFor={`profile-${field.key}`}>
                    {field.label}
                    {field.unit && `（${field.unit}）`}
                  </label>
                  <FieldInput
                    field={field}
                    value={draft[field.key]}
                    onChange={(next) => setDraft({ ...draft, [field.key]: next })}
                  />
                  {fieldErrors[field.key] && <p className="error-text">{fieldErrors[field.key][0]}</p>}
                </div>
              ))}
            </fieldset>
          ))}

          {mutation.isError && Object.keys(fieldErrors).length === 0 && (
            <p className="error-text">{errorMessage(mutation.error, COMMON.saveFailed)}</p>
          )}

          <div className="schedule-form-actions">
            <button className="button" type="submit" disabled={mutation.isPending}>
              {RESUME.profileSave}
            </button>
            <button className="button button-secondary" type="button" onClick={() => setDraft(null)}>
              {COMMON.cancel}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
