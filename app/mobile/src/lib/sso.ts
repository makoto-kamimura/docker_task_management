// SSO のモバイル側。アプリ内のブラウザで API の開始 URL を開き、認証サーバーでログインしたあと、
// ディープリンクで戻ってくる (Expo Go では exp://…/--/auth/sso、ビルド版では lifecompass://auth/sso)。
// 戻り URL の結果コードは、ここで作った code_verifier (PKCE) がないと交換できない。
import * as Crypto from 'expo-crypto'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { createSsoIntent, exchangeSso, ssoErrorMessage, ssoStartUrl, type SsoMode } from '@shared/sso'
import { useAuthStore } from '../store/auth-store'

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function base64url(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    const chars = i + 1 >= bytes.length ? 2 : i + 2 >= bytes.length ? 3 : 4
    for (let j = 0; j < chars; j++) out += B64URL[(n >> (18 - 6 * j)) & 63]
  }

  return out
}

async function challengeOf(verifier: string): Promise<string> {
  const b64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  })

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 認証サーバーの画面を開く。ログインならトークンを保存する。利用者が閉じたときは false */
export async function signInWithSso(mode: SsoMode): Promise<boolean> {
  const verifier = base64url(Crypto.getRandomBytes(32))
  const redirectUri = Linking.createURL('auth/sso')
  const params: Record<string, string> = {
    mode,
    client: 'mobile',
    code_challenge: await challengeOf(verifier),
    redirect_uri: redirectUri,
  }
  // 連携はログイン中の本人だけ。ブラウザには Bearer を渡せないので、先に intent を取る
  if (mode === 'link') params.intent = (await createSsoIntent()).intent

  const result = await WebBrowser.openAuthSessionAsync(ssoStartUrl(params), redirectUri)
  if (result.type !== 'success') return false
  const { queryParams } = Linking.parse(result.url)
  if (queryParams?.error) throw new Error(ssoErrorMessage(String(queryParams.error), mode) ?? 'failed')
  const code = queryParams?.code
  if (!code) throw new Error(ssoErrorMessage('failed', mode) ?? 'failed')

  const token = mode === 'link' ? useAuthStore.getState().token : null
  const res = await exchangeSso(String(code), verifier, token)
  if (res.status !== 200) throw new Error(res.data.message ?? ssoErrorMessage('failed', mode) ?? 'failed')
  if (mode === 'login') {
    if (!res.data.token) throw new Error(ssoErrorMessage('failed', mode) ?? 'failed')
    await useAuthStore.getState().setToken(res.data.token)
  }

  return true
}
