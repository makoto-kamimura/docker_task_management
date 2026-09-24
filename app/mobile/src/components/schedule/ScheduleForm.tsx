import { useState, type Dispatch } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
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
import { Card, Chip, ChipRow, ErrorText, Label, PrimaryButton, SecondaryButton, SectionTitle, TextField } from '../ui'
import { colors } from '../../theme'
import { PresetEditor } from './PresetEditor'
import { TimeField } from './TimeField'

interface ScheduleFormProps {
  dayOfWeek: number
  state: ScheduleFormState
  dispatch: Dispatch<ScheduleFormAction>
  onSubmit: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
}

/** 予定の追加・編集フォーム。状態遷移は Web と同じ scheduleFormReducer に任せる。 */
export function ScheduleForm({ dayOfWeek, state, dispatch, onSubmit, onCancel, isSaving, error }: ScheduleFormProps) {
  const { data: tasks } = useQuery(queries.taskTree())
  // 既定の項目＋自分で登録した項目。並び順もサーバー側で決まっている。
  const { data: presets } = useQuery(queries.titlePresets())
  // 「よく使う項目」の編集パネル。ふだんは畳んでフォームを短く保つ。
  const [isEditingPresets, setIsEditingPresets] = useState(false)

  // Web は入力欄の下に出すサジェスト。モバイルは同じ絞り込みの結果をチップで並べる。
  const suggestions = titleSuggestions(presets ?? [], state.title)
  const isEditing = state.editingId !== null

  function handleSubmit() {
    if (!state.title.trim()) return
    onSubmit()
  }

  return (
    <Card style={styles.card}>
      <SectionTitle>{SCHEDULE.formTitle(WEEKDAY_LABELS[dayOfWeek], isEditing)}</SectionTitle>

      <Label>{SCHEDULE.taskLabel}</Label>
      <ChipRow>
        <Chip
          label={SCHEDULE.noTask}
          selected={state.taskId === null}
          onPress={() => dispatch({ type: 'setTask', taskId: null })}
        />
        {tasks?.map((task) => (
          <Chip
            key={task.id}
            label={task.title}
            selected={state.taskId === task.id}
            onPress={() => dispatch({ type: 'setTask', taskId: task.id, taskTitle: task.title })}
          />
        ))}
      </ChipRow>

      <Label>{SCHEDULE.titleLabel}</Label>
      <TextField
        value={state.title}
        onChangeText={(title) => dispatch({ type: 'setTitle', title })}
        placeholder={SCHEDULE.titlePlaceholder}
        maxLength={100}
        testID="schedule-title-input"
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <ChipRow>
            {suggestions.map((preset) => (
              <Chip
                key={preset.id ?? preset.label}
                label={preset.label}
                selected={false}
                onPress={() => dispatch({ type: 'setTitle', title: preset.label })}
              />
            ))}
          </ChipRow>
        </View>
      )}

      <Pressable onPress={() => setIsEditingPresets((current) => !current)} accessibilityRole="button">
        <Text style={styles.link}>{isEditingPresets ? SCHEDULE.presetsClose : SCHEDULE.presetsOpen}</Text>
      </Pressable>
      {isEditingPresets && (
        <PresetEditor
          ownPresets={ownTitlePresets(presets ?? [])}
          onCreated={(label) => dispatch({ type: 'setTitle', title: label })}
        />
      )}

      <View style={styles.timeRow}>
        <TimeField
          label={SCHEDULE.startLabel}
          value={state.startMinute}
          options={startMinuteOptions()}
          format={formatMinute}
          onChange={(minute) => dispatch({ type: 'setStart', minute })}
        />
        <TimeField
          label={SCHEDULE.endLabel}
          value={state.endMinute}
          options={endMinuteOptions(state.startMinute)}
          format={formatMinute}
          onChange={(minute) => dispatch({ type: 'setEnd', minute })}
        />
      </View>

      <ErrorText>{error}</ErrorText>

      <PrimaryButton
        title={SCHEDULE.submit(isEditing)}
        onPress={handleSubmit}
        disabled={isSaving}
        testID="schedule-save-button"
        style={styles.submit}
      />
      {isEditing && <SecondaryButton title={COMMON.cancel} onPress={onCancel} style={styles.cancel} />}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginTop: 20 },
  suggestions: { marginTop: 8 },
  link: { fontSize: 12, color: colors.accent, textDecorationLine: 'underline', marginTop: 4 },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  submit: { marginTop: 16 },
  cancel: { marginTop: 8 },
})
