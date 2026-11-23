import { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import { errorMessage } from '@shared/api-client'
import { COMMON } from '@shared/copy'
import { SSO_COPY, fetchSsoIdentities, setSsoOnly, unlinkSso, type SsoIdentities } from '@shared/sso'
import { Card, Hint, PrimaryButton, Screen, SecondaryButton } from '../src/components/ui'
import { signInWithSso } from '../src/lib/sso'
import { colors } from '../src/theme'

/** アカウント: SSO (共通のアカウント) の連携と「SSO だけでログインする」 */
export default function AccountScreen() {
  const [ids, setIds] = useState<SsoIdentities | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setIds(await fetchSsoIdentities())
    } catch (e) {
      Alert.alert(COMMON.unexpectedError, errorMessage(e, COMMON.unexpectedError))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true)
    try {
      await fn()
      if (done) Alert.alert(done)
      await load()
    } catch (e) {
      Alert.alert(COMMON.unexpectedError, e instanceof Error ? e.message : errorMessage(e, COMMON.unexpectedError))
    } finally {
      setBusy(false)
    }
  }

  const confirm = (title: string, label: string, onOk: () => void) =>
    Alert.alert(title, undefined, [
      { text: COMMON.cancel, style: 'cancel' },
      { text: label, style: 'destructive', onPress: onOk },
    ])

  const name = ids?.sso_name || 'SSO'
  const sso = ids?.identities.find((i) => i.provider === 'sso')

  return (
    <Screen>
      {ids && !ids.sso_enabled && <Hint>{SSO_COPY.disabled}</Hint>}
      {ids?.sso_enabled && (
        <Card>
          <Text style={styles.title}>{SSO_COPY.linkTitle(name)}</Text>
          <Hint>{SSO_COPY.linkDescription(name)}</Hint>
          {sso ? (
            <>
              <Text style={styles.body}>{SSO_COPY.linkedAs(sso.email ?? name)}</Text>
              <Text style={styles.body}>{SSO_COPY.ssoOnlyTitle(name, ids.sso_only)}</Text>
              <Hint>{SSO_COPY.ssoOnlyDescription}</Hint>
              {ids.sso_only ? (
                <SecondaryButton title={SSO_COPY.ssoOnlyOff} disabled={busy} onPress={() => void run(() => setSsoOnly(false))} />
              ) : ids.login_method === 'sso' ? (
                <PrimaryButton
                  title={SSO_COPY.ssoOnlyOn}
                  disabled={busy}
                  onPress={() => confirm(SSO_COPY.ssoOnlyConfirm(name), SSO_COPY.ssoOnlyOn, () => void run(() => setSsoOnly(true)))}
                />
              ) : (
                <Hint>{SSO_COPY.ssoOnlyNeedsSso(name)}</Hint>
              )}
              <SecondaryButton
                title={SSO_COPY.unlink}
                disabled={busy}
                onPress={() => confirm(SSO_COPY.unlinkConfirm(name), SSO_COPY.unlink, () => void run(() => unlinkSso()))}
                style={styles.gap}
              />
            </>
          ) : ids.can_link ? (
            <PrimaryButton title={SSO_COPY.link(name)} disabled={busy} onPress={() => void run(() => signInWithSso('link'), SSO_COPY.linked)} />
          ) : (
            <Hint>{SSO_COPY.demoDenied(name)}</Hint>
          )}
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 },
  body: { color: colors.text, marginTop: 8 },
  gap: { marginTop: 12 },
})
