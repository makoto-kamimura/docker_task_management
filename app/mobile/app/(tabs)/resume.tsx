import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  achieveResumeEntry,
  createResumeEntry,
  createResumeEntryTask,
  deleteResumeEntry,
  updateResumeEntry,
} from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, RESUME } from '@shared/copy'
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
import { A4_POINTS, renderResumeHtml, resumeFileName } from '@shared/resume-document'
import type { Resume, ResumeEntry, ResumeTimeline } from '@shared/types'
import { IconText } from '../../src/components/IconText'
import { ActionButton, Card, ErrorText, Hint, Screen, SecondaryButton, SegmentedTabs } from '../../src/components/ui'
import { EntryForm } from '../../src/components/resume/EntryForm'
import { EntrySection } from '../../src/components/resume/EntrySection'
import { GoalCard } from '../../src/components/resume/GoalCard'
import { ProfileCard } from '../../src/components/resume/ProfileCard'
import { ResumePreviewModal } from '../../src/components/resume/ResumePreviewModal'
import { colors } from '../../src/theme'

const TAB_ITEMS = RESUME_TABS.map((key) => ({ key, label: RESUME.tabs[key] }))

/** iOS の印刷は CSS の @page の余白を使わないので、ここで 12mm（約 34pt）を付ける。 */
const PDF_MARGIN = 34

/** Web と同じ HTML から A4 の PDF を作り、共有シートで保存・送信できるようにする。 */
async function exportResumePdf(resume: Resume, timeline: ResumeTimeline) {
  const { uri } = await Print.printToFileAsync({
    html: renderResumeHtml(resume, timeline),
    width: A4_POINTS.width,
    height: A4_POINTS.height,
    margins: { left: PDF_MARGIN, top: PDF_MARGIN, right: PDF_MARGIN, bottom: PDF_MARGIN },
  })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: resumeFileName(timeline) })
  } else {
    await Print.printAsync({ uri })
  }
}

export default function ResumeScreen() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<ResumeTimeline>('current')
  const { data: resume, isLoading } = useQuery(queries.resume())
  const { data: tasks } = useQuery(queries.taskTree())
  const [form, setForm] = useState<EntryFormState>(() => initialEntryForm('current'))
  // プロフィールの入力中の値。見本にも同じ値を映すので、プロフィール欄ではなくここで持つ。
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const entries = resume?.entries ?? []
  const goals = entriesOf(entries, 'future')

  // 見本は開いたときだけ作る。保存前のプロフィールと、入力中の行（破線）を差し込む。
  const previewHtml = useMemo(
    () =>
      resume && isPreviewOpen
        ? renderResumeHtml(resume, tab, {
            preview: true,
            draft: {
              profile: profileDraft ? previewProfile(profileDraft) : null,
              entry: { editingId: form.editingId, input: entryInputFrom(form, tab) },
            },
          })
        : '',
    [resume, isPreviewOpen, tab, profileDraft, form],
  )

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

  const pdfMutation = useMutation({
    mutationFn: ({ data, timeline }: { data: Resume; timeline: ResumeTimeline }) => exportResumePdf(data, timeline),
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

  function resetForm(timeline: ResumeTimeline = tab) {
    saveMutation.reset()
    setForm(initialEntryForm(timeline))
  }

  function changeTab(next: ResumeTimeline) {
    setTab(next)
    resetForm(next)
  }

  function startEditing(entry: ResumeEntry) {
    saveMutation.reset()
    setForm(entryFormFrom(entry))
  }

  function handleDelete(entry: ResumeEntry) {
    Alert.alert(RESUME.deleteTitle, RESUME.deleteMessage(entry.content, entry.timeline === 'future'), [
      { text: COMMON.cancel, style: 'cancel' },
      { text: COMMON.delete, style: 'destructive', onPress: () => rowMutation.mutate({ action: 'delete', entry }) },
    ])
  }

  function handleAchieve(entry: ResumeEntry) {
    Alert.alert(RESUME.achieve, RESUME.achieveConfirm(entry.content), [
      { text: COMMON.cancel, style: 'cancel' },
      { text: RESUME.achieve, onPress: () => rowMutation.mutate({ action: 'achieve', entry }) },
    ])
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
    <Screen>
      <SegmentedTabs tabs={TAB_ITEMS} value={tab} onChange={changeTab} />
      <Hint>{tab === 'current' ? RESUME.currentIntro : RESUME.futureIntro}</Hint>

      {resume && (
        <View style={styles.toolbar}>
          <SecondaryButton
            title={RESUME.previewOpen}
            icon="eye-outline"
            onPress={() => setIsPreviewOpen(true)}
            testID={`resume-preview-${tab}`}
            style={styles.toolbarButton}
          />
          <SecondaryButton
            title={RESUME.pdf(tab)}
            icon="document-outline"
            onPress={() => pdfMutation.mutate({ data: resume, timeline: tab })}
            disabled={pdfMutation.isPending}
            testID={`resume-pdf-${tab}`}
            style={styles.toolbarButton}
          />
        </View>
      )}
      <ErrorText>{pdfMutation.isError ? RESUME.pdfFailed : null}</ErrorText>

      {isLoading && <ActivityIndicator accessibilityLabel={COMMON.loading} style={styles.loading} />}
      <ErrorText>{rowMutation.isError ? errorMessage(rowMutation.error, COMMON.saveFailed) : null}</ErrorText>

      {resume && tab === 'current' && (
        <>
          <ProfileCard profile={resume.profile} draft={profileDraft} onDraftChange={setProfileDraft} />
          {ENTRY_SECTIONS.map((section) => (
            <EntrySection
              key={section.key}
              title={section.title}
              kinds={section.kinds}
              rows={entriesOf(entries, 'current', section.kinds)}
              renderActions={(entry) => (
                <>
                  <ActionButton title={COMMON.edit} onPress={() => startEditing(entry)} />
                  <ActionButton title={COMMON.delete} onPress={() => handleDelete(entry)} disabled={rowMutation.isPending} />
                </>
              )}
            />
          ))}
          {entryForm}
        </>
      )}

      {resume && tab === 'future' && (
        <>
          <Card style={styles.goals}>
            <IconText icon="flag-outline" color={colors.text} size={18} textStyle={styles.goalsTitle}>
              {RESUME.goalsTitle}
            </IconText>
            {goals.length === 0 && <Hint>{RESUME.goalsEmpty}</Hint>}
            {/* タスク一覧が届く前に「タスクが削除されています」と誤表示しないよう、揃ってから出す。 */}
            {goals.length > 0 && !tasks && <ActivityIndicator accessibilityLabel={COMMON.loading} />}
            {goals.length > 0 &&
              tasks &&
              goals.map((entry) => (
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
          </Card>
          {entryForm}
        </>
      )}

      <ResumePreviewModal visible={isPreviewOpen} html={previewHtml} onClose={() => setIsPreviewOpen(false)} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  loading: { marginTop: 16 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  toolbarButton: { flexGrow: 1, paddingVertical: 10, paddingHorizontal: 12 },
  goals: { marginTop: 16 },
  goalsTitle: { fontSize: 18, fontWeight: '600' },
})
