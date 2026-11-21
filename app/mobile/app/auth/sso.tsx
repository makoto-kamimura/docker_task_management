import { useEffect } from 'react'
import { useRouter } from 'expo-router'

/**
 * 認証サーバーから戻るディープリンク (lifecompass://auth/sso?code=…) の受け口。
 * 結果は開いた画面 (src/lib/sso.ts の openAuthSessionAsync) が受け取るので、ここに来たらすぐに戻す。
 */
export default function SsoRedirect() {
  const router = useRouter()
  useEffect(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }, [router])

  return null
}
