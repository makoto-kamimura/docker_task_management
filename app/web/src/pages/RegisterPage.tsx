import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/auth-store'
import { ApiError } from '../lib/api-client'

export function RegisterPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const { token } = await register({ name, email, password })
      setToken(token)
      navigate('/today')
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
    <div className="page">
      <h1>🧭 新規登録</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">名前</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          {errors.name && <p className="error-text">{errors.name[0]}</p>}
        </div>
        <div className="field">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {errors.email && <p className="error-text">{errors.email[0]}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">パスワード（8文字以上）</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {errors.password && <p className="error-text">{errors.password[0]}</p>}
        </div>
        {errors.general && <p className="error-text">{errors.general[0]}</p>}
        <button className="button" type="submit" disabled={submitting}>
          登録する
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link>
      </p>
    </div>
  )
}
