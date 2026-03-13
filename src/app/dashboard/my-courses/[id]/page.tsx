'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ── 型別定義 ──────────────────────────────────────────────────
type Course = {
  id: string
  title: string
  description: string | null
  price: number | null
  status: string
  cover_image_url: string | null
  created_at: string
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatPrice(price: number | null) {
  if (price == null) return '洽詢價格'
  if (price === 0) return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

export default function CourseRoomPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params.id as string

  const [course, setCourse]       = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('找不到此課程。')
        } else {
          setCourse(data)
        }
        setIsLoading(false)
      })
  }, [courseId])

  // ── 返回按鈕（共用）──
  const BackButton = () => (
    <button
      onClick={() => router.back()}
      className="
        flex items-center gap-1.5 text-sm mb-8
        transition-opacity duration-150 hover:opacity-60
      "
      style={{ color: '#6D97B6' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      返回我的課程
    </button>
  )

  // ── 載入中 ──
  if (isLoading) {
    return (
      <div className="p-8">
        <BackButton />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <svg
            className="animate-spin h-8 w-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: '#6D97B6' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm" style={{ color: '#AEAEB2' }}>課程載入中…</span>
        </div>
      </div>
    )
  }

  // ── 錯誤 / 找不到課程 ──
  if (error || !course) {
    return (
      <div className="p-8">
        <BackButton />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-base font-medium" style={{ color: '#3D3D3F' }}>找不到此課程</p>
          <p className="text-sm" style={{ color: '#AEAEB2' }}>該課程可能已被下架或連結有誤</p>
          <button
            onClick={() => router.back()}
            className="
              mt-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white
              transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
            "
            style={{ backgroundColor: '#6D97B6' }}
          >
            返回課程列表
          </button>
        </div>
      </div>
    )
  }

  // ── 正常顯示 ──
  return (
    <div className="p-8 max-w-4xl">

      {/* 返回按鈕 */}
      <BackButton />

      {/* ── 影片播放器佔位符（16:9）── */}
      <div
        className="
          w-full aspect-video bg-gray-900 rounded-2xl
          flex flex-col items-center justify-center
          shadow-lg mb-8 overflow-hidden
        "
      >
        {/* 封面圖（有的話顯示於背景）*/}
        {course.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}

        {/* 播放圖示 */}
        <div
          className="
            relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-4
            bg-white/10 backdrop-blur-sm border border-white/20
          "
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <p className="relative z-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          影片播放器準備中…
        </p>
      </div>

      {/* ── 課程資訊區 ── */}
      <div>

        {/* 課程名稱 */}
        <h1
          className="text-3xl font-bold tracking-tight leading-tight"
          style={{ color: '#1D1D1F' }}
        >
          {course.title}
        </h1>

        {/* 標籤列 */}
        <div className="flex items-center flex-wrap gap-2 mt-4">
          {/* 價格 Badge */}
          <span
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full tabular-nums"
            style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#6D97B6' }}
          >
            {formatPrice(course.price)}
          </span>

          {/* 已擁有 Badge */}
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(52,199,89,0.10)', color: '#34C759' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            已擁有
          </span>
        </div>

        {/* 分隔線 */}
        <hr className="my-8 border-gray-100" />

        {/* 課程簡介 */}
        {course.description ? (
          <div>
            <h2
              className="text-xs font-medium tracking-widest uppercase mb-4"
              style={{ color: '#AEAEB2' }}
            >
              課程簡介
            </h2>
            <p
              className="text-base leading-relaxed whitespace-pre-wrap"
              style={{ color: '#3D3D3F' }}
            >
              {course.description}
            </p>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: '#C7C7CC' }}>
            本課程暫無簡介。
          </p>
        )}
      </div>
    </div>
  )
}
