/**
 * 「今日の一歩」の流れ（利用フロー 3）で使う共通ロジック。
 *
 *   実施できるやりたいこと → 完了
 *   　　└ 15分でできない → 別のやりたいこと
 *   実施できるものが無い   → 二択で選ぶ（今日の一歩として実施）
 *   優先度が確定した       → やりたいことの細分化（今日の一歩として実施）
 *   どれも 15 分以内で終わったら → 改めて今日の一歩を選び直す
 *
 * 「まだ隙間時間が残っているか」を各端末で同じ計算にするため、残り時間はここで求める。
 */
import { DEFAULT_DURATION_MINUTES } from './timer'

/**
 * 隙間時間ひと区切りの長さ。通知で始まった隙間のうち、今日の一歩に充てる時間。
 * 一歩の既定の所要時間と同じにして、「15分あれば一歩進む」を単位にそろえる。
 */
export const SESSION_MINUTES = DEFAULT_DURATION_MINUTES

export interface SessionSnapshot {
  remainingSeconds: number
  /** 15 分を使い切った。ここで区切って終わってよい合図。 */
  isOver: boolean
}

/**
 * 隙間時間の残り。タイマーと同じく開始時刻との差で求めるので、
 * 画面を離れてもバックグラウンドに回ってもずれない。
 */
export function sessionSnapshot(startedAt: string, now: number): SessionSnapshot {
  const totalSeconds = SESSION_MINUTES * 60
  const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000))

  return {
    remainingSeconds: Math.max(0, totalSeconds - elapsedSeconds),
    isOver: elapsedSeconds >= totalSeconds,
  }
}
