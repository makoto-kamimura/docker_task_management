import { GitCompareArrows } from 'lucide-react'
import { SCREENS } from '@shared/copy'
import { PageTitle } from '../components/PageTitle'
import { CompareBoard } from '../components/today/CompareBoard'

/**
 * 二択で選ぶ（単独で開いたとき）。ふだんは実施できるやりたいことが無くなった時点で
 * 「今日の一歩」の中に出るが、思い立ったときに順位を付け直せるよう URL は残してある。
 */
export function ComparePage() {
  return (
    <div className="page page-medium">
      <PageTitle icon={GitCompareArrows}>{SCREENS.compare.title}</PageTitle>
      <CompareBoard />
    </div>
  )
}
