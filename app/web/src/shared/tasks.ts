import type { Task } from './types'

/** ツリーの最大階層（人生の目標 → やりたいこと → プロジェクト → サブタスク → 今日の一歩）。 */
export const MAX_TASK_DEPTH = 5

export interface TaskTreeNode {
  task: Task
  depth: number
  children: TaskTreeNode[]
}

/**
 * flat な一覧を親子のツリーにする。親が一覧に含まれない子（archived な親の子など）はルートとして扱う。
 * 兄弟の並びは API の返した順のまま。
 */
export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const childrenByParent = new Map<number | null, Task[]>()
  const ids = new Set(tasks.map((task) => task.id))

  for (const task of tasks) {
    const parentKey = task.parent_id !== null && ids.has(task.parent_id) ? task.parent_id : null
    const siblings = childrenByParent.get(parentKey) ?? []
    siblings.push(task)
    childrenByParent.set(parentKey, siblings)
  }

  function build(parentKey: number | null, depth: number): TaskTreeNode[] {
    return (childrenByParent.get(parentKey) ?? []).map((task) => ({
      task,
      depth,
      children: build(task.id, depth + 1),
    }))
  }

  return build(null, 1)
}

/** ツリーを表示順（親 → 子）の行に並べ直す。入れ子を描けないリスト（RN の FlatList）向け。 */
export function flattenTaskTree(roots: TaskTreeNode[]): TaskTreeNode[] {
  return roots.flatMap((node) => [node, ...flattenTaskTree(node.children)])
}

export function canAddChild(node: TaskTreeNode): boolean {
  return node.depth < MAX_TASK_DEPTH
}

/** 「今日の一歩」になりうる葉。ルート直下に子がないものは「やりたいこと」そのものなので印を付けない。 */
export function isStepLeaf(node: TaskTreeNode): boolean {
  return node.children.length === 0 && node.depth > 1
}

export function deleteTaskMessage(node: TaskTreeNode): string {
  return node.children.length > 0
    ? `「${node.task.title}」と配下のサブタスクをすべて削除します。よろしいですか？`
    : `「${node.task.title}」を削除します。よろしいですか？`
}

export interface BreakdownItem {
  task: Task
  children: Task[]
}

/** 分解待ち（needs_breakdown）のタスクを、その直下の子タスクと組にして返す。 */
export function buildBreakdownItems(tasks: Task[]): BreakdownItem[] {
  const childrenByParent = new Map<number, Task[]>()

  for (const task of tasks) {
    if (task.parent_id === null) continue
    const siblings = childrenByParent.get(task.parent_id) ?? []
    siblings.push(task)
    childrenByParent.set(task.parent_id, siblings)
  }

  return tasks
    .filter((task) => task.needs_breakdown)
    .map((task) => ({ task, children: childrenByParent.get(task.id) ?? [] }))
}

/**
 * 今日の一歩が「細分化」のときに出す 1 件。API が指した taskId のものを選び、
 * まだ取り直せていない間は先頭の分解待ちで代用する。
 */
export function findBreakdownItem(tasks: Task[], taskId: number | null | undefined): BreakdownItem | null {
  const items = buildBreakdownItems(tasks)

  return items.find((item) => item.task.id === taskId) ?? items[0] ?? null
}

/** ランキングの表示用に rating 降順へ並べる（API も同じ順で返すが、並びをここで保証する）。 */
export function rankTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.rating - a.rating)
}

export function formatRating(rating: number): string {
  return String(Math.round(rating))
}

/** パンくず（ルート → 葉の親）。 */
export function formatPath(path: { title: string }[]): string {
  return path.map((item) => item.title).join(' → ')
}
