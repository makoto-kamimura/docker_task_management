import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTitlePreset, deleteTitlePreset } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { COMMON, SCHEDULE } from '@shared/copy'
import { invalidate, invalidates } from '@shared/queries'
import type { TitlePreset } from '@shared/types'
import { ActionButton, ErrorText, Hint, PrimaryButton, TextField } from '../ui'
import { colors } from '../../theme'

interface PresetEditorProps {
  /** 自分で登録した項目。既定の項目は消せないのでここには出さない。 */
  ownPresets: TitlePreset[]
  /** 登録した項目をすぐ使えるよう、そのままタイトルに入れる。 */
  onCreated: (label: string) => void
}

/** 「よく使う項目」の追加・削除。Web の PresetEditor と同じ振る舞い。 */
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
    <View style={styles.editor}>
      <View style={styles.addRow}>
        <TextField
          value={label}
          onChangeText={setLabel}
          onSubmitEditing={handleAdd}
          placeholder={SCHEDULE.presetPlaceholder}
          maxLength={100}
          accessibilityLabel={SCHEDULE.presetInputLabel}
          style={styles.input}
        />
        <PrimaryButton
          title={COMMON.add}
          onPress={handleAdd}
          disabled={!label.trim() || createMutation.isPending}
          style={styles.addButton}
        />
      </View>

      <ErrorText>{error}</ErrorText>

      {ownPresets.length === 0 ? (
        <Hint>{SCHEDULE.presetsEmpty}</Hint>
      ) : (
        ownPresets.map((preset) => (
          <View key={preset.id} style={styles.item}>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {preset.label}
            </Text>
            <ActionButton
              title={COMMON.delete}
              onPress={() => preset.id !== null && deleteMutation.mutate(preset.id)}
              disabled={deleteMutation.isPending}
            />
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  editor: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.panel,
  },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1 },
  addButton: { paddingVertical: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLabel: { fontSize: 14, color: colors.text, flexShrink: 1 },
})
