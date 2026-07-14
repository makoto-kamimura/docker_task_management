import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TasksPage } from './pages/TasksPage'
import { ComparePage } from './pages/ComparePage'
import { RankingPage } from './pages/RankingPage'
import { TodayPage } from './pages/TodayPage'
import { TimerPage } from './pages/TimerPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/tasks', element: <TasksPage /> },
          { path: '/compare', element: <ComparePage /> },
          { path: '/ranking', element: <RankingPage /> },
          { path: '/today', element: <TodayPage /> },
          { path: '/timer', element: <TimerPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
        ],
      },
    ],
  },
])
