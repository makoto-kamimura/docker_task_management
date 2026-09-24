import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { login } from '@shared/api'
import { errorMessage } from '@shared/api-client'
import { AUTH, COMMON } from '@shared/copy'
import { useAuthStore } from '../store/auth-store'
import { PageTitle } from '../components/PageTitle'

export function LoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await login({ email, password })
      setToken(token)
      navigate('/today')
    } catch (err) {
      setError(errorMessage(err, COMMON.unexpectedError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow">
      <PageTitle icon={Compass}>{AUTH.loginTitle}</PageTitle>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">{AUTH.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">{AUTH.password}</label>
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
          {AUTH.loginSubmit}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/register">{AUTH.toRegister}</Link>
      </p>
    </div>
  )
}
