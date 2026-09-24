import { CompareBoard } from '../../src/components/today/CompareBoard'
import { Screen } from '../../src/components/ui'

/**
 * 二択で選ぶ（単独で開いたとき）。ふだんは実施できるやりたいことが無くなった時点で
 * 「今日の一歩」の中に出るが、思い立ったときに順位を付け直せるよう画面は残してある。
 */
export default function CompareScreen() {
  return (
    <Screen>
      <CompareBoard />
    </Screen>
  )
}
