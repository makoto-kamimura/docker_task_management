import { StyleSheet, Text, View, type KeyboardTypeOptions } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { IconText } from '../IconText'
import { ActionButton, Card, Chip, ErrorText, Hint, Label, PrimaryButton, SecondaryButton, TextField } from '../ui'
import { colors } from '../../theme'

const KEYBOARDS: Partial<Record<ProfileField['type'], KeyboardTypeOptions>> = {
  email: 'email-address',
  tel: 'phone-pad',
  number: 'number-pad',
  date: 'numbers-and-punctuation',
}

function FieldInput({ field, value, onChange }: { field: ProfileField; value: string; onChange: (next: string) => void }) {
  if (field.type === 'boolean') {
    return (
      <View style={styles.choices}>
        {[
          { value: '', label: '—' },
          { value: 'true', label: '有' },
          { value: 'false', label: '無' },
        ].map((choice) => (
          <Chip key={choice.label} label={choice.label} selected={value === choice.value} onPress={() => onChange(choice.value)} />
        ))}
      </View>
    )
  }

  return (
    <TextField
      value={value}
      onChangeText={onChange}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      keyboardType={KEYBOARDS[field.type] ?? 'default'}
      autoCapitalize="none"
      multiline={field.type === 'textarea'}
      style={field.type === 'textarea' ? styles.textarea : undefined}
      accessibilityLabel={field.label}
    />
  )
}

interface ProfileCardProps {
  profile: ResumeProfile
  /** 入力中の値。null のあいだは表示モード。見本に同じ値を映すため、画面側で持つ。 */
  draft: ProfileDraft | null
  onDraftChange: (draft: ProfileDraft | null) => void
}

/** 履歴書の個人情報・自由記述。Web の ProfileCard と同じ項目・同じ表示。 */
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

  function startEditing() {
    mutation.reset()
    setDraft(profileToDraft(profile))
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconText icon="person-outline" color={colors.text} size={18} textStyle={styles.title}>
          {RESUME.profileTitle}
        </IconText>
        {!draft && <ActionButton title={RESUME.profileEdit} onPress={startEditing} />}
      </View>

      {!draft && !hasAnyProfileValue(profile) && <Hint>{RESUME.profileEmpty}</Hint>}

      {!draft &&
        hasAnyProfileValue(profile) &&
        PROFILE_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.fields.map((field) => (
              <View key={field.key} style={styles.row}>
                <Text style={styles.rowLabel}>{field.label}</Text>
                <Text style={[styles.rowValue, profile[field.key] === null && styles.unset]}>
                  {formatProfileValue(field, profile[field.key])}
                </Text>
              </View>
            ))}
          </View>
        ))}

      {draft && (
        <>
          {PROFILE_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.fields.map((field) => (
                <View key={field.key}>
                  <Label>{field.unit ? `${field.label}（${field.unit}）` : field.label}</Label>
                  <FieldInput
                    field={field}
                    value={draft[field.key]}
                    onChange={(next) => setDraft({ ...draft, [field.key]: next })}
                  />
                  <ErrorText>{fieldErrors[field.key]?.[0]}</ErrorText>
                </View>
              ))}
            </View>
          ))}

          <ErrorText>
            {mutation.isError && Object.keys(fieldErrors).length === 0 ? errorMessage(mutation.error, COMMON.saveFailed) : null}
          </ErrorText>

          <PrimaryButton
            title={RESUME.profileSave}
            onPress={() => mutation.mutate(draftToProfileInput(draft))}
            disabled={mutation.isPending}
            style={styles.save}
          />
          <SecondaryButton title={COMMON.cancel} onPress={() => setDraft(null)} style={styles.cancel} />
        </>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '600' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 15, color: colors.text },
  unset: { color: colors.textMuted },
  choices: { flexDirection: 'row', gap: 8 },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  save: { marginTop: 20 },
  cancel: { marginTop: 8 },
})
