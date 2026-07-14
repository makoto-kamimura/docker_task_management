import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

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
  },
  setToken: async (token) => {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token)
    set({ token })
  },
  clearToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
    set({ token: null })
  },
}))
