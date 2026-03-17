'use client'

import { useState, useTransition } from 'react'
import { createChapter } from './actions'

const inputClass = `
  w-full px-4 py-3 rounded-2xl text-sm
  outline-none transition-all duration-200
  focus:ring-2 focus:ring-[#6D97B6]/30
  placeholder:text-[var(--text-tertiary)]
`

// ─────────────────────────────────────────────────────────────
// ChapterForm — 新增章節表單（Client Component）
//
// 使用 useTransition（方案 A）呼叫 createChapter Server Action，
// 確保寫入在背景進行，UI 動畫與互動不中斷。
// ─────────────────────────────────────────────────────────────
export default function ChapterForm({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl,    setVideoUrl]    = useState('')
  const [isFree,      setIsFree]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    // Client-side 快速驗證
    if (!title.trim()) {
      setError('請輸入章節名稱。')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title',       title.trim())
      formData.set('description', description.trim())
      formData.set('video_url',   videoUrl.trim())
      if (isFree) formData.set('is_free', 'on')

      const result = await createChapter(formData, courseId)

      if (result.success) {
        // 清空表單，顯示成功提示
        setTitle('')
        setDescription('')
        setVideoUrl('')
        setIsFree(false)
        setSuccessMsg('✓ 章節已成功加入！')
        // 2 秒後自動清除成功提示
        setTimeout(() => setSuccessMsg(null), 2000)
      } else {
        setError(result.error ?? '新增失敗，請稍後再試。')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* 章節名稱 */}
      <div>
        <label
          className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          章節名稱 <span style={{ color: '#FF3B30' }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例：第一章：GT 極速入門"
          disabled={isPending}
          className={inputClass}
          style={{
            color:           'var(--text-primary)',
            backgroundColor: 'var(--nav-hover-bg)',
            border:          '1px solid var(--border-subtle)',
          }}
        />
      </div>

      {/* 章節描述（選填）*/}
      <div>
        <label
          className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          章節描述
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="簡短說明本章節的學習目標…"
          rows={2}
          disabled={isPending}
          className={`${inputClass} resize-none leading-relaxed`}
          style={{
            color:           'var(--text-primary)',
            backgroundColor: 'var(--nav-hover-bg)',
            border:          '1px solid var(--border-subtle)',
          }}
        />
      </div>

      {/* 影片 URL（預留 Cloudflare Stream）*/}
      <div>
        <label
          className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          影片 URL
          <span className="ml-1.5 normal-case font-normal" style={{ color: 'var(--text-tertiary)' }}>
            （預留 Cloudflare Stream）
          </span>
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://..."
          disabled={isPending}
          className={inputClass}
          style={{
            color:           'var(--text-primary)',
            backgroundColor: 'var(--nav-hover-bg)',
            border:          '1px solid var(--border-subtle)',
          }}
        />
      </div>

      {/* 免費試看開關 */}
      <label className="flex items-center gap-3 cursor-pointer group select-none">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={isFree}
            onChange={e => setIsFree(e.target.checked)}
            disabled={isPending}
            className="sr-only"
          />
          {/* 自製 Toggle UI */}
          <div
            className="w-10 h-6 rounded-full transition-all duration-200"
            style={{
              backgroundColor: isFree ? '#FF9F0A' : 'var(--border-subtle)',
            }}
          >
            <div
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: isFree ? 'translateX(16px)' : 'translateX(0)' }}
            />
          </div>
        </div>
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            免費試看
          </span>
          <span className="text-xs ml-1.5" style={{ color: 'var(--text-tertiary)' }}>
            開啟後，未購課學員可預覽本章節
          </span>
        </div>
      </label>

      {/* 錯誤 / 成功提示 */}
      {error && (
        <p
          className="text-xs px-4 py-2.5 rounded-2xl"
          style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}
        >
          {error}
        </p>
      )}
      {successMsg && (
        <p
          className="text-xs px-4 py-2.5 rounded-2xl font-medium"
          style={{ color: '#34C759', backgroundColor: 'rgba(52,199,89,0.10)' }}
        >
          {successMsg}
        </p>
      )}

      {/* 送出按鈕 */}
      <button
        type="submit"
        disabled={isPending}
        className="
          w-full flex items-center justify-center gap-2
          py-3 rounded-2xl text-sm font-semibold text-white
          transition-all duration-200
          hover:brightness-110 hover:-translate-y-0.5 hover:shadow-md
          active:translate-y-0 active:shadow-sm active:brightness-95
          disabled:opacity-60 disabled:cursor-not-allowed
          disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100
        "
        style={{ backgroundColor: '#6D97B6' }}
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            建立中…
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新增章節
          </>
        )}
      </button>
    </form>
  )
}
