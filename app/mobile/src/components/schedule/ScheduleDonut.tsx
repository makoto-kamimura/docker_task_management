import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg'
import { SCHEDULE } from '@shared/copy'
import {
  HOUR_LABELS,
  MINUTES_PER_DAY,
  donutAccessibilityLabel,
  donutGeometry,
  formatDuration,
  scheduledMinutes,
  type ScheduleSlice,
} from '@shared/schedule'
import { colors } from '../../theme'
import { sliceColor, sliceOpacity } from './icons'

const CX = 120
const CY = 120
const R_OUTER = 100
const R_INNER = 64
/** 時刻の目盛り数字を置く半径。 */
const R_HOUR_LABEL = 114

const geometry = donutGeometry(CX, CY, R_OUTER, R_INNER)

/** フォーム入力中の予定（未保存）。Web と同じく、時刻を動かすたびに破線で位置を示す。 */
export interface ScheduleDraft {
  start_minute: number
  end_minute: number
}

/**
 * 24 時間を 1 周とするドーナツ円グラフ。
 * Web にある直接ラベルとホバーの吹き出しは、この大きさでは文字が潰れ、タッチにはホバーがないため出さず、
 * 下の一覧（凡例）で識別する（design.md §6.2）。
 */
export function ScheduleDonut({ slices, draft }: { slices: ScheduleSlice[]; draft?: ScheduleDraft | null }) {
  const planned = scheduledMinutes(slices.map((slice) => slice.block))
  const hasDraft = !!draft && draft.end_minute > draft.start_minute

  return (
    <View style={styles.chart}>
      <Svg
        viewBox="8 8 224 224"
        style={styles.donut}
        accessibilityRole="image"
        accessibilityLabel={donutAccessibilityLabel(planned)}
      >
        {/* 空き時間のトラック。予定はこの上に載るので、残りがそのまま空きに見える。 */}
        <Circle
          cx={CX}
          cy={CY}
          r={geometry.trackRadius}
          fill="none"
          stroke={colors.chartTrack}
          strokeWidth={geometry.trackWidth}
        />

        {geometry.hourTicks().map(({ hour, from, to, major }) => (
          <Line
            key={hour}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
            stroke={colors.border}
            strokeWidth={major ? 1.5 : 1}
          />
        ))}

        {HOUR_LABELS.map((hour) => {
          const [x, y] = geometry.pointOf(geometry.angleOf(hour * 60), R_HOUR_LABEL)

          return (
            <SvgText key={hour} x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={colors.textMuted}>
              {String(hour)}
            </SvgText>
          )
        })}

        {slices.map((slice) => (
          <Path
            key={slice.block.id}
            d={geometry.slicePath(slice.block.start_minute, slice.block.end_minute)}
            fill={sliceColor(slice)}
            fillOpacity={sliceOpacity(slice)}
          />
        ))}

        {hasDraft && draft && (
          <Path
            d={geometry.arcPath(geometry.angleOf(draft.start_minute), geometry.angleOf(draft.end_minute))}
            fill="none"
            stroke={colors.accent}
            strokeWidth={3}
            strokeDasharray="4 3"
          />
        )}

        <G>
          <SvgText x={CX} y={CY - 12} textAnchor="middle" fontSize={12} fill={colors.textMuted}>
            {SCHEDULE.chartPlanned}
          </SvgText>
          <SvgText x={CX} y={CY + 12} textAnchor="middle" fontSize={20} fontWeight="600" fill={colors.text}>
            {formatDuration(planned)}
          </SvgText>
          <SvgText x={CX} y={CY + 32} textAnchor="middle" fontSize={12} fill={colors.textMuted}>
            {SCHEDULE.chartFree(formatDuration(MINUTES_PER_DAY - planned))}
          </SvgText>
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  chart: { alignItems: 'center', marginVertical: 8 },
  donut: { width: 240, height: 240 },
})
