import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { AUTH, TIMER } from '@shared/copy'
import '../src/lib/api-client'
import { queryClient } from '../src/lib/query-client'
import { useAuthStore } from '../src/store/auth-store'
import { resolveDeepLinkFromResponse, setupNotificationCategory } from '../src/notifications/notification-service'

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const router = useRouter()

  useEffect(() => {
    hydrate()
    setupNotificationCategory()

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = resolveDeepLinkFromResponse(response)
      if (target) {
        router.push(target)
      }
    })

    return () => subscription.remove()
  }, [hydrate, router])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ headerShown: true, title: AUTH.loginTitle }} />
        <Stack.Screen name="register" options={{ headerShown: true, title: AUTH.registerTitle }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="timer" options={{ headerShown: true, title: TIMER.title, presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  )
}
