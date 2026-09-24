import { StyleSheet, View } from 'react-native'
import { COMMON, RESUME } from '@shared/copy'
import {
  ENTRY_KINDS,
  ENTRY_KIND_LABELS,
  MONTH_OPTIONS,
  formatMonthOption,
  yearOptions,
  type EntryFormState,
} from '@shared/resume'
import type { ResumeTimeline } from '@shared/types'
import { Card, Chip, ChipRow, ErrorText, Label, PrimaryButton, SecondaryButton, SectionTitle, TextField } from '../ui'
import { TimeField } from '../schedule/TimeField'

/** 月の選択肢をモーダルの数値一覧で扱うための置き換え（0 = 月を書かない）。 */
const NO_MONTH = 0

interface EntryFormProps {
  timeline: ResumeTimeline
  form: EntryFormState
  onChange: (next: EntryFormState) => void
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

/** 学歴・職歴・免許資格の 1 行を追加・編集する。Web の EntryForm と同じ項目。 */
export function EntryForm({ timeline, form, onChange, onSubmit, onCancel, isSaving, error }: EntryFormProps) {
  const isEditing = form.editingId !== null
  const years = yearOptions(timeline)
  const yearChoices = years.includes(form.year) ? years : [form.year, ...years]

  function handleSubmit() {
    if (!form.content.trim()) return
    onSubmit()
  }

  return (
    <Card style={styles.card}>
      <SectionTitle>{isEditing ? RESUME.editEntry : RESUME.addEntry(timeline)}</SectionTitle>

      <Label>{RESUME.kindLabel}</Label>
      <ChipRow>
        {ENTRY_KINDS.map((kind) => (
          <Chip
            key={kind}
            label={ENTRY_KIND_LABELS[kind]}
            selected={form.kind === kind}
            onPress={() => onChange({ ...form, kind })}
          />
        ))}
      </ChipRow>

      <View style={styles.dateRow}>
        <TimeField
          label={RESUME.yearLabel}
          value={form.year}
          options={yearChoices}
          format={(year) => `${year}年`}
          onChange={(year) => onChange({ ...form, year })}
        />
        <TimeField
          label={RESUME.monthLabel}
          value={form.month ?? NO_MONTH}
          options={MONTH_OPTIONS.map((month) => month ?? NO_MONTH)}
          format={(month) => formatMonthOption(month === NO_MONTH ? null : month)}
          onChange={(month) => onChange({ ...form, month: month === NO_MONTH ? null : month })}
        />
      </View>

      <Label>{RESUME.contentLabel}</Label>
      <TextField
        value={form.content}
        onChangeText={(content) => onChange({ ...form, content })}
        placeholder={timeline === 'future' ? RESUME.futureContentPlaceholder : RESUME.contentPlaceholder(form.kind)}
        maxLength={200}
        testID={`resume-${timeline}-content`}
      />

      <ErrorText>{error}</ErrorText>

      <PrimaryButton
        title={RESUME.submit(isEditing)}
        onPress={handleSubmit}
        disabled={isSaving}
        testID={`resume-${timeline}-submit`}
        style={styles.submit}
      />
      {isEditing && <SecondaryButton title={COMMON.cancel} onPress={onCancel} style={styles.cancel} />}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  submit: { marginTop: 16 },
  cancel: { marginTop: 8 },
})
