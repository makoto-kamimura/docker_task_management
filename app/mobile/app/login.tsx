import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { login } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { AUTH, COMMON } from '@shared/copy'
import { useAuthStore } from '../src/store/auth-store'
import { requestPermissionsAndRegisterDevice } from '../src/notifications/notification-service'
import { IconText } from '../src/components/IconText'
import { ErrorText, Label, PrimaryButton, Screen, TextField } from '../src/components/ui'
import { colors } from '../src/theme'

export default function LoginScreen() {
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

      <Link href="/register" style={styles.link}>
        {AUTH.toRegister}
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleText: { fontSize: 28, fontWeight: '600' },
  submit: { marginTop: 24 },
  link: { marginTop: 16, color: colors.accent, textAlign: 'center' },
})
