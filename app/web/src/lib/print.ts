/**
 * HTML を見えない iframe に読み込んで、ブラウザの印刷画面を開く。印刷先で「PDF に保存」を選べば PDF になる。
 * 新しいウィンドウを開かないので、ポップアップブロックにかからない。
 * PDF の既定のファイル名には HTML の <title> が使われる。
 */
export function printHtml(html: string): void {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.style.visibility = 'hidden'

  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) return

    // 印刷画面を閉じたら片付ける。afterprint が来ないブラウザ向けに、念のため時間でも消す。
    const cleanup = () => frame.remove()
    view.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(cleanup, 60_000)

    view.focus()
    view.print()
  }

  frame.srcdoc = html
  document.body.appendChild(frame)
}
