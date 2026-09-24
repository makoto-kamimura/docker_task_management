import { configureApiClient } from '@shared/api-client'
import { useAuthStore } from '../store/auth-store'

configureApiClient({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().clearToken(),
})
