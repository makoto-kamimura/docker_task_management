import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { logout as logoutRequest } from '../api/auth'

export function AppLayout() {
  const clearToken = useAuthStore((state) => state.clearToken)

  async function handleLogout() {
    try {
      await logoutRequest()
    } finally {
      clearToken()
    }
  }

  return (
    <div>
      <nav className="nav">
        <NavLink to="/today" className={({ isActive }) => (isActive ? 'active' : '')}>
          今日の一歩
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
          やりたいこと
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
          二択で選ぶ
        </NavLink>
        <NavLink to="/ranking" className={({ isActive }) => (isActive ? 'active' : '')}>
          ランキング
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          ダッシュボード
        </NavLink>
        <button className="button-secondary" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
          ログアウト
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
