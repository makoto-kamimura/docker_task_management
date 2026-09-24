import type { ReactNode } from 'react'
import { RESUME } from '@shared/copy'
import { ENTRY_KIND_LABELS, formatYearMonth } from '@shared/resume'
import type { ResumeEntry, ResumeEntryKind } from '@shared/types'

interface EntrySectionProps {
  title: string
  kinds: ResumeEntryKind[]
  /** 年月順に並べた行。 */
  rows: ResumeEntry[]
  /** 行ごとの操作（今の履歴書の編集・削除）。将来の履歴書の見本では出さない。 */
  renderActions?: (entry: ResumeEntry) => ReactNode
}

/**
 * 履歴書の 1 欄（学歴・職歴 / 免許・資格）。JIS 様式どおり、学歴・職歴の欄は見出しで学歴と職歴を分ける。
 * 将来の行は「目標」の印を付けて、今の経歴の続きとして読めるようにする。
 */
export function EntrySection({ title, kinds, rows, renderActions }: EntrySectionProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="hint-text">{RESUME.historyEmpty}</p>}
      {kinds.map((kind) => {
        const kindRows = rows.filter((row) => row.kind === kind)
        if (kindRows.length === 0) return null

        return (
          <div key={kind} className="resume-kind">
            {kinds.length > 1 && <h3 className="resume-kind-title">{ENTRY_KIND_LABELS[kind]}</h3>}
            <ul className="resume-rows">
              {kindRows.map((entry) => (
                <li key={entry.id} className={entry.timeline === 'future' ? 'is-goal' : undefined}>
                  <span className="resume-date">{formatYearMonth(entry.year, entry.month)}</span>
                  <span className="resume-content">
                    {entry.content}
                    {entry.timeline === 'future' && <span className="resume-goal-badge">{RESUME.goalBadge}</span>}
                  </span>
                  {renderActions && <span className="tree-actions">{renderActions(entry)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
