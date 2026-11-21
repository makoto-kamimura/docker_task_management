import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, AUTH } from '@shared/copy'

export function HomePage() {
  return (
    <div className="page page-narrow landing">
      <h1 className="title-with-icon landing-title">
        <img src="/favicon.svg" alt="" width={44} height={44} />
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
