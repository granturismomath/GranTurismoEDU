'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// ── 型別定義 ──────────────────────────────────────────────────
type Course = {
  id: string
  title: string
  description: string | null
  price: number | null
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

// ── 骨架卡片 ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-52 bg-gray-100" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-6 bg-gray-100 rounded-full w-1/3 mt-4" />
        <div className="h-11 bg-gray-100 rounded-2xl mt-2" />
      </div>
    </div>
  )
}

export default function ExplorePage() {
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
        if (error) setError('課程載入失敗，請稍後再試。')
        else setCourses(data ?? [])
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="p-8">

      {/* ── 頁首 ── */}
      <div className="mb-10">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          探索課程
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          投資自己，啟動您的極速成長引擎
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── 空狀態 ── */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(109,151,182,0.08)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6D97B6" strokeWidth="1.4">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-medium" style={{ color: '#3D3D3F' }}>
              目前尚無公開的課程
            </p>
            <p className="text-sm mt-1" style={{ color: '#AEAEB2' }}>
              敬請期待！我們正在為您準備頂級課程內容。
            </p>
          </div>
        </div>
      )}

      {/* ── 課程 Grid ── */}
      {!isLoading && !error && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <p className="mt-8 text-xs text-center" style={{ color: '#C7C7CC' }}>
            共 {courses.length} 堂精選課程
          </p>
        </>
      )}
    </div>
  )
}

// ── 商品卡片元件 ──────────────────────────────────────────────
function CourseCard({ course }: { course: Course }) {
  return (
    <div
      className="
        group bg-white rounded-2xl overflow-hidden
        shadow-sm border border-black/[0.04]
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl hover:border-black/[0.08]
      "
    >
      {/* ── 封面圖區 ── */}
      <div className="h-52 overflow-hidden bg-gray-50 relative">
        {course.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: '#F5F5F7' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.2">
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
        )}

        {/* 免費課程角標 */}
        {course.price === 0 && (
          <div
            className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#34C759', color: '#fff' }}
          >
            FREE
          </div>
        )}
      </div>

      {/* ── 內容區 ── */}
      <div className="p-6 flex flex-col gap-3">

        {/* 課程名稱 */}
        <h2
          className="text-base font-semibold leading-snug tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          {course.title}
        </h2>

        {/* 課程簡介 */}
        {course.description && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: '#6E6E73' }}
          >
            {course.description}
          </p>
        )}

        {/* 價格 */}
        <div className="flex items-baseline gap-1 mt-1">
          <span
            className="text-xl font-bold tabular-nums tracking-tight"
            style={{ color: course.price === 0 ? '#34C759' : '#6D97B6' }}
          >
            {formatPrice(course.price)}
          </span>
        </div>

        {/* 查看詳情按鈕 */}
        <Link
          href={`/dashboard/explore/${course.id}`}
          className="
            block w-full mt-1 py-3 rounded-2xl text-sm font-semibold text-white text-center
            transition-all duration-200
            hover:brightness-110 hover:shadow-md hover:-translate-y-0.5
            active:brightness-95 active:translate-y-0
          "
          style={{ backgroundColor: '#6D97B6' }}
        >
          查看課程詳情
        </Link>
      </div>
    </div>
  )
}
