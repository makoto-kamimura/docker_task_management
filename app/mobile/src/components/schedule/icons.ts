import type { Ionicons } from '@expo/vector-icons'
import type { DayStatKey, ScheduleSlice } from '@shared/schedule'
import { series } from '../../theme'

/** 睡眠・運動・スキマの合計に添えるアイコン。Web（lucide の Moon / Dumbbell / Coffee）と同じ意味の絵柄。 */
export const DAY_STAT_ICONS: Record<DayStatKey, keyof typeof Ionicons.glyphMap> = {
  sleep: 'moon-outline',
  exercise: 'barbell-outline',
  notify: 'cafe-outline',
}

export function sliceColor(slice: ScheduleSlice): string {
  return series[slice.colorIndex]
}

/**
 * 8 色を使い切ったあとは、同じ色相を薄くして区別する。
 * web はハッチングで分けているが、この大きさのリングでは縞が潰れるので明度差にしている。
 */
export function sliceOpacity(slice: ScheduleSlice): number {
  return slice.patternLevel === 0 ? 1 : Math.max(0.35, 1 - slice.patternLevel * 0.3)
}
