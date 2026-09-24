import type { LucideIcon } from 'lucide-react'

/** 画面の見出し。アイコン付きの見出しは絵文字の代わりに lucide のアイコンを添える。 */
export function PageTitle({ icon: Icon, children }: { icon?: LucideIcon; children: string }) {
  if (!Icon) {
    return <h1>{children}</h1>
  }

  return (
    <h1 className="title-with-icon">
      <Icon size={26} aria-hidden="true" />
      {children}
    </h1>
  )
}
