import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'

/** ログインが必要な画面。未ログインならログイン画面へ。 */
export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)

  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** トップ・ログイン・新規登録。ログイン済みなら今日の一歩へ（モバイルの起動時と同じ振る舞い）。 */
export function GuestRoute() {
  const token = useAuthStore((state) => state.token)

  return token ? <Navigate to="/today" replace /> : <Outlet />
}
