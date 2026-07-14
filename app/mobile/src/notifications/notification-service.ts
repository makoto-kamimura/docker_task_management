import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerDeviceToken } from '../api/devices'

export const TODAY_COMPASS_CATEGORY = 'TODAY_COMPASS'
export const START_ACTION = 'START'
export const LATER_ACTION = 'LATER'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function setupNotificationCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(TODAY_COMPASS_CATEGORY, [
    {
      identifier: START_ACTION,
      buttonTitle: '開始',
      options: { opensAppToForeground: true },
    },
    {
      identifier: LATER_ACTION,
      buttonTitle: 'あとで',
      options: { opensAppToForeground: false },
    },
  ])
}

export async function requestPermissionsAndRegisterDevice(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return false
  }

  await setupNotificationCategory()

  const devicePushToken = await Notifications.getDevicePushTokenAsync()

  await registerDeviceToken({
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    token: devicePushToken.data,
  })

  return true
}

/**
 * 通知タップ/アクション押下時のディープリンク先を返す。
 * [開始] または通知本体タップ時は「今日のコンパス」画面へ（自動でタイマー開始）、[あとで] は何もしない。
 * タイマーには「今日の一歩」タスクの情報が必要なため、今日のコンパス画面を経由してから開始する。
 */
export function resolveDeepLinkFromResponse(
  response: Notifications.NotificationResponse,
): { pathname: '/(tabs)/today'; params: { autostart: '1' } } | null {
  if (response.actionIdentifier === LATER_ACTION) {
    return null
  }

  // response.actionIdentifier === START_ACTION、または通知本体タップ(DEFAULT_ACTION_IDENTIFIER)
  return { pathname: '/(tabs)/today', params: { autostart: '1' } }
}
