'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

const inputClass = `
  w-full px-5 py-3.5 rounded-2xl text-sm
  border border-black/[0.08] bg-white
  outline-none transition-all duration-200
  focus:border-[#6D97B6] focus:ring-2 focus:ring-[#6D97B6]/20
  placeholder:text-[#C7C7CC]
`

const labelClass = 'block text-xs font-medium tracking-widest uppercase mb-2'

export default function NewLessonPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params.id as string

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [videoUrl, setVideoUrl]         = useState('')
  const [sequenceOrder, setSequenceOrder] = useState('1')
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // ── 必填驗證 ──
    if (!title.trim()) {
      setError('請輸入單元名稱。')
      return
    }
    if (!sequenceOrder || isNaN(Number(sequenceOrder)) || Number(sequenceOrder) < 1) {
      setError('請輸入有效的播放順序（需大於 0 的整數）。')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('lessons')
        .insert([{
          course_id:       courseId,
          title:           title.trim(),
          description:     description.trim() || null,
          video_url:       videoUrl.trim() || null,
          sequence_order:  Number(sequenceOrder),
          is_free_preview: isFreePreview,
        }])

      if (insertError) {
        setError('單元新增失敗，請稍後再試。')
        return
      }

      router.push(`/dashboard/courses/${courseId}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">

      {/* ── 返回按鈕 ── */}
      <button
        onClick={() => router.back()}
        className="
          flex items-center gap-1.5 text-sm mb-6
          transition-opacity duration-150 hover:opacity-60
        "
        style={{ color: '#6D97B6' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回課程管理
      </button>

      {/* ── 頁面標題 ── */}
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          新增課程單元
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          為此課程加入新的 Lesson，完成後可隨時編輯。
        </p>
      </div>

      {/* ── 表單容器 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 單元名稱 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              單元名稱 <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：第一章：超跑起步技巧"
              className={inputClass}
              style={{ color: '#1D1D1F' }}
            />
          </div>

          {/* 播放順序 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              播放順序 <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={sequenceOrder}
              onChange={e => setSequenceOrder(e.target.value)}
              placeholder="1"
              className={`${inputClass} tabular-nums`}
              style={{ color: '#1D1D1F' }}
            />
            <p className="mt-1.5 text-xs" style={{ color: '#AEAEB2' }}>
              數字越小排序越前，可輸入任意正整數。
            </p>
          </div>

          {/* 影片連結 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              影片連結
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
              style={{ color: '#1D1D1F' }}
            />
            <p className="mt-1.5 text-xs" style={{ color: '#AEAEB2' }}>
              支援 YouTube、Vimeo 或其他串流平台連結。
            </p>
          </div>

          {/* 單元簡介 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              單元簡介
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="簡短描述此單元的學習目標與內容重點…"
              rows={4}
              className={`${inputClass} resize-none leading-relaxed`}
              style={{ color: '#1D1D1F' }}
            />
          </div>

          {/* 免費試看 Toggle ── */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              免費試看
            </label>
            <label className="flex items-center gap-4 cursor-pointer group">
              {/* Toggle 開關 */}
              <button
                type="button"
                role="switch"
                aria-checked={isFreePreview}
                onClick={() => setIsFreePreview(prev => !prev)}
                className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#6D97B6]/40"
                style={{ backgroundColor: isFreePreview ? '#6D97B6' : '#D1D1D6' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{ transform: isFreePreview ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
              {/* 說明文字 */}
              <div>
                <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                  {isFreePreview ? '已開放免費試看' : '僅限購買學員'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
                  打開後，未購買的學生也能觀看此單元。
                </p>
              </div>
            </label>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <p
              className="text-xs px-4 py-2.5 rounded-2xl"
              style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}
            >
              {error}
            </p>
          )}

          {/* ── 底部按鈕區（靠右對齊）── */}
          <div className="flex items-center justify-end gap-3 pt-2">

            {/* 取消 */}
            <button
              type="button"
              onClick={() => router.back()}
              className="
                px-5 py-2.5 rounded-2xl text-sm font-medium
                transition-all duration-150
                hover:bg-black/[0.04]
              "
              style={{ color: '#8E8E93' }}
            >
              取消
            </button>

            {/* 新增單元 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold text-white
                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
                active:translate-y-0 active:shadow-sm active:brightness-95
                disabled:opacity-60 disabled:cursor-not-allowed
                disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100
              "
              style={{ backgroundColor: '#6D97B6' }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  新增中…
                </>
              ) : (
                '新增單元'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
