import { useEffect, useRef } from 'react'
import { Stack, useRouter } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { useAuthStore } from '../src/store/auth-store'
import { resolveDeepLinkFromResponse, setupNotificationCategory } from '../src/notifications/notification-service'

const queryClient = new QueryClient()

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const router = useRouter()
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    hydrate()
    setupNotificationCategory()

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = resolveDeepLinkFromResponse(response)
      if (target) {
        router.push(target)
      }
    })

    return () => {
      responseListener.current?.remove()
    }
  }, [hydrate, router])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'ログイン' }} />
        <Stack.Screen name="register" options={{ headerShown: true, title: '新規登録' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="timer" options={{ headerShown: true, title: 'タイマー', presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  )
}
