'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// ── 型別定義 ──────────────────────────────────────────────────
type Course = {
  id: string
  title: string
  description: string | null
  price: number | null
  status: string
  created_at: string
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatPrice(price: number | null) {
  if (price == null) return '洽詢價格'
  if (price === 0) return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

// ── 骨架卡片（載入中佔位）────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-10 bg-gray-100 rounded-2xl mt-4" />
      </div>
    </div>
  )
}

export default function MyCoursesPage() {
  const [courses, setCourses]       = useState<Course[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError('課程載入失敗，請稍後再試。')
        } else {
          setCourses(data ?? [])
        }
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="p-8">

      {/* ── 頁首 ── */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          我的課程
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          探索並開始您的極速學習之旅
        </p>
      </div>

      {/* ── 錯誤狀態 ── */}
      {!isLoading && error && (
        <div className="flex items-center justify-center py-24">
          <p
            className="text-sm px-5 py-3 rounded-2xl"
            style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}
          >
            {error}
          </p>
        </div>
      )}

      {/* ── 載入中：骨架屏 ── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── 空狀態 ── */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p className="text-sm text-center" style={{ color: '#AEAEB2' }}>
            目前尚無可用的課程，請稍後再回來看看！
          </p>
        </div>
      )}

      {/* ── 課程 Grid ── */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 課程卡片元件 ──────────────────────────────────────────────
function CourseCard({ course }: { course: Course }) {
  return (
    <div
      className="
        bg-white rounded-2xl shadow-sm overflow-hidden
        border border-black/[0.04]
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
      "
    >
      {/* 封面圖佔位區 */}
      <div
        className="h-48 flex items-center justify-center"
        style={{ backgroundColor: '#F5F5F7' }}
      >
        {/* 車輪 icon 作為封面裝飾 */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2"  x2="12" y2="9"/>
          <line x1="12" y1="15" x2="12" y2="22"/>
          <line x1="2"  y1="12" x2="9"  y2="12"/>
          <line x1="15" y1="12" x2="22" y2="12"/>
          <line x1="4.93"  y1="4.93"  x2="9.17"  y2="9.17"/>
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
          <line x1="19.07" y1="4.93"  x2="14.83" y2="9.17"/>
          <line x1="9.17"  y1="14.83" x2="4.93"  y2="19.07"/>
        </svg>
      </div>

      {/* 內容區 */}
      <div className="p-5 flex flex-col gap-2">

        {/* 課程名稱 */}
        <h2
          className="text-base font-semibold leading-snug tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          {course.title}
        </h2>

        {/* 課程描述（最多兩行）*/}
        {course.description && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: '#6E6E73' }}
          >
            {course.description}
          </p>
        )}

        {/* 價格 */}
        <p
          className="text-sm font-semibold tabular-nums mt-1"
          style={{ color: '#6D97B6' }}
        >
          {formatPrice(course.price)}
        </p>

        {/* 立即上課按鈕 */}
        <button
          type="button"
          className="
            w-full mt-3 py-2.5 rounded-2xl text-sm font-semibold text-white
            transition-all duration-200
            hover:brightness-105 hover:shadow-sm
            active:brightness-95
          "
          style={{ backgroundColor: '#6D97B6' }}
        >
          立即上課
        </button>
      </div>
    </div>
  )
}
