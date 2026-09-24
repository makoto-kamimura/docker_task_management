import { Pressable, StyleSheet, Text } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { logout } from '@shared/api'
import { COMMON, FLOW_SCREENS, SCREENS, SCREEN_ORDER, type ScreenKey } from '@shared/copy'
import { useAuthStore } from '../../src/store/auth-store'
import { colors } from '../../src/theme'

/** タブのアイコン。Web の見出しのアイコン（lucide）と同じ意味の絵柄を選んでいる。 */
const TAB_ICONS: Record<ScreenKey, keyof typeof Ionicons.glyphMap> = {
  today: 'compass-outline',
  tasks: 'add-circle-outline',
  dashboard: 'stats-chart-outline',
  schedule: 'pie-chart-outline',
  resume: 'document-text-outline',
  compare: 'git-compare-outline',
  todo: 'git-branch-outline',
}

/** Web の上部メニュー右端のログアウトにあたる。どのタブからでも押せるようヘッダーに置く。 */
function LogoutButton() {
  const clearToken = useAuthStore((state) => state.clearToken)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // サーバー側のトークン破棄に失敗しても、端末からは必ずログアウトさせる。
    } finally {
      await clearToken()
    }
  }

  return (
    <Pressable onPress={handleLogout} style={styles.logout} accessibilityRole="button" testID="logout-button">
      <Text style={styles.logoutText}>{COMMON.logout}</Text>
    </Pressable>
  )
}

export default function TabsLayout() {
  const token = useAuthStore((state) => state.token)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (isHydrated && !token) {
    return <Redirect href="/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        // 5 つのタブを 1 行に収めるため、ラベルを標準より少し小さくする。
        tabBarLabelStyle: { fontSize: 10 },
        headerRight: () => <LogoutButton />,
      }}
    >
      {SCREEN_ORDER.map((key) => (
        <Tabs.Screen
          key={key}
          name={key}
          options={{
            title: SCREENS[key].nav,
            headerTitle: SCREENS[key].title,
            tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[key]} color={color} size={size} />,
          }}
        />
      ))}
      {/* 二択・細分化は「今日の一歩」の中で実施する。画面としては残すが、タブには出さない。 */}
      {FLOW_SCREENS.map((key) => (
        <Tabs.Screen key={key} name={key} options={{ href: null, headerTitle: SCREENS[key].title }} />
      ))}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logout: { paddingHorizontal: 16, paddingVertical: 8 },
  logoutText: { color: colors.accent, fontSize: 15 },
})
