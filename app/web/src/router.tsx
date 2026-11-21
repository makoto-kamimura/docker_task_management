import { Navigate, createBrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TasksPage } from './pages/TasksPage'
import { TodoPage } from './pages/TodoPage'
import { ComparePage } from './pages/ComparePage'
import { TodayPage } from './pages/TodayPage'
import { TimerPage } from './pages/TimerPage'
import { SchedulePage } from './pages/SchedulePage'
import { DashboardPage } from './pages/DashboardPage'
import { ResumePage } from './pages/ResumePage'
import { AccountPage } from './pages/AccountPage'
import { SsoCompletePage } from './pages/SsoCompletePage'
import { GuestRoute, ProtectedRoute } from './components/AuthRoutes'
import { AppLayout } from './components/AppLayout'
import { SCREEN_PATHS } from './lib/routes'

export const router = createBrowserRouter([
  // SSO から戻ってくる画面。ログイン (未ログイン) と連携 (ログイン済み) の両方で使うので、ガードの外に置く
  { path: '/auth/sso/complete', element: <SsoCompletePage /> },
  {
    element: <GuestRoute />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: SCREEN_PATHS.today, element: <TodayPage /> },
          { path: SCREEN_PATHS.todo, element: <TodoPage /> },
          { path: SCREEN_PATHS.tasks, element: <TasksPage /> },
          { path: SCREEN_PATHS.compare, element: <ComparePage /> },
          { path: SCREEN_PATHS.schedule, element: <SchedulePage /> },
          { path: SCREEN_PATHS.resume, element: <ResumePage /> },
          { path: SCREEN_PATHS.dashboard, element: <DashboardPage /> },
          { path: '/timer', element: <TimerPage /> },
          { path: '/account', element: <AccountPage /> },
          // ランキングはダッシュボードに統合した。以前のブックマークを生かすために転送だけ残す。
          { path: '/ranking', element: <Navigate to={SCREEN_PATHS.dashboard} replace /> },
        ],
      },
    ],
  },
])
