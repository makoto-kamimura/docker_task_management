import { useEffect, useState } from 'react'
import { KeyRound, UserRound } from 'lucide-react'
import { errorMessage } from '@shared/api-client'
import { COMMON } from '@shared/copy'
import {
  SSO_COPY,
  fetchSsoIdentities,
  setSsoOnly,
  ssoErrorMessage,
  unlinkSso,
  type SsoIdentities,
} from '@shared/sso'
import { PageTitle } from '../components/PageTitle'
import { startSso } from '../lib/sso'

function formatDate(iso: string | null): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'medium', timeStyle: 'short' })
}

/** アカウント: SSO (共通のアカウント) の連携と「SSO だけでログインする」 */
export function AccountPage() {
  // SSO の連携から戻ってきたとき (?sso=linked / ?sso_error=...)
  const [initial] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.toString()) window.history.replaceState(null, '', window.location.pathname)

    return { linked: q.get('sso') === 'linked', error: ssoErrorMessage(q.get('sso_error'), 'link') }
  })
  const [ids, setIds] = useState<SsoIdentities | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(initial.error)
  const [notice, setNotice] = useState<string | null>(initial.linked ? SSO_COPY.linked : null)

  useEffect(() => {
    let alive = true
    fetchSsoIdentities()
      .then((r) => alive && setIds(r))
      .catch((e) => alive && setError(errorMessage(e, COMMON.unexpectedError)))

    return () => {
      alive = false
    }
  }, [])

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await fn()
      if (done) setNotice(done)
      setIds(await fetchSsoIdentities())
    } catch (e) {
      setError(errorMessage(e, COMMON.unexpectedError))
    } finally {
      setBusy(false)
    }
  }

  const name = ids?.sso_name || 'SSO'
  const sso = ids?.identities.find((i) => i.provider === 'sso')

  return (
    <div className="page page-narrow">
      <PageTitle icon={UserRound}>{SSO_COPY.accountTitle}</PageTitle>
      {ids && !ids.sso_enabled && <p className="muted">{SSO_COPY.disabled}</p>}
      {ids?.sso_enabled && (
        <section className="card stack">
          <h2 className="card-header">
            <KeyRound size={18} aria-hidden="true" /> {SSO_COPY.linkTitle(name)}
          </h2>
          <p className="hint">{SSO_COPY.linkDescription(name)}</p>
          {notice && <p className="hint">{notice}</p>}
          {error && <p className="error-text">{error}</p>}
          {sso ? (
            <>
              <p>
                <strong>{SSO_COPY.linkedAs(sso.email ?? name)}</strong>
                <br />
                <span className="hint">
                  連携した日時: {formatDate(sso.created_at)} / 最後に {name} でログイン: {formatDate(sso.last_login_at)}
                </span>
              </p>
              <p>
                <strong>{SSO_COPY.ssoOnlyTitle(name, ids.sso_only)}</strong>
                <br />
                <span className="hint">{SSO_COPY.ssoOnlyDescription}</span>
              </p>
              <div className="button-row">
                {ids.sso_only ? (
                  <button className="button button-secondary" disabled={busy} onClick={() => void run(() => setSsoOnly(false))}>
                    {SSO_COPY.ssoOnlyOff}
                  </button>
                ) : ids.login_method === 'sso' ? (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(SSO_COPY.ssoOnlyConfirm(name))) void run(() => setSsoOnly(true))
                    }}
                  >
                    {SSO_COPY.ssoOnlyOn}
                  </button>
                ) : null}
                <button
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(SSO_COPY.unlinkConfirm(name))) void run(() => unlinkSso())
                  }}
                >
                  {SSO_COPY.unlink}
                </button>
              </div>
              {!ids.sso_only && ids.login_method !== 'sso' && <p className="hint">{SSO_COPY.ssoOnlyNeedsSso(name)}</p>}
            </>
          ) : ids.can_link ? (
            <button className="button" disabled={busy} onClick={() => void run(() => startSso('link'))}>
              {SSO_COPY.link(name)}
            </button>
          ) : (
            <p className="hint">{SSO_COPY.demoDenied(name)}</p>
          )}
        </section>
      )}
    </div>
  )
}
