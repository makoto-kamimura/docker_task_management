import { Coffee, Dumbbell, Moon, type LucideIcon } from 'lucide-react'
import type { DayStatKey } from '@shared/schedule'

/** 睡眠・運動・スキマの合計に添えるアイコン。モバイル（Ionicons）も同じ意味の絵柄を使う。 */
export const DAY_STAT_ICONS: Record<DayStatKey, LucideIcon> = {
  sleep: Moon,
  exercise: Dumbbell,
  notify: Coffee,
}
