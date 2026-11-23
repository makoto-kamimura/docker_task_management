// SSO の Web 側。code_verifier (PKCE) はこのタブの sessionStorage に持ち、交換もブラウザから行う。
// 戻ってきた結果コードは、ここにある code_verifier がないと交換できない (他人に URL を踏ませても成立しない)。
import { createSsoIntent, exchangeSso, ssoStartUrl, type SsoMode } from '@shared/sso'
import { useAuthStore } from '../store/auth-store'

const PKCE_KEY = 'life-compass-sso-pkce'

function b64url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))

  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function challengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))

  return b64url(new Uint8Array(digest))
}

/** 認証サーバーの画面へ移る。連携のときは、先にログイン中の本人として intent を取る */
export async function startSso(mode: SsoMode): Promise<void> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)))
  const params: Record<string, string> = { mode, client: 'web', code_challenge: await challengeOf(verifier) }
  if (mode === 'link') params.intent = (await createSsoIntent()).intent
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ mode, verifier, at: Date.now() }))
  window.location.href = ssoStartUrl(params)
}

/** 戻ってきたときの処理。ログイン / 連携を済ませ、移る先 (と画面に出す error) を返す */
export async function completeSso(search: URLSearchParams): Promise<string> {
  const raw = sessionStorage.getItem(PKCE_KEY)
  sessionStorage.removeItem(PKCE_KEY)
  const saved = raw ? (JSON.parse(raw) as { mode: SsoMode; verifier: string; at: number }) : null
  // このタブで始めた流れではない (または 10 分を過ぎた)
  if (!saved || Date.now() - saved.at > 10 * 60 * 1000) return '/login?sso_error=expired'
  const back = (reason: string) =>
    saved.mode === 'link' ? `/account?sso_error=${encodeURIComponent(reason)}` : `/login?sso_error=${encodeURIComponent(reason)}`
  const error = search.get('error')
  const code = search.get('code')
  if (error || !code) return back(error ?? 'failed')

  const token = saved.mode === 'link' ? useAuthStore.getState().token : null
  let res
  try {
    res = await exchangeSso(code, saved.verifier, token)
  } catch {
    return back('failed')
  }
  if (res.status !== 200) return back(res.status === 409 ? 'conflict' : res.status === 400 ? 'demo' : 'failed')
  if (saved.mode === 'link') return '/account?sso=linked'
  if (!res.data.token) return back('failed')
  useAuthStore.getState().setToken(res.data.token)

  return '/today'
}
