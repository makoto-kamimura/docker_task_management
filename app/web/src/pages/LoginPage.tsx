import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth-store'
import { ApiError } from '../lib/api-client'

export function LoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await login({ email, password })
      setToken(token)
      navigate('/today')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '予期せぬエラーが発生しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>🧭 ログイン</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="button" type="submit" disabled={submitting}>
          ログイン
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        アカウントをお持ちでない方は <Link to="/register">新規登録</Link>
      </p>
    </div>
  )
}
