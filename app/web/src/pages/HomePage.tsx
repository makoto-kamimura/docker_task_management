import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { APP_NAME, APP_TAGLINE, AUTH } from '@shared/copy'

export function HomePage() {
  return (
    <div className="page page-narrow landing">
      <h1 className="title-with-icon landing-title">
        <Compass size={40} aria-hidden="true" />
        {APP_NAME}
      </h1>
      <p className="landing-tagline">{APP_TAGLINE}</p>
      <div className="button-row">
        <Link className="button" to="/register">
          {AUTH.registerTitle}
        </Link>
        <Link className="button button-secondary" to="/login">
          {AUTH.loginTitle}
        </Link>
      </div>
    </div>
  )
}
