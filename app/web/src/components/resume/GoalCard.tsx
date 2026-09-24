import { useState } from 'react'
import { Compass, Flag } from 'lucide-react'
import { COMMON, RESUME } from '@shared/copy'
import { ENTRY_KIND_LABELS, formatYearMonth, goalSteps } from '@shared/resume'
import { isStepLeaf, type TaskTreeNode } from '@shared/tasks'
import type { ResumeEntry } from '@shared/types'
import { SubtaskForm } from '../SubtaskForm'

interface GoalCardProps {
  entry: ResumeEntry
  /** 結んでいる「やりたいこと」のツリー。タスクを消していれば null。 */
  node: TaskTreeNode | null
  onEdit: () => void
  onAchieve: () => void
  onRelink: () => void
  onDelete: () => void
  isBusy: boolean
}

/**
 * 将来の履歴書の目標 1 件と、そこへ向かうために必要なタスク（やりたいことのツリーの子孫）。
 * ここで足したタスクは「やりたいこと」「今日の一歩」にもそのまま出る。
 */
export function GoalCard({ entry, node, onEdit, onAchieve, onRelink, onDelete, isBusy }: GoalCardProps) {
  const [adding, setAdding] = useState(false)
  const steps = node ? goalSteps(node) : []

  return (
    <li className="goal-card">
      <div className="tree-row">
        <span className="goal-title">
          <Flag size={16} aria-hidden="true" />
          <span>
            <span className="resume-date">
              {formatYearMonth(entry.year, entry.month)}・{ENTRY_KIND_LABELS[entry.kind]}
            </span>
            <br />
            {entry.content}
          </span>
        </span>
        <span className="tree-actions">
          <button className="tree-action" type="button" onClick={onEdit}>
            {COMMON.edit}
          </button>
          <button className="tree-action" type="button" onClick={onAchieve} disabled={isBusy}>
            {RESUME.achieve}
          </button>
          <button className="tree-action" type="button" onClick={onDelete} disabled={isBusy}>
            {COMMON.delete}
          </button>
        </span>
      </div>

      {node === null && (
        <div className="goal-missing">
          <p className="hint-text">{RESUME.taskMissing}</p>
          <button className="tree-action" type="button" onClick={onRelink} disabled={isBusy}>
            {RESUME.relinkTask}
          </button>
        </div>
      )}

      {node !== null && (
        <>
          {steps.length === 0 ? (
            <p className="hint-text">{RESUME.stepsEmpty}</p>
          ) : (
            <ul className="goal-steps">
              {steps.map((step) => (
                <li key={step.task.id} style={{ paddingLeft: (step.depth - 2) * 16 }}>
                  {isStepLeaf(step) && <Compass size={12} aria-hidden="true" />}
                  <span className={isStepLeaf(step) ? 'tree-leaf' : undefined}>{step.task.title}</span>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <SubtaskForm parentId={node.task.id} onClose={() => setAdding(false)} keepOpen closeLabel={COMMON.close} />
          ) : (
            <button className="tree-action" type="button" onClick={() => setAdding(true)}>
              {RESUME.addStep}
            </button>
          )}
        </>
      )}
    </li>
  )
}
