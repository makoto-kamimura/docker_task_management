import { buildTaskTree, flattenTaskTree, type TaskTreeNode } from './tasks'
import type { ResumeEntry, ResumeEntryInput, ResumeEntryKind, ResumeProfile, ResumeTimeline, Task } from './types'

/** 履歴書の中のタブ。表示名は @shared/copy の RESUME.tabs。 */
export const RESUME_TABS = ['current', 'future'] as const satisfies readonly ResumeTimeline[]

export const ENTRY_KIND_LABELS: Record<ResumeEntryKind, string> = {
  education: '学歴',
  work: '職歴',
  license: '免許・資格',
}

export const ENTRY_KINDS: ResumeEntryKind[] = ['education', 'work', 'license']

/** JIS 様式の欄。学歴と職歴は 1 つの欄に見出しを分けて書き、免許・資格は別の欄にする。 */
export const ENTRY_SECTIONS: { key: string; title: string; kinds: ResumeEntryKind[] }[] = [
  { key: 'history', title: '学歴・職歴', kinds: ['education', 'work'] },
  { key: 'license', title: '免許・資格', kinds: ['license'] },
]

export function formatYearMonth(year: number, month: number | null): string {
  return month === null ? `${year}年` : `${year}年${month}月`
}

/** 履歴書に書く順（年月の古い順。月が未入力の行はその年の先頭）。API の並びと同じ。 */
export function sortEntries(entries: ResumeEntry[]): ResumeEntry[] {
  return [...entries].sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0) || a.id - b.id)
}

export function entriesOf(entries: ResumeEntry[], timeline: ResumeTimeline, kinds?: ResumeEntryKind[]): ResumeEntry[] {
  return sortEntries(
    entries.filter((entry) => entry.timeline === timeline && (kinds === undefined || kinds.includes(entry.kind))),
  )
}

/**
 * 将来の履歴書 = 今の履歴書に、なりたい将来の行を年月順に差し込んだもの。
 * 「この履歴書になるには何が要るか」を、今の経歴の続きとして読めるようにする。
 */
export function futureResumeRows(entries: ResumeEntry[], kinds: ResumeEntryKind[]): ResumeEntry[] {
  return sortEntries(entries.filter((entry) => kinds.includes(entry.kind)))
}

// ---- 行の入力フォーム ---------------------------------------------------------

export interface EntryFormState {
  editingId: number | null
  kind: ResumeEntryKind
  year: number
  month: number | null
  content: string
}

/** 今の行は今年から、将来の行は来年から入力を始める（多くはその先の目標を書くため）。 */
export function initialEntryForm(timeline: ResumeTimeline, kind: ResumeEntryKind = 'work', now = new Date()): EntryFormState {
  return {
    editingId: null,
    kind,
    year: now.getFullYear() + (timeline === 'future' ? 1 : 0),
    month: timeline === 'future' ? null : now.getMonth() + 1,
    content: '',
  }
}

export function entryFormFrom(entry: ResumeEntry): EntryFormState {
  return { editingId: entry.id, kind: entry.kind, year: entry.year, month: entry.month, content: entry.content }
}

export function entryInputFrom(form: EntryFormState, timeline: ResumeTimeline): ResumeEntryInput {
  return { timeline, kind: form.kind, year: form.year, month: form.month, content: form.content.trim() }
}

/** 年の選択肢。今の履歴書は過去 70 年、将来の履歴書は今年から 30 年先まで。 */
export function yearOptions(timeline: ResumeTimeline, now = new Date()): number[] {
  const thisYear = now.getFullYear()
  const [from, to] = timeline === 'future' ? [thisYear, thisYear + 30] : [thisYear - 70, thisYear]
  const years: number[] = []
  for (let year = to; year >= from; year--) years.push(year)

  return timeline === 'future' ? years.reverse() : years
}

/** 月の選択肢。null は「月を書かない」。 */
export const MONTH_OPTIONS: (number | null)[] = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function formatMonthOption(month: number | null): string {
  return month === null ? '—' : `${month}月`
}

// ---- 将来の行と「やりたいこと」 -------------------------------------------------

/** 将来の行が結んでいる「やりたいこと」のツリー。タスクを消していれば null。 */
export function goalNode(entry: ResumeEntry, tasks: Task[]): TaskTreeNode | null {
  if (entry.task_id === null) return null

  return buildTaskTree(tasks).find((root) => root.task.id === entry.task_id) ?? null
}

/** 目標に向けて必要なタスク（ルートの子孫を表示順に）。 */
export function goalSteps(node: TaskTreeNode): TaskTreeNode[] {
  return flattenTaskTree(node.children)
}

// ---- 個人情報・自由記述 -------------------------------------------------------

export type ProfileFieldKey = keyof ResumeProfile

export interface ProfileField {
  key: ProfileFieldKey
  label: string
  type: 'text' | 'date' | 'email' | 'tel' | 'textarea' | 'number' | 'boolean'
  placeholder?: string
  /** 数値の単位（表示用）。 */
  unit?: string
  maxLength?: number
}

