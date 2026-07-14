import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { login } from '../src/api/auth'
import { useAuthStore } from '../src/store/auth-store'
import { ApiError } from '../src/lib/api-client'
import { colors } from '../src/theme'
import { requestPermissionsAndRegisterDevice } from '../src/notifications/notification-service'

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
      setError(err instanceof ApiError ? err.message : '予期せぬエラーが発生しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧭 ログイン</Text>

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email"
      />

      <Text style={styles.label}>パスワード</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="login-password"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting} testID="login-submit">
        <Text style={styles.buttonText}>ログイン</Text>
      </Pressable>

      <Link href="/register" style={styles.link}>
        アカウントをお持ちでない方は新規登録
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 24, color: colors.text },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 12 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 16, color: colors.accent, textAlign: 'center' },
})
