import { apiRequest } from '../lib/api-client'

export function registerDeviceToken(input: { platform: 'ios' | 'android'; token: string }) {
  return apiRequest<void>('/devices', { method: 'POST', body: input })
}
