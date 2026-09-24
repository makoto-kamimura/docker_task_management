import { useEffect, useMemo, useRef, useState } from 'react'
import { PREVIEW_DOCUMENT_WIDTH, renderResumePreviewShell } from '@shared/resume-document'

/**
 * 履歴書の見本。PDF と同じ HTML を A4 の紙として描き、置き場所の幅に合わせて縮めて見せる。
 * 外枠は一度だけ読み込み、入力のたびに本文だけを差し替えて、打つたびに見本がちらつかないようにする。
 */
export function ResumePreview({ body, label }: { body: string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [contentHeight, setContentHeight] = useState(0)
  const shell = useMemo(() => renderResumePreviewShell(), [])

  // 置き場所の幅が変わったら縮尺を合わせ直す。
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / PREVIEW_DOCUMENT_WIDTH))
    observer.observe(wrap)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const doc = frameRef.current?.contentDocument
    if (!isReady || !doc) return

    doc.body.innerHTML = body
    setContentHeight(doc.documentElement.scrollHeight)
  }, [body, isReady])

  return (
    <div ref={wrapRef} className="resume-preview" style={{ height: contentHeight * scale }}>
      <iframe
        ref={frameRef}
        srcDoc={shell}
        title={label}
        tabIndex={-1}
        onLoad={() => setIsReady(true)}
        style={{ width: PREVIEW_DOCUMENT_WIDTH, height: contentHeight, transform: `scale(${scale})` }}
      />
    </div>
  )
}
