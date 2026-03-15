'use client'

import { useState, useRef, useEffect } from 'react'
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

export default function EditCoursePage() {
  const params     = useParams()
  const router     = useRouter()
  const courseId   = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── 載入狀態 ──
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError]         = useState<string | null>(null)

  // ── 表單 state ──
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [price, setPrice]               = useState('')
  const [status, setStatus]             = useState<'draft' | 'published'>('draft')
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // ── 載入舊資料 ──
  useEffect(() => {
    if (!courseId) return
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setPageError('找不到此課程。')
        } else {
          setTitle(data.title ?? '')
          setDescription(data.description ?? '')
          setPrice(data.price != null ? String(data.price) : '')
          setStatus(data.status === 'published' ? 'published' : 'draft')
          if (data.cover_image_url) {
            setExistingCoverUrl(data.cover_image_url)
            setPreviewUrl(data.cover_image_url)
          }
        }
        setIsPageLoading(false)
      })
  }, [courseId])

  // ── 選擇圖片 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setCoverFile(file)
    setPreviewUrl(prev => {
      // 只 revoke blob: URL，不要 revoke 遠端 URL
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  // ── 清除封面 ──
  const handleClearCover = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setCoverFile(null)
    setPreviewUrl(null)
    setExistingCoverUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── 送出表單 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 必填驗證
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
      // ── 處理封面圖 ──
      let coverImageUrl: string | null = existingCoverUrl

      // 使用者選了新圖片 → 上傳
      if (coverFile) {
        const fileExt  = coverFile.name.split('.').pop()
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('course-covers')
          .upload(filePath, coverFile)

        if (uploadError) {
          setError('封面上傳失敗，請稍後再試。')
          return
        }

        const { data: urlData } = supabase.storage
          .from('course-covers')
          .getPublicUrl(filePath)

        coverImageUrl = urlData.publicUrl
      }

      // 使用者清除了封面（無新檔也無舊 URL）
      if (!coverFile && !existingCoverUrl) {
        coverImageUrl = null
      }

      // ── 更新課程 ──
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title:           title.trim(),
          description:     description.trim() || null,
          price:           Number(price),
          status,
          cover_image_url: coverImageUrl,
        })
        .eq('id', courseId)

      if (updateError) {
        setError('課程更新失敗，請稍後再試。')
        return
      }

      router.push(`/dashboard/courses/${courseId}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 載入中 ──
  if (isPageLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#6D97B6' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm" style={{ color: '#AEAEB2' }}>載入課程資料中…</span>
      </div>
    )
  }

  // ── 找不到課程 ──
  if (pageError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm px-5 py-3 rounded-2xl" style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}>
          {pageError}
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium transition-opacity hover:opacity-60"
          style={{ color: '#6D97B6' }}
        >
          返回
        </button>
      </div>
    )
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
          編輯課程
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          修改課程資訊，儲存後立即生效。
        </p>
      </div>

      {/* ── 表單容器 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 課程封面上傳區 ── */}
          <div>
            <label className={labelClass} style={{ color: '#6E6E73' }}>
              課程封面
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="封面預覽"
                  className="w-full h-full object-cover"
                />
                {/* 更換圖片 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    absolute top-3 right-3
                    flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                    backdrop-blur-md bg-black/40 text-white
                    transition-opacity duration-150 hover:bg-black/60
                  "
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  更換圖片
                </button>
                {/* 移除封面 */}
                <button
                  type="button"
                  onClick={handleClearCover}
                  className="
                    absolute top-3 left-3
                    flex items-center justify-center w-7 h-7 rounded-xl
                    backdrop-blur-md bg-black/40 text-white
                    transition-opacity duration-150 hover:bg-black/60
                  "
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  w-full h-52 rounded-2xl
                  border-2 border-dashed border-black/[0.1]
                  flex flex-col items-center justify-center gap-3
                  transition-all duration-200
                  hover:border-[#6D97B6]/40 hover:bg-[#6D97B6]/[0.03]
                "
                style={{ backgroundColor: '#FAFAFA' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#6E6E73' }}>
                    點擊上傳課程封面
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
                    建議比例 16:9，JPG / PNG / WEBP
                  </p>
                </div>
              </button>
            )}
          </div>

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

            {/* 儲存變更 */}
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
                  儲存中…
                </>
              ) : (
                '儲存變更'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
