'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

type Lesson = {
  id: string
  course_id: string
  title: string
  sequence_order: number
  is_free_preview: boolean
}
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '已發布', bg: 'rgba(52,199,89,0.12)',  color: '#34C759' },
  draft:     { label: '草稿',   bg: 'rgba(0,0,0,0.06)',       color: '#8E8E93' },
}

const supabase = createClient()

function formatPrice(price: number | null) {
  if (price == null) return '—'
  if (price === 0) return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

export default function CourseDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params.id as string

  const [course, setCourse]       = useState<Course | null>(null)
  const [lessons, setLessons]     = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('lessons').select('*').eq('course_id', courseId).order('sequence_order', { ascending: true }),
    ]).then(([courseRes, lessonsRes]) => {
      if (courseRes.error || !courseRes.data) {
        setError('找不到此課程。')
      } else {
        setCourse(courseRes.data)
        setLessons(lessonsRes.data ?? [])
      }
      setIsLoading(false)
    })
  }, [courseId])

  // ── 載入中 ──
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#6D97B6' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm" style={{ color: '#AEAEB2' }}>課程資料載入中…</span>
      </div>
    )
  }

  // ── 錯誤 ──
  if (error || !course) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm px-5 py-3 rounded-2xl" style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}>
          {error ?? '找不到此課程'}
        </p>
        <button
          onClick={() => router.push('/dashboard/courses')}
          className="text-sm font-medium transition-opacity hover:opacity-60"
          style={{ color: '#6D97B6' }}
        >
          返回課程列表
        </button>
      </div>
    )
  }

  const badge = STATUS_BADGE[course.status] ?? { label: course.status, bg: 'rgba(0,0,0,0.06)', color: '#8E8E93' }

  return (
    <div className="p-8 max-w-4xl">

      {/* ── 返回按鈕 ── */}
      <button
        onClick={() => router.push('/dashboard/courses')}
        className="flex items-center gap-1.5 text-sm mb-8 transition-opacity duration-150 hover:opacity-60"
        style={{ color: '#6D97B6' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回課程列表
      </button>

      {/* ══════════════════════════════════════════
          上半部：課程基本資訊卡片
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="flex gap-6 p-6">

          {/* 左：封面縮圖 */}
          <div className="w-44 h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
            {course.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.4">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
          </div>

          {/* 右：課程資訊 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1
                  className="text-xl font-semibold tracking-tight leading-snug truncate"
                  style={{ color: '#1D1D1F' }}
                >
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  {/* 狀態 Badge */}
                  <span
                    className="inline-block text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {/* 價格 */}
                  <span className="text-sm font-semibold tabular-nums" style={{ color: '#6D97B6' }}>
                    {formatPrice(course.price)}
                  </span>
                </div>
                {course.description && (
                  <p className="text-sm mt-2 line-clamp-2 leading-relaxed" style={{ color: '#6E6E73' }}>
                    {course.description}
                  </p>
                )}
              </div>

              {/* 編輯課程資訊按鈕（預留）*/}
              <button
                className="
                  shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium
                  border border-black/[0.08] transition-all duration-150
                  hover:bg-black/[0.04]
                "
                style={{ color: '#6E6E73' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                編輯課程資訊
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          下半部：單元管理區塊
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* 區塊標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>
              課程單元
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
              Lessons · 共 {lessons.length} 個單元
            </p>
          </div>

          {/* 新增單元按鈕 */}
          <Link
            href={`/dashboard/courses/${courseId}/lessons/new`}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white
              transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
              active:translate-y-0 active:shadow-sm active:brightness-95
            "
            style={{ backgroundColor: '#6D97B6' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新增單元
          </Link>
        </div>

        {/* 空狀態 */}
        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p className="text-sm" style={{ color: '#AEAEB2' }}>
              目前尚無單元，請點擊右上方按鈕新增。
            </p>
          </div>
        )}

        {/* 單元清單 */}
        {lessons.length > 0 && (
          <ul>
            {lessons.map((lesson, idx) => (
              <li
                key={lesson.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors duration-100 hover:bg-black/[0.018]"
                style={{ borderBottom: idx < lessons.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
              >
                {/* 順序號 */}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'rgba(109,151,182,0.10)', color: '#6D97B6' }}
                >
                  {lesson.sequence_order}
                </span>

                {/* 單元名稱 */}
                <span className="flex-1 text-sm font-medium" style={{ color: '#1D1D1F' }}>
                  {lesson.title}
                </span>

                {/* 免費試看 Badge */}
                {lesson.is_free_preview && (
                  <span
                    className="text-[10px] font-medium tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}
                  >
                    免費試看
                  </span>
                )}

                {/* 編輯按鈕 */}
                <Link
                  href={`/dashboard/courses/${courseId}/lessons/${lesson.id}/edit`}
                  className="text-xs font-medium transition-opacity duration-150 hover:opacity-60 shrink-0"
                  style={{ color: '#6D97B6' }}
                >
                  編輯
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
