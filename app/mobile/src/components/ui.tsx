/**
 * 画面で共通して使う部品。Web の .button / .button-secondary / .tree-action / .card / .field に対応する。
 */
import type { ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import type { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme'
import { IconText } from './IconText'

type IconName = keyof typeof Ionicons.glyphMap

/**
 * 縦にスクロールする画面の器。入力中でもボタンを 1 回で押せるようにタップを通し、
 * iOS ではキーボードの高さぶん余白を足して、下のほうの入力欄が隠れないようにする。
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  )
}

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  icon?: IconName
  testID?: string
  style?: StyleProp<ViewStyle>
}

/** 主操作（Web の .button）。 */
export function PrimaryButton({ title, onPress, disabled, icon, testID, style }: ButtonProps) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
    >
      {icon ? (
        <IconText icon={icon} color={colors.onAccent} size={16} textStyle={styles.buttonText}>
          {title}
        </IconText>
      ) : (
        <Text style={[styles.buttonText, styles.primaryButtonText]}>{title}</Text>
      )}
    </Pressable>
  )
}

/** 副操作（Web の .button-secondary）。 */
export function SecondaryButton({ title, onPress, disabled, icon, testID, style }: ButtonProps) {
  return (
    <Pressable
      style={[styles.secondaryButton, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
    >
      {icon ? (
        <IconText icon={icon} color={colors.text} size={16} textStyle={styles.buttonText}>
          {title}
        </IconText>
      ) : (
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>{title}</Text>
      )}
    </Pressable>
  )
}

/** 一覧の行に並べる小さな操作（Web の .tree-action）。active は ON/OFF を持つ操作の ON。 */
export function ActionButton({
  title,
  onPress,
  disabled,
  active = false,
  testID,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
  testID?: string
}) {
  return (
    <Pressable
      style={[styles.actionButton, active && styles.actionButtonActive, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{title}</Text>
    </Pressable>
  )
}

/** 選択肢のチップ。Web の <select> や曜日のチェックボックスにあたる。 */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

/** 画面内の表示切り替え（Web の .tabs）。 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === value

        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, selected && styles.tabSelected]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chipRow}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>
}

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>
}

export function ErrorText({ children }: { children: string | null | undefined }) {
  if (!children) return null

  return <Text style={styles.error}>{children}</Text>
}

export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: 20, paddingBottom: 40 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  primaryButtonText: { color: colors.onAccent },
  secondaryButtonText: { color: colors.text },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  actionText: { fontSize: 13, color: colors.textMuted },
  actionTextActive: { color: colors.accent, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabSelected: { borderBottomColor: colors.accent },
  tabText: { fontSize: 15, color: colors.textMuted },
  tabTextSelected: { color: colors.accent, fontWeight: '600' },
  chipRow: { gap: 8, paddingBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: 180,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextSelected: { color: colors.accent, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.background,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  error: { color: colors.danger, fontSize: 14, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
})
