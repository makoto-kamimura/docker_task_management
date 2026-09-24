import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileDown, FileUser, Flag } from 'lucide-react'
import {
  achieveResumeEntry,
  createResumeEntry,
  createResumeEntryTask,
  deleteResumeEntry,
  updateResumeEntry,
} from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, RESUME, SCREENS } from '@shared/copy'
import { invalidate, invalidates, queries } from '@shared/queries'
import {
  ENTRY_SECTIONS,
  RESUME_TABS,
  entriesOf,
  entryFormFrom,
  entryInputFrom,
  goalNode,
  initialEntryForm,
  previewProfile,
  type EntryFormState,
  type ProfileDraft,
} from '@shared/resume'
import { renderResumeBody, renderResumeHtml } from '@shared/resume-document'
import type { ResumeEntry, ResumeTimeline } from '@shared/types'
import { printHtml } from '../lib/print'
import { PageTitle } from '../components/PageTitle'
import { Tabs } from '../components/Tabs'
import { EntryForm } from '../components/resume/EntryForm'
import { EntrySection } from '../components/resume/EntrySection'
import { GoalCard } from '../components/resume/GoalCard'
import { ProfileCard } from '../components/resume/ProfileCard'
import { ResumePreview } from '../components/resume/ResumePreview'

const TAB_ITEMS = RESUME_TABS.map((key) => ({ key, label: RESUME.tabs[key] }))

