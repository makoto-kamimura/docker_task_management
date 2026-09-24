import { useEffect, useState } from 'react'
import { Hourglass } from 'lucide-react'
import { TODAY } from '@shared/copy'
import { sessionSnapshot } from '@shared/today'
import { formatClock } from '@shared/timer'
import { useSessionStore } from '../../store/session-store'

/**
 * 隙間時間（15分）の残りを出す帯。
 * 一歩が終わって今日の一歩に戻ったとき、まだ時間があるなら次の一歩へ促し、
 * 使い切っていたら区切りを提案する（利用フロー 3 のループ）。
 */
export function SessionBanner() {
  const startedAt = useSessionStore((state) => state.startedAt)
  const restart = useSessionStore((state) => state.restart)
  const clear = useSessionStore((state) => state.clear)
  const [now, setNow] = useState(() => Date.now())

  const snapshot = startedAt ? sessionSnapshot(startedAt, now) : null
  const isOver = snapshot?.isOver ?? false

  useEffect(() => {
    if (!startedAt || isOver) return
    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [startedAt, isOver])

  if (!snapshot) return null

  return (
    <div className={`session-banner${isOver ? ' session-banner-over' : ''}`}>
      <p className="title-with-icon session-banner-time">
        <Hourglass size={16} aria-hidden="true" />
        {isOver ? TODAY.sessionOver : TODAY.sessionRemaining(formatClock(snapshot.remainingSeconds))}
      </p>
      {isOver ? (
        <span className="session-banner-actions">
          <button className="tree-action" type="button" onClick={restart}>
            {TODAY.sessionContinue}
          </button>
          <button className="tree-action" type="button" onClick={clear}>
            {TODAY.sessionFinish}
          </button>
        </span>
      ) : (
        <span className="session-banner-note">{TODAY.sessionNext}</span>
      )}
    </div>
  )
}