/** 入力画面と表示の並び。JIS 様式の上から順。どの項目も任意。 */
export const PROFILE_SECTIONS: { title: string; fields: ProfileField[] }[] = [
  {
    title: '基本情報',
    fields: [
      { key: 'name', label: '氏名', type: 'text', placeholder: '山田 太郎', maxLength: 100 },
      { key: 'name_kana', label: 'ふりがな', type: 'text', placeholder: 'やまだ たろう', maxLength: 100 },
      { key: 'birth_date', label: '生年月日', type: 'date', placeholder: '1990-04-01' },
      { key: 'gender', label: '性別', type: 'text', placeholder: '任意', maxLength: 20 },
    ],
  },
  {
    title: '現住所',
    fields: [
      { key: 'postal_code', label: '郵便番号', type: 'text', placeholder: '123-4567', maxLength: 8 },
      { key: 'address', label: '住所', type: 'text', maxLength: 255 },
      { key: 'address_kana', label: '住所（ふりがな）', type: 'text', maxLength: 255 },
      { key: 'phone', label: '電話', type: 'tel', placeholder: '090-1234-5678', maxLength: 20 },
      { key: 'email', label: 'メール', type: 'email', maxLength: 255 },
    ],
  },
  {
    title: '連絡先（現住所以外に連絡を希望する場合）',
    fields: [
      { key: 'contact_postal_code', label: '郵便番号', type: 'text', placeholder: '123-4567', maxLength: 8 },
      { key: 'contact_address', label: '住所', type: 'text', maxLength: 255 },
      { key: 'contact_phone', label: '電話', type: 'tel', maxLength: 20 },
    ],
  },
  {
    title: '志望動機・自己PR',
    fields: [
      { key: 'motivation', label: '志望の動機', type: 'textarea', maxLength: 2000 },
      { key: 'self_pr', label: '特技・好きな学科・アピールポイントなど', type: 'textarea', maxLength: 2000 },
      { key: 'requests', label: '本人希望記入欄', type: 'textarea', maxLength: 2000 },
    ],
  },
  {
    title: 'その他',
    fields: [
      { key: 'commute_minutes', label: '通勤時間', type: 'number', unit: '分' },
      { key: 'dependents_count', label: '扶養家族数（配偶者を除く）', type: 'number', unit: '人' },
      { key: 'has_spouse', label: '配偶者', type: 'boolean' },
      { key: 'spouse_dependent', label: '配偶者の扶養義務', type: 'boolean' },
    ],
  },
]

export const PROFILE_FIELDS: ProfileField[] = PROFILE_SECTIONS.flatMap((section) => section.fields)

/** 満年齢。誕生日を迎えていなければ 1 引く。 */
export function ageOn(birthDate: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate)
  if (!match) return null

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const hadBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)

  return today.getFullYear() - year - (hadBirthday ? 0 : 1)
}

export const UNSET_LABEL = '未入力'

export function formatProfileValue(field: ProfileField, value: ResumeProfile[ProfileFieldKey], today = new Date()): string {
  if (value === null || value === '') return UNSET_LABEL

  switch (field.type) {
    case 'boolean':
      return value ? '有' : '無'
    case 'number':
      return `${value}${field.unit ?? ''}`
    case 'date': {
      const [year, month, day] = String(value).split('-').map(Number)
      const age = ageOn(String(value), today)

      return `${year}年${month}月${day}日${age === null ? '' : `（満${age}歳）`}`
    }
    default:
      return String(value)
  }
}

/** フォームの入力値（すべて文字列）。boolean は '' / 'true' / 'false'。 */
export type ProfileDraft = Record<ProfileFieldKey, string>

export function profileToDraft(profile: ResumeProfile): ProfileDraft {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => {
      const value = profile[field.key]

      return [field.key, value === null ? '' : String(value)]
    }),
  ) as ProfileDraft
}

/** 入力値を API へ送る形に戻す。空欄は null（その項目を消す）。 */
export function draftToProfileInput(draft: ProfileDraft): Partial<ResumeProfile> {
  const input: Partial<Record<ProfileFieldKey, string | number | boolean | null>> = {}

  for (const field of PROFILE_FIELDS) {
    const raw = draft[field.key].trim()

    if (raw === '') {
      input[field.key] = null
    } else if (field.type === 'number') {
      input[field.key] = Number(raw)
    } else if (field.type === 'boolean') {
      input[field.key] = raw === 'true'
    } else {
      input[field.key] = raw
    }
  }

  return input as Partial<ResumeProfile>
}

/**
 * 入力中の値を、見本に描くためのプロフィールにする。保存前の値なので、数値として読めない入力は空欄として扱う。
 */
export function previewProfile(draft: ProfileDraft): ResumeProfile {
  const input = draftToProfileInput(draft) as ResumeProfile

  for (const field of PROFILE_FIELDS) {
    if (field.type === 'number' && Number.isNaN(input[field.key])) {
      ;(input as Record<ProfileFieldKey, unknown>)[field.key] = null
    }
  }

  return input
}

/** 1 つでも入力があるか（プロフィール欄を「未入力」表示にするかどうか）。 */
export function hasAnyProfileValue(profile: ResumeProfile): boolean {
  return PROFILE_FIELDS.some((field) => profile[field.key] !== null && profile[field.key] !== '')
}
