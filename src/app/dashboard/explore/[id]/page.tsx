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
  cover_image_url: string | null
  created_at: string
}

type Lesson = {
  id: string
  title: string
  sequence_order: number
  is_free_preview: boolean
}

type Enrollment = {
  id: string
  user_id: string
  course_id: string
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatPrice(price: number | null) {
  if (price == null) return '洽詢價格'
  if (price === 0) return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

export default function CourseDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params.id as string

  const [course, setCourse]         = useState<Course | null>(null)
  const [lessons, setLessons]       = useState<Lesson[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [isLoading, setIsLoading]   = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const uid = user?.id ?? null
      setUserId(uid)

      const [courseRes, lessonsRes, enrollRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lessons').select('id, title, sequence_order, is_free_preview')
          .eq('course_id', courseId).order('sequence_order', { ascending: true }),
        uid
          ? supabase.from('enrollments').select('*').eq('course_id', courseId).eq('user_id', uid).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])

      if (courseRes.error || !courseRes.data) {
        setError('找不到此課程。')
      } else {
        setCourse(courseRes.data)
        setLessons(lessonsRes.data ?? [])
        setEnrollment(enrollRes.data ?? null)
      }
      setIsLoading(false)
    })
  }, [courseId])

  // ── 結帳邏輯 ──
  const handleEnroll = async () => {
    if (!course || !userId) return
    setEnrollError(null)
    setIsEnrolling(true)
    try {
      const { error: insertError } = await supabase
        .from('enrollments')
        .insert([{ user_id: userId, course_id: course.id }])

      if (insertError) {
        setEnrollError('購買失敗，請稍後再試。')
        return
      }
      router.push(`/dashboard/my-courses/${course.id}`)
      router.refresh()
    } finally {
      setIsEnrolling(false)
    }
  }

  // ── 載入中 ──
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-32 gap-4">
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#6D97B6' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm" style={{ color: '#AEAEB2' }}>課程載入中…</span>
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
        <button onClick={() => router.back()} className="text-sm font-medium hover:opacity-60 transition-opacity" style={{ color: '#6D97B6' }}>
          返回探索課程
        </button>
      </div>
    )
  }

  const isOwned = enrollment != null

  return (
    <div className="p-8 max-w-4xl">

      {/* ── 返回按鈕 ── */}
      <button
        onClick={() => router.push('/dashboard/explore')}
        className="flex items-center gap-1.5 text-sm mb-8 transition-opacity duration-150 hover:opacity-60"
        style={{ color: '#6D97B6' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回探索課程
      </button>

      {/* ══════════════════════════════════════════
          Hero 區塊
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] overflow-hidden mb-8">

        {/* 封面大圖 */}
        <div className="w-full h-72 overflow-hidden bg-gray-100 relative">
          {course.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}

          {/* 已購買標籤 */}
          {isOwned && (
            <div
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
              style={{ backgroundColor: 'rgba(52,199,89,0.90)', color: '#fff' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              已擁有
            </div>
          )}
        </div>

        {/* 內容區 */}
        <div className="p-8">

          {/* 課程標題 */}
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3" style={{ color: '#1D1D1F' }}>
            {course.title}
          </h1>

          {/* 課程簡介 */}
          {course.description && (
            <p className="text-base leading-relaxed whitespace-pre-wrap mb-6" style={{ color: '#6E6E73' }}>
              {course.description}
            </p>
          )}

          {/* 價格 + CTA 區塊 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* 價格 */}
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-bold tabular-nums tracking-tight"
                style={{ color: course.price === 0 ? '#34C759' : '#6D97B6' }}
              >
                {formatPrice(course.price)}
              </span>
            </div>

            {/* 核心行動按鈕 */}
            <div className="flex flex-col gap-2 sm:ml-auto">
              {isOwned ? (
                /* 已購買：前往上課 */
                <button
                  onClick={() => router.push(`/dashboard/my-courses/${course.id}`)}
                  className="
                    flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105
                    active:translate-y-0 active:shadow-sm
                  "
                  style={{ backgroundColor: '#34C759' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  您已擁有此課程，立即前往上課
                </button>
              ) : (
                /* 未購買：立即獲取 */
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="
                    flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-105
                    active:translate-y-0 active:shadow-sm
                    disabled:opacity-60 disabled:cursor-not-allowed
                    disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100
                  "
                  style={{ backgroundColor: '#6D97B6' }}
                >
                  {isEnrolling ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      處理中…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      立即獲取課程 · Enroll Now
                    </>
                  )}
                </button>
              )}

              {/* 結帳錯誤提示 */}
              {enrollError && (
                <p className="text-xs text-center" style={{ color: '#FF3B30' }}>
                  {enrollError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          課程大綱 (Syllabus)
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] overflow-hidden">

        {/* 標題列 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>課程章節</h2>
          <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
            共 {lessons.length} 個單元
          </p>
        </div>

        {/* 章節列表 */}
        {lessons.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm" style={{ color: '#AEAEB2' }}>課程章節即將上線，敬請期待！</p>
          </div>
        ) : (
          <ul>
            {lessons.map((lesson, idx) => (
              <li
                key={lesson.id}
                className="flex items-center gap-4 px-6 py-4"
                style={{
                  borderBottom: idx < lessons.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}
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

                {/* 右側：免費試看 Badge 或 鎖頭 */}
                {lesson.is_free_preview ? (
                  <span
                    className="text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: 'rgba(52,199,89,0.12)', color: '#34C759' }}
                  >
                    免費試看
                  </span>
                ) : (
                  <svg
                    className="shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C7C7CC"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
