interface TabsProps<T extends string> {
  tabs: readonly { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
  /** タブ全体の読み上げ名。 */
  label: string
  /** 各タブが切り替えるパネルの id の接頭辞（`${idPrefix}-${key}`）。 */
  idPrefix: string
}

/** 画面内の表示を切り替えるタブ。切り替え先のパネルには `${idPrefix}-${key}` の id と role="tabpanel" を付ける。 */
export function Tabs<T extends string>({ tabs, value, onChange, label, idPrefix }: TabsProps<T>) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${tab.key}`}
          aria-selected={tab.key === value}
          aria-controls={`${idPrefix}-${tab.key}`}
          className={`tab${tab.key === value ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
