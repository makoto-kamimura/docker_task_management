/**
 * SSO (共通の認証サーバー) の API と文言。Web とモバイルで共通。仕様は docker_auth_server の
 * docs/runbooks/app-integration.md。ブラウザの開き方と code_verifier の持ち方だけが端末ごとに違うので、
 * その部分は各アプリ側 (web/src/lib/sso.ts・mobile/src/lib/sso.ts) に置く。
 */
import { apiBaseUrl, apiRequest } from './api-client'

export type SsoMode = 'login' | 'link'

export interface SsoIdentities {
  sso_enabled: boolean
  sso_name: string | null
  can_link: boolean
  identities: { provider: string; email: string | null; created_at: string; last_login_at: string | null }[]
  sso_only: boolean
  login_method: 'pwd' | 'sso'
}

/** SSO が使えるか。使えないとき・取れないときは null (ボタンを出さない) */
export async function fetchSsoName(): Promise<string | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/auth/providers`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const json = (await res.json()) as { sso?: boolean; sso_name?: string | null }

    return json.sso ? json.sso_name || 'SSO' : null
  } catch {
    return null
  }
}

export function fetchSsoIdentities() {
  return apiRequest<SsoIdentities>('/me/identities')
}

export function createSsoIntent() {
  return apiRequest<{ intent: string }>('/me/identities/sso/intent', { method: 'POST', body: {} })
}

export function unlinkSso() {
  return apiRequest<{ unlinked: boolean }>('/me/identities/sso', { method: 'DELETE' })
}

export function setSsoOnly(enabled: boolean) {
  return apiRequest<{ sso_only: boolean }>('/me/sso-only', { method: 'PUT', body: { enabled } })
}

/** 開始の URL のクエリ (code_challenge などは端末側で作って渡す) */
export function ssoStartUrl(params: Record<string, string>): string {
  const q = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  return `${apiBaseUrl()}/auth/sso/start?${q}`
}

/** 結果コードと code_verifier の交換。連携のときはログイン中のトークンも送る */
export async function exchangeSso(code: string, verifier: string, token: string | null) {
  const res = await fetch(`${apiBaseUrl()}/auth/sso/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code, code_verifier: verifier }),
  })
  const data = (await res.json().catch(() => ({}))) as { mode?: SsoMode; token?: string; message?: string }

  return { status: res.status, data }
}

export const SSO_COPY = {
  or: 'または',
  login: (name: string) => `${name} でログイン`,
  loginHint: (name: string) => `「アカウント」で ${name} を連携した人だけが使えます。`,
  accountTitle: 'アカウント',
  linkTitle: (name: string) => `${name} でログイン`,
  linkDescription: (name: string) =>
    `共通のアカウントと連携すると、ほかのアプリと同じログインで入れます。このアプリには、${name} にパスキーでログインした場合だけ入れます。`,
  linked: '連携しました。',
  linkedAs: (email: string) => `連携済み: ${email}`,
  link: (name: string) => `${name} のアカウントと連携する`,
  unlink: '連携を解除',
  unlinkConfirm: (name: string) => `連携を解除しますか？「${name} だけ」も外れ、パスワードでログインできるようになります。`,
  demoDenied: (name: string) => `デモ用のアカウントには ${name} を連携できません。`,
  ssoOnlyTitle: (name: string, on: boolean) => `${name} だけでログインする: ${on ? 'オン' : 'オフ'}`,
  ssoOnlyDescription:
    'オンにすると、メールアドレスとパスワードではログインできなくなります。ほかの端末でパスワードで入っているログインも、その時点で切れます。',
  ssoOnlyOn: 'オンにする',
  ssoOnlyOff: 'オフにする',
  ssoOnlyConfirm: (name: string) => `${name} だけでログインしますか？ メールアドレスとパスワードではログインできなくなります。`,
  ssoOnlyNeedsSso: (name: string) =>
    `オンにするには、いったんログアウトして「${name} でログイン」で入り直してください（${name} で入れることを確かめるため）。`,
  disabled: 'この環境では共通のアカウントでのログイン（SSO）は使えません。',
  signingIn: 'ログインしています...',
} as const

/** API から戻ってきた error を、画面に出す文に変える */
export function ssoErrorMessage(reason: string | null | undefined, mode: SsoMode, name = 'SSO'): string | null {
  if (!reason) return null
  switch (reason) {
    case 'not_linked':
      return `この ${name} のアカウントは連携されていません。メールアドレスとパスワードでログインし、「アカウント」で連携してください。`
    case 'mfa_required':
      return `このアプリは 2 段階認証が必須です。${name} にパスキーでログインしてから、もう一度お試しください。`
    case 'cancelled':
      return mode === 'login' ? `${name} でのログインを中止しました。` : `${name} との連携を中止しました。`
    case 'expired':
      return '有効期限が切れました。もう一度やり直してください。'
    case 'conflict':
      return `この ${name} のアカウントは、ほかの利用者に連携されているか、すでに別のアカウントと連携済みです。`
    case 'demo':
      return `デモ用のアカウントには ${name} を連携できません。`
    default:
      return mode === 'login' ? `${name} でログインできませんでした。もう一度お試しください。` : `${name} と連携できませんでした。もう一度お試しください。`
  }
}
