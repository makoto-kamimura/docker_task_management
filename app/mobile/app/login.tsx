import { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { login } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { AUTH, COMMON } from '@shared/copy'
import { SSO_COPY, fetchSsoName } from '@shared/sso'
import { signInWithSso } from '../src/lib/sso'
import { useAuthStore } from '../src/store/auth-store'
import { requestPermissionsAndRegisterDevice } from '../src/notifications/notification-service'
import { IconText } from '../src/components/IconText'
import { ErrorText, Hint, Label, PrimaryButton, Screen, SecondaryButton, TextField } from '../src/components/ui'
import { colors } from '../src/theme'

export default function LoginScreen() {
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sso, setSso] = useState<string | null>(null)

  useEffect(() => {
    void fetchSsoName().then(setSso)
  }, [])

  async function handleSso() {
    setError(null)
    setSubmitting(true)
    try {
      if (await signInWithSso('login')) {
        requestPermissionsAndRegisterDevice().catch(() => {})
        router.replace('/(tabs)/today')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : COMMON.unexpectedError)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await login({ email, password })
      await setToken(token)
      requestPermissionsAndRegisterDevice().catch(() => {})
      router.replace('/(tabs)/today')
    } catch (err) {
      setError(errorMessage(err, COMMON.unexpectedError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <IconText icon="compass-outline" color={colors.text} size={26} textStyle={styles.titleText}>
        {AUTH.loginTitle}
      </IconText>

      <Label>{AUTH.email}</Label>
      <TextField
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email"
      />

      <Label>{AUTH.password}</Label>
      <TextField value={password} onChangeText={setPassword} secureTextEntry testID="login-password" />

      <ErrorText>{error}</ErrorText>

      <PrimaryButton
        title={AUTH.loginSubmit}
        onPress={handleSubmit}
        disabled={submitting}
        testID="login-submit"
        style={styles.submit}
      />

      {sso && (
        <>
          <Hint>{SSO_COPY.or}</Hint>
          <SecondaryButton title={SSO_COPY.login(sso)} onPress={handleSso} disabled={submitting} testID="login-sso" />
          <Hint>{SSO_COPY.loginHint(sso)}</Hint>
        </>
      )}

      <Link href="/register" style={styles.link}>
        {AUTH.toRegister}
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: { width: 72, height: 72, marginBottom: 16 },
  titleText: { fontSize: 28, fontWeight: '600' },
  submit: { marginTop: 24 },
  link: { marginTop: 16, color: colors.accent, textAlign: 'center' },
})
