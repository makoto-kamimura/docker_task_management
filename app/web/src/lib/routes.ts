import {
  CirclePlus,
  Compass,
  FileUser,
  GitCompareArrows,
  LayoutDashboard,
  ListTree,
  PieChart,
  type LucideIcon,
} from 'lucide-react'
import type { ScreenKey } from '@shared/copy'

/** ログイン後の各画面の URL。並び順と見出しは @shared/copy の SCREENS / NAV_SECTIONS。 */
export const SCREEN_PATHS: Record<ScreenKey, string> = {
  today: '/today',
  tasks: '/tasks',
  dashboard: '/dashboard',
  schedule: '/schedule',
  resume: '/resume',
  // 今日の一歩の中で実施する画面（ナビゲーションには出さない）。
  compare: '/compare',
  todo: '/todo',
}

/** ナビゲーションと見出しのアイコン。iOS のタブ（Ionicons）と同じ意味の絵柄。 */
export const SCREEN_ICONS: Record<ScreenKey, LucideIcon> = {
  today: Compass,
  tasks: CirclePlus,
  dashboard: LayoutDashboard,
  schedule: PieChart,
  resume: FileUser,
  compare: GitCompareArrows,
  todo: ListTree,
}
