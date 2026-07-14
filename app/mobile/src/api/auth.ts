import { apiRequest } from '../lib/api-client'
import type { User } from './types'

interface AuthResponse {
  user: User
  token: string
}

export function register(input: { name: string; email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input })
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input })
}

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' })
}