export function ResumePage() {
  const queryClient = useQueryClient()
  // 表示中のタブは URL（?tab=future）に持ち、再読み込みやブックマークでも同じタブを開く。
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: ResumeTimeline = searchParams.get('tab') === 'future' ? 'future' : 'current'

  const { data: resume, isLoading } = useQuery(queries.resume())
  const { data: tasks } = useQuery(queries.taskTree())
  const [form, setForm] = useState<EntryFormState>(() => initialEntryForm(tab))
  // プロフィールの入力中の値。見本にも同じ値を映すので、プロフィール欄ではなくここで持つ。
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null)

  const entries = resume?.entries ?? []
  const goals = entriesOf(entries, 'future')

  // 見本の本文。保存前のプロフィールと、入力中の行（破線）を差し込む。PDF は保存済みの値だけで作る。
  const previewBody = useMemo(
    () =>
      resume
        ? renderResumeBody(resume, tab, {
            draft: {
              profile: profileDraft ? previewProfile(profileDraft) : null,
              entry: { editingId: form.editingId, input: entryInputFrom(form, tab) },
            },
          })
        : '',
    [resume, tab, profileDraft, form],
  )

  function resetForm(timeline: ResumeTimeline = tab) {
    saveMutation.reset()
    setForm(initialEntryForm(timeline))
  }

  function changeTab(next: ResumeTimeline) {
    setSearchParams(next === 'current' ? {} : { tab: next }, { replace: true })
    resetForm(next)
  }

  const saveMutation = useMutation({
    mutationFn: (current: EntryFormState) => {
      const input = entryInputFrom(current, tab)

      return current.editingId === null
        ? createResumeEntry(input)
        : updateResumeEntry(current.editingId, { kind: input.kind, year: input.year, month: input.month, content: input.content })
    },
    onSuccess: () => {
      invalidate(queryClient, invalidates.resume)
      setForm(initialEntryForm(tab))
    },
  })

  const rowMutation = useMutation({
    mutationFn: async ({ action, entry }: { action: 'achieve' | 'relink' | 'delete'; entry: ResumeEntry }) => {
      if (action === 'achieve') {
        await achieveResumeEntry(entry.id)
      } else if (action === 'relink') {
        await createResumeEntryTask(entry.id)
      } else {
        await deleteResumeEntry(entry.id)
      }
    },
    onSuccess: () => invalidate(queryClient, invalidates.resume),
  })

  function handleDelete(entry: ResumeEntry) {
    if (window.confirm(RESUME.deleteMessage(entry.content, entry.timeline === 'future'))) {
      rowMutation.mutate({ action: 'delete', entry })
    }
  }

  function handleAchieve(entry: ResumeEntry) {
    if (window.confirm(RESUME.achieveConfirm(entry.content))) {
      rowMutation.mutate({ action: 'achieve', entry })
    }
  }

  function startEditing(entry: ResumeEntry) {
    saveMutation.reset()
    setForm(entryFormFrom(entry))
  }

  const entryForm = (
    <EntryForm
      timeline={tab}
      form={form}
      onChange={setForm}
      onSubmit={() => saveMutation.mutate(form)}
      onCancel={() => resetForm()}
      isSaving={saveMutation.isPending}
      error={saveMutation.isError ? errorMessage(saveMutation.error, COMMON.saveFailed) : null}
    />
  )

  return (
    <div className="page">
      <PageTitle icon={FileUser}>{SCREENS.resume.title}</PageTitle>
      <Tabs tabs={TAB_ITEMS} value={tab} onChange={changeTab} label={RESUME.tabsLabel} idPrefix="resume" />
      <p className="hint-text">{tab === 'current' ? RESUME.currentIntro : RESUME.futureIntro}</p>

      {resume && (
        <div className="resume-toolbar">
          <button className="button button-secondary" type="button" onClick={() => printHtml(renderResumeHtml(resume, tab))}>
            <FileDown size={16} aria-hidden="true" />
            {RESUME.pdf(tab)}
          </button>
          <span className="hint-text">{RESUME.pdfWebHint}</span>
        </div>
      )}

      {isLoading && <p>{COMMON.loading}</p>}
      {rowMutation.isError && <p className="error-text">{errorMessage(rowMutation.error, COMMON.saveFailed)}</p>}

      {resume && (
        <div className="layout-preview" role="tabpanel" id={`resume-${tab}`} aria-labelledby={`resume-tab-${tab}`}>
          {/* 見本は左に固定し、右で入力しながら反映を確かめられるようにする（時間割の円グラフと同じ置き方）。 */}
          <aside className="layout-preview-sticky">
            <ResumePreview body={previewBody} label={RESUME.previewLabel} />
            <p className="hint-text">{RESUME.previewHint}</p>
          </aside>

          {tab === 'current' && (
            <div className="stack">
              <ProfileCard profile={resume.profile} draft={profileDraft} onDraftChange={setProfileDraft} />
              {ENTRY_SECTIONS.map((section) => (
                <EntrySection
                  key={section.key}
                  title={section.title}
                  kinds={section.kinds}
                  rows={entriesOf(entries, 'current', section.kinds)}
                  renderActions={(entry) => (
                    <>
                      <button className="tree-action" type="button" onClick={() => startEditing(entry)}>
                        {COMMON.edit}
                      </button>
                      <button
                        className="tree-action"
                        type="button"
                        onClick={() => handleDelete(entry)}
                        disabled={rowMutation.isPending}
                      >
                        {COMMON.delete}
                      </button>
                    </>
                )}
              />
            ))}
            {entryForm}
          </div>
          )}

          {tab === 'future' && (
            <div className="stack">
              <section className="card">
                <h2 className="title-with-icon">
                  <Flag size={18} aria-hidden="true" />
                  {RESUME.goalsTitle}
                </h2>
                {goals.length === 0 && <p className="hint-text">{RESUME.goalsEmpty}</p>}
                {/* タスク一覧が届く前に「タスクが削除されています」と誤表示しないよう、揃ってから出す。 */}
                {goals.length > 0 && !tasks && <p className="hint-text">{COMMON.loading}</p>}
                {goals.length > 0 && tasks && (
                  <ul className="goal-list">
                    {goals.map((entry) => (
                      <GoalCard
                        key={entry.id}
                        entry={entry}
                        node={goalNode(entry, tasks)}
                        onEdit={() => startEditing(entry)}
                        onAchieve={() => handleAchieve(entry)}
                        onRelink={() => rowMutation.mutate({ action: 'relink', entry })}
                        onDelete={() => handleDelete(entry)}
                        isBusy={rowMutation.isPending}
                      />
                    ))}
                  </ul>
              )}
            </section>
            {entryForm}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
