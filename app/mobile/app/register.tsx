import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { register } from '@shared/api'
import { ApiError } from '@shared/api-client'
import { AUTH, COMMON } from '@shared/copy'
import { useAuthStore } from '../src/store/auth-store'
import { requestPermissionsAndRegisterDevice } from '../src/notifications/notification-service'
import { IconText } from '../src/components/IconText'
import { ErrorText, Label, PrimaryButton, Screen, TextField } from '../src/components/ui'
import { colors } from '../src/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setErrors({})
    setSubmitting(true)
    try {
      const { token } = await register({ name, email, password })
      await setToken(token)
      requestPermissionsAndRegisterDevice().catch(() => {})
      router.replace('/(tabs)/today')
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { general: [COMMON.unexpectedError] })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <IconText icon="compass-outline" color={colors.text} size={26} textStyle={styles.titleText}>
        {AUTH.registerTitle}
      </IconText>

      <Label>{AUTH.name}</Label>
      <TextField value={name} onChangeText={setName} testID="register-name" />
      <ErrorText>{errors.name?.[0]}</ErrorText>

      <Label>{AUTH.email}</Label>
      <TextField
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="register-email"
      />
      <ErrorText>{errors.email?.[0]}</ErrorText>

      <Label>{AUTH.newPassword}</Label>
      <TextField value={password} onChangeText={setPassword} secureTextEntry testID="register-password" />
      <ErrorText>{errors.password?.[0]}</ErrorText>

      <ErrorText>{errors.general?.[0]}</ErrorText>

      <PrimaryButton
        title={AUTH.registerSubmit}
        onPress={handleSubmit}
        disabled={submitting}
        testID="register-submit"
        style={styles.submit}
      />

      <Link href="/login" style={styles.link}>
        {AUTH.toLogin}
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleText: { fontSize: 28, fontWeight: '600' },
  submit: { marginTop: 24 },
  link: { marginTop: 16, color: colors.accent, textAlign: 'center' },
})
