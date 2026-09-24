import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { register } from '@shared/api'
import { ApiError } from '@shared/api-client'
import { AUTH, COMMON } from '@shared/copy'
import { useAuthStore } from '../store/auth-store'
import { PageTitle } from '../components/PageTitle'

export function RegisterPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)
    try {
      const { token } = await register({ name, email, password })
      setToken(token)
      navigate('/today')
    } catch (err) {
      setErrors(err instanceof ApiError && err.errors ? err.errors : { general: [COMMON.unexpectedError] })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow">
      <PageTitle icon={Compass}>{AUTH.registerTitle}</PageTitle>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{AUTH.name}</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          {errors.name && <p className="error-text">{errors.name[0]}</p>}
        </div>
        <div className="field">
          <label htmlFor="email">{AUTH.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {errors.email && <p className="error-text">{errors.email[0]}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">{AUTH.newPassword}</label>
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
          {AUTH.registerSubmit}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/login">{AUTH.toLogin}</Link>
      </p>
    </div>
  )
}
