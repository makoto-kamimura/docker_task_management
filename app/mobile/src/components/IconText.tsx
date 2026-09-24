import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface IconTextProps {
  icon: keyof typeof Ionicons.glyphMap
  color: string
  size?: number
  textStyle?: TextStyle
  containerStyle?: ViewStyle
  children: string
}

/**
 * 絵文字の代わりにアイコン＋テキストを横並びで表示する共通コンポーネント。
 */
export function IconText({ icon, color, size = 18, textStyle, containerStyle, children }: IconTextProps) {
  return (
    <View style={[styles.row, containerStyle]}>
      <Ionicons name={icon} size={size} color={color} />
      <Text style={[textStyle, { color }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
