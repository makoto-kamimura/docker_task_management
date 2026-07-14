import { Redirect, Tabs } from 'expo-router'
import { useAuthStore } from '../../src/store/auth-store'
import { colors } from '../../src/theme'

export default function TabsLayout() {
  const token = useAuthStore((state) => state.token)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (isHydrated && !token) {
    return <Redirect href="/login" />
  }

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.accent }}>
      <Tabs.Screen name="today" options={{ title: '今日の一歩' }} />
      <Tabs.Screen name="tasks" options={{ title: 'やりたいこと' }} />
      <Tabs.Screen name="compare" options={{ title: '二択で選ぶ' }} />
    </Tabs>
  )
}
