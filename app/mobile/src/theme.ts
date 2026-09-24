/** Web（app/web/src/index.css のライトテーマ）と同じ値。 */
export const colors = {
  background: '#ffffff',
  text: '#08060d',
  textMuted: '#6b6375',
  border: '#e5e4e7',
  accent: '#aa3bff',
  accentBg: 'rgba(170, 59, 255, 0.1)',
  onAccent: '#ffffff',
  danger: '#e5484d',
  /** モーダルの背面。 */
  backdrop: 'rgba(8, 6, 13, 0.4)',
  /** 予定が載っていない時間帯（円グラフの地）。 */
  chartTrack: '#f1f0f4',
  /** 折りたたみパネルの面（Web の --panel-bg）。 */
  panel: 'rgba(244, 243, 236, 0.5)',
}

/**
 * 円グラフのカテゴリカル 8 色。web（--series-1〜8 のライトテーマ）と同じ値を使い、
 * 同じ予定が web とアプリで同じ色に見えるようにしている。
 */
export const series = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
]
