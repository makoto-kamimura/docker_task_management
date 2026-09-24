/**
 * 履歴書を JIS 様式に近い A4・2 ページの HTML にする。Web はブラウザの印刷（PDF に保存）、
 * iOS は expo-print で、同じ HTML から PDF を作るので、どちらで出しても体裁がそろう。
 */
import { ENTRY_KIND_LABELS, ageOn, entriesOf, futureResumeRows } from './resume'
import { formatDuration } from './schedule'
import type { Resume, ResumeEntry, ResumeEntryInput, ResumeEntryKind, ResumeProfile, ResumeTimeline } from './types'

/** A4 のポイント寸法（iOS の expo-print に渡す用紙サイズ）。 */
export const A4_POINTS = { width: 595, height: 842 } as const

/** 学歴・職歴欄と免許・資格欄の行数。書いた行が少なくても、この行数まで罫線を引いて用紙らしく見せる。 */
const HISTORY_ROWS = 16
const LICENSE_ROWS = 7

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 入力値をそのまま載せる。未入力は空欄、改行はそのまま改行にする。 */
function text(value: string | null | undefined): string {
  return value ? escapeHtml(value).replace(/\n/g, '<br>') : ''
}

function formatDateJa(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatBirthDate(birthDate: string | null, today: Date): string {
  if (!birthDate) return '年　　月　　日生（満　　歳）'

  const [year, month, day] = birthDate.split('-').map(Number)
  const age = ageOn(birthDate, today)

  return `${year}年${month}月${day}日生（満${age ?? '　'}歳）`
}

function yesNo(value: boolean | null): string {
  if (value === null) return '有・無'

  return value ? '<span class="mark">有</span>・無' : '有・<span class="mark">無</span>'
}

export function resumeFileName(timeline: ResumeTimeline, today = new Date()): string {
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return `${timeline === 'future' ? '将来の履歴書' : '履歴書'}_${date}`
}

/** 見本に差し込む入力中の行の id（保存済みの行と重ならない値）。 */
const DRAFT_ENTRY_ID = -1

interface Row {
  year: string
  month: string
  content: string
  align?: 'center' | 'right'
  isGoal?: boolean
  isDraft?: boolean
}

function entryRow(entry: ResumeEntry): Row {
  return {
    year: String(entry.year),
    month: entry.month === null ? '' : String(entry.month),
    content: escapeHtml(entry.content),
    isGoal: entry.timeline === 'future',
    isDraft: entry.id === DRAFT_ENTRY_ID,
  }
}

function historyRows(entries: ResumeEntry[]): Row[] {
  const rows: Row[] = []

  for (const kind of ['education', 'work'] as ResumeEntryKind[]) {
    const kindEntries = entries.filter((entry) => entry.kind === kind)
    if (kindEntries.length === 0) continue
    rows.push({ year: '', month: '', content: ENTRY_KIND_LABELS[kind], align: 'center' })
    rows.push(...kindEntries.map(entryRow))
  }

  if (rows.length > 0) rows.push({ year: '', month: '', content: '以上', align: 'right' })

  return rows
}

function renderRows(rows: Row[], minRows: number): string {
  const filled = [...rows, ...Array.from({ length: Math.max(0, minRows - rows.length) }, () => null)]

  return filled
    .map((row) => {
      if (row === null) return '<tr><td class="year"></td><td class="month"></td><td></td></tr>'

      const goal = row.isGoal ? '<span class="goal">（目標）</span>' : ''
      const align = row.align ? ` class="${row.align}"` : ''
      const classes = [row.isGoal && 'is-goal', row.isDraft && 'is-draft'].filter(Boolean).join(' ')

      return `<tr${classes ? ` class="${classes}"` : ''}><td class="year">${row.year}</td><td class="month">${row.month}</td><td${align}>${row.content}${goal}</td></tr>`
    })
    .join('')
}

function historyTable(title: string, rows: Row[], minRows: number): string {
  return `<table class="history">
  <thead><tr><th class="year">年</th><th class="month">月</th><th>${title}</th></tr></thead>
  <tbody>${renderRows(rows, minRows)}</tbody>
</table>`
}

const STYLE = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "Noto Serif CJK JP", serif;
  font-size: 10pt;
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page { break-after: page; page-break-after: always; }
.page:last-child { break-after: auto; page-break-after: auto; }
.doc-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 3mm; }
.doc-head h1 { margin: 0; font-size: 20pt; font-weight: normal; letter-spacing: 1em; }
.doc-head .note { font-size: 8.5pt; }
table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; table-layout: fixed; }
th, td { border: 0.6pt solid #000; padding: 1.2mm 2mm; vertical-align: top; text-align: left; font-weight: normal; overflow-wrap: anywhere; }
th { font-size: 8.5pt; white-space: nowrap; }
.kana th, .kana td { font-size: 8pt; border-bottom-style: dotted; height: 6mm; }
.name td { font-size: 17pt; height: 15mm; vertical-align: middle; }
.birth td { height: 8mm; vertical-align: middle; }
.photo { border: 0; padding: 0 0 0 3mm; vertical-align: top; }
.photo-box { width: 30mm; height: 40mm; border: 0.6pt dashed #000; font-size: 7.5pt; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; line-height: 1.5; margin-left: auto; }
.address td { height: 13mm; }
.tel { width: 36mm; }
.small { font-size: 7.5pt; }
.history th { text-align: center; }
.history .year { width: 16mm; text-align: center; }
.history .month { width: 10mm; text-align: center; }
.history td { height: 7.4mm; vertical-align: middle; }
.history .center { text-align: center; letter-spacing: 0.5em; }
.history .right { text-align: right; padding-right: 6mm; }
.history .is-goal td { background: #f1f1f1; }
.goal { font-size: 8pt; margin-left: 2mm; }
.box th { background: none; }
.box td { height: 32mm; }
.box.tall td { height: 42mm; }
.misc td, .misc th { text-align: center; vertical-align: middle; height: 11mm; }
.mark { border: 0.6pt solid #000; border-radius: 50%; padding: 0 1mm; }
/* 入力中の行。円グラフの「新しい予定」と同じく破線で示し、保存済みの行と区別する（見本だけに出る）。 */
.history tr.is-draft td { background: #f6efff; border-top: 1.2pt dashed #aa3bff; border-bottom: 1.2pt dashed #aa3bff; }
/* 画面で見本として出すときは、A4 の紙を並べて見せる（印刷・PDF には使わない）。 */
body.preview { background: #e9e8ee; padding: 16px 0; }
body.preview .page { width: 210mm; min-height: 297mm; margin: 0 auto 16px; padding: 12mm; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18); }
`

/** 見本に差し込む入力中の値。PDF を作るときは渡さない。 */
export interface ResumeDraft {
  /** 入力中のプロフィール（編集していなければ null → 保存済みの値を使う）。 */
  profile?: ResumeProfile | null
  /** 入力中の行。editingId の行は元の位置から外し、この行を破線で差し込む。 */
  entry?: { editingId: number | null; input: ResumeEntryInput } | null
}

export interface ResumeDocumentOptions {
  today?: Date
  draft?: ResumeDraft
}

/** 見本の紙の幅（px）。A4 の 210mm ＋ 左右の余白。Web はこの幅で描いてから列の幅に縮める。 */
export const PREVIEW_DOCUMENT_WIDTH = 840

function withDraftEntry(entries: ResumeEntry[], draft: ResumeDraft['entry']): ResumeEntry[] {
  if (!draft || draft.input.content.trim() === '') return entries

  const others = draft.editingId === null ? entries : entries.filter((entry) => entry.id !== draft.editingId)

  return [
    ...others,
    { id: DRAFT_ENTRY_ID, task_id: null, created_at: '', updated_at: '', ...draft.input, content: draft.input.content.trim() },
  ]
}

/**
 * 履歴書の本文（2 ページぶんの <section>）。
 * @param timeline 'future' なら今の経歴に将来の目標の行を年月順に差し込み、「（目標）」の印を付ける
 */
export function renderResumeBody(resume: Resume, timeline: ResumeTimeline, options: ResumeDocumentOptions = {}): string {
  const today = options.today ?? new Date()
  const profile = options.draft?.profile ?? resume.profile
  const entries = withDraftEntry(resume.entries, options.draft?.entry)
  const pick = (kinds: ResumeEntryKind[]) =>
    timeline === 'future' ? futureResumeRows(entries, kinds) : entriesOf(entries, 'current', kinds)

  const history = historyRows(pick(['education', 'work']))
  const licenses = pick(['license']).map(entryRow)
  const note =
    timeline === 'future'
      ? `${formatDateJa(today)}現在<br>将来の履歴書（網掛けの行は目標）`
      : `${formatDateJa(today)}現在`

  return `<section class="page">
  <div class="doc-head"><h1>履歴書</h1><p class="note">${note}</p></div>
  <table class="personal">
    <colgroup><col style="width:20mm"><col><col style="width:36mm"></colgroup>
    <tr class="kana"><th>ふりがな</th><td>${text(profile.name_kana)}</td>
      <td class="photo" rowspan="3"><div class="photo-box">写真をはる位置<br><br>縦 36〜40mm<br>横 24〜30mm</div></td></tr>
    <tr class="name"><th>氏名</th><td>${text(profile.name)}</td></tr>
    <tr class="birth"><th>生年月日</th><td>${formatBirthDate(profile.birth_date, today)}　　性別　${text(profile.gender)}</td></tr>
  </table>
  <table class="address">
    <colgroup><col style="width:20mm"><col><col class="tel"></colgroup>
    <tr class="kana"><th>ふりがな</th><td>${text(profile.address_kana)}</td><th>電話</th></tr>
    <tr><th>現住所</th><td>〒${text(profile.postal_code)}<br>${text(profile.address)}</td><td>${text(profile.phone)}</td></tr>
    <tr><th>E-mail</th><td colspan="2">${text(profile.email)}</td></tr>
    <tr><th>連絡先</th><td>〒${text(profile.contact_postal_code)}<br>${text(profile.contact_address)}<br><span class="small">（現住所以外に連絡を希望する場合のみ記入）</span></td><td>${text(profile.contact_phone)}</td></tr>
  </table>
  ${historyTable('学歴・職歴', history, HISTORY_ROWS)}
</section>
<section class="page">
  ${historyTable('免許・資格', licenses, LICENSE_ROWS)}
  <table class="box"><tr><th>志望の動機</th></tr><tr><td>${text(profile.motivation)}</td></tr></table>
  <table class="box"><tr><th>特技・好きな学科・アピールポイントなど</th></tr><tr><td>${text(profile.self_pr)}</td></tr></table>
  <table class="misc">
    <tr><th>通勤時間</th><th>扶養家族数（配偶者を除く）</th><th>配偶者</th><th>配偶者の扶養義務</th></tr>
    <tr>
      <td>${profile.commute_minutes === null ? '約　　時間　　分' : `約 ${formatDuration(profile.commute_minutes)}`}</td>
      <td>${profile.dependents_count === null ? '　　人' : `${profile.dependents_count}人`}</td>
      <td>${yesNo(profile.has_spouse)}</td>
      <td>${yesNo(profile.spouse_dependent)}</td>
    </tr>
  </table>
  <table class="box tall"><tr><th>本人希望記入欄（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）</th></tr><tr><td>${text(profile.requests)}</td></tr></table>
</section>`
}

/**
 * 本文を包む HTML の外枠。preview にすると画面向けに A4 の紙を並べて見せる（PDF・印刷では使わない）。
 * iOS の見本は幅 PREVIEW_DOCUMENT_WIDTH で描いて端末の幅に縮め、ピンチで拡大できるようにする。
 */
function documentShell(body: string, title: string, preview: boolean): string {
  const viewport = preview ? `width=${PREVIEW_DOCUMENT_WIDTH}` : 'width=device-width, initial-scale=1'

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${viewport}">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body${preview ? ' class="preview"' : ''}>
${body}
</body>
</html>`
}

/** 本文が空の見本の外枠。Web はこれを一度だけ読み込み、入力のたびに本文だけを差し替える（ちらつかせない）。 */
export function renderResumePreviewShell(): string {
  return documentShell('', '履歴書の見本', true)
}

/** PDF（印刷）用、または preview: true で見本用の完全な HTML。 */
export function renderResumeHtml(
  resume: Resume,
  timeline: ResumeTimeline,
  options: ResumeDocumentOptions & { preview?: boolean } = {},
): string {
  const today = options.today ?? new Date()

  return documentShell(
    renderResumeBody(resume, timeline, options),
    resumeFileName(timeline, today),
    options.preview ?? false,
  )
}
