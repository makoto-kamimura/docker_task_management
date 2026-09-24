import { NavLink, Outlet } from 'react-router-dom'
import { Compass, LogOut } from 'lucide-react'
import { logout } from '@shared/api'
import { APP_NAME, COMMON, NAV_SECTIONS, SCREENS } from '@shared/copy'
import { useAuthStore } from '../store/auth-store'
import { SCREEN_ICONS, SCREEN_PATHS } from '../lib/routes'

/**
 * ログイン後の画面の枠。デスクトップでは左にナビゲーションを固定し、狭い画面では上部の横並びに畳む。
 */
export function AppLayout() {
  const clearToken = useAuthStore((state) => state.clearToken)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // サーバー側のトークン破棄に失敗しても、この端末からは必ずログアウトさせる。
    } finally {
      clearToken()
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="sidebar-brand">
          <Compass size={22} aria-hidden="true" />
          {APP_NAME}
        </p>
        <nav className="sidebar-nav" aria-label="メインメニュー">
          {/* 隙間時間に「進む」画面と、あとで「振り返る」画面を分けて並べる（利用フロー 1〜4）。 */}
          {NAV_SECTIONS.map((section) => (
            <div key={section.key} className="sidebar-section">
              <p className="sidebar-section-label">{section.label}</p>
              {section.screens.map((key) => {
                const Icon = SCREEN_ICONS[key]

                return (
                  <NavLink key={key} to={SCREEN_PATHS[key]} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{SCREENS[key].nav}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>{COMMON.logout}</span>
        </button>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
