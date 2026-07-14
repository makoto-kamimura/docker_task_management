import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { register } from '../src/api/auth'
import { useAuthStore } from '../src/store/auth-store'
import { ApiError } from '../src/lib/api-client'
import { colors } from '../src/theme'
import { requestPermissionsAndRegisterDevice } from '../src/notifications/notification-service'

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
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else {
        setErrors({ general: ['予期せぬエラーが発生しました。'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧭 新規登録</Text>

      <Text style={styles.label}>名前</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} testID="register-name" />
      {errors.name && <Text style={styles.error}>{errors.name[0]}</Text>}

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="register-email"
      />
      {errors.email && <Text style={styles.error}>{errors.email[0]}</Text>}

      <Text style={styles.label}>パスワード（8文字以上）</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="register-password"
      />
      {errors.password && <Text style={styles.error}>{errors.password[0]}</Text>}

      {errors.general && <Text style={styles.error}>{errors.general[0]}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting} testID="register-submit">
        <Text style={styles.buttonText}>登録する</Text>
      </Pressable>

      <Link href="/login" style={styles.link}>
        すでにアカウントをお持ちの方はログイン
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
  error: { color: colors.danger, marginTop: 4 },
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
