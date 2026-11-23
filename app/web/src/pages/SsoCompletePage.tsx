import { useEffect } from 'react'
import { SSO_COPY } from '@shared/sso'
import { completeSso } from '../lib/sso'

/** 認証サーバーから API を経由して戻ってくる。結果コードと sessionStorage の code_verifier を交換する */
export function SsoCompletePage() {
  useEffect(() => {
    void completeSso(new URLSearchParams(window.location.search)).then((to) => window.location.replace(to))
  }, [])

  return (
    <div className="page page-narrow">
      <p className="muted">{SSO_COPY.signingIn}</p>
    </div>
  )
}
