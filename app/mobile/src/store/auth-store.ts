import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { queryClient } from '../lib/query-client'
import { syncAuthToWatch } from '../watch/sync'

const TOKEN_STORAGE_KEY = 'life-compass-token'

interface AuthState {
  token: string | null
  isHydrated: boolean
  hydrate: () => Promise<void>
  setToken: (token: string) => Promise<void>
  clearToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isHydrated: false,
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
    set({ token, isHydrated: true })
    syncAuthToWatch(token)
  },
  setToken: async (token) => {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token)
    set({ token })
    syncAuthToWatch(token)
  },
  clearToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
    // 別のアカウントでログインし直したときに、前のユーザーのデータが一瞬でも見えないようにする。
    queryClient.clear()
    set({ token: null })
    syncAuthToWatch(null)
  },
}))
