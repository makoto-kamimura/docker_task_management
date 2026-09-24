import { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SCHEDULE } from '@shared/copy'
import { colors } from '../../theme'

const OPTION_HEIGHT = 44

interface TimeFieldProps {
  label: string
  value: number
  options: number[]
  format: (minute: number) => string
  onChange: (minute: number) => void
}

/**
 * 時刻などの選択欄。Web の <select> にあたるものが RN にないので、選択肢の一覧をモーダルで開く。
 */
export function TimeField({ label, value, options, format, onChange }: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.button}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${format(value)}`}
      >
        <Text style={styles.buttonText}>{format(value)}</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{SCHEDULE.pickTime(label)}</Text>
            <FlatList
              data={options}
              keyExtractor={(minute) => String(minute)}
              initialScrollIndex={Math.max(0, options.indexOf(value))}
              getItemLayout={(_, index) => ({ length: OPTION_HEIGHT, offset: OPTION_HEIGHT * index, index })}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item)
                    setIsOpen(false)
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>{format(item)}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, color: colors.text },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'center', padding: 32 },
  sheet: { backgroundColor: colors.background, borderRadius: 12, padding: 16, maxHeight: '70%' },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  option: { height: OPTION_HEIGHT, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 8 },
  optionSelected: { backgroundColor: colors.accentBg },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.accent, fontWeight: '600' },
})
