'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewCoursePage() {
  const router = useRouter()

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice]             = useState('')
  const [status, setStatus]           = useState<'draft' | 'published'>('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // ── 必填驗證 ──
    if (!title.trim()) {
      setError('請輸入課程名稱。')
      return
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setError('請輸入有效的課程售價。')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('courses')
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          price: Number(price),
          status,
        }])

      if (insertError) {
        setError('課程建立失敗，請稍後再試。')
        return
      }

      router.push('/dashboard/courses')
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
        返回課程列表
      </button>

      {/* ── 頁面標題 ── */}
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          新增課程
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          填寫課程基本資訊，完成後可隨時在列表中編輯。
        </p>
      </div>

      {/* ── 表單容器 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 課程名稱 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              課程名稱 <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：超跑賽道駕駛技術入門"
              className={inputClass}
              style={{ color: '#1D1D1F' }}
            />
          </div>

          {/* 課程簡介 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              課程簡介
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="簡短描述這堂課程的內容、目標學員與學習成效…"
              rows={4}
              className={`${inputClass} resize-none leading-relaxed`}
              style={{ color: '#1D1D1F' }}
            />
          </div>

          {/* 課程售價 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              課程售價 <span style={{ color: '#FF3B30' }}>*</span>
            </label>
            <div className="relative">
              {/* NT$ 裝飾 */}
              <span
                className="absolute left-5 top-1/2 -translate-y-1/2 text-sm select-none"
                style={{ color: '#AEAEB2' }}
              >
                NT$
              </span>
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
                className={`${inputClass} pl-14 tabular-nums`}
                style={{ color: '#1D1D1F' }}
              />
            </div>
          </div>

          {/* 發布狀態 */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              發布狀態
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'draft' | 'published')}
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
                style={{ color: '#1D1D1F' }}
              >
                <option value="draft">草稿（Draft）</option>
                <option value="published">立即發布（Published）</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: '#AEAEB2' }}>
                ▼
              </span>
            </div>
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

            {/* 建立課程 */}
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
                  建立中…
                </>
              ) : (
                '建立課程'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
