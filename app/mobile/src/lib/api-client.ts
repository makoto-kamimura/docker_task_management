import { configureApiClient } from '@shared/api-client'
import { useAuthStore } from '../store/auth-store'

configureApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL as string,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().clearToken(),
})
