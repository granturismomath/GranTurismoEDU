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

type Lesson = {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  sequence_order: number
  is_free_preview: boolean
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatPrice(price: number | null) {
  if (price == null) return '洽詢價格'
  if (price === 0) return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

// ── YouTube URL → embed URL 轉換 ──────────────────────────────
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // youtube.com/watch?v=xxx
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    // youtu.be/xxx
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    // vimeo.com/xxx
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace('/', '')
      return `https://player.vimeo.com/video/${id}`
    }
    // 其他網址：直接回傳（讓 iframe 嘗試載入）
    return url
  } catch {
    return null
  }
}
// ─────────────────────────────────────────────────────────────

export default function CourseRoomPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params.id as string

  const [course, setCourse]               = useState<Course | null>(null)
  const [lessons, setLessons]             = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)

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
        const list = lessonsRes.data ?? []
        setLessons(list)
        if (list.length > 0) setCurrentLesson(list[0])
      }
      setIsLoading(false)
    })
  }, [courseId])

  // ── 返回按鈕 ──
  const BackButton = () => (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-sm mb-6 transition-opacity duration-150 hover:opacity-60"
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
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#6D97B6' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm" style={{ color: '#AEAEB2' }}>課程載入中…</span>
        </div>
      </div>
    )
  }

  // ── 錯誤 ──
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
            className="mt-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: '#6D97B6' }}
          >
            返回課程列表
          </button>
        </div>
      </div>
    )
  }

  const embedUrl = currentLesson?.video_url ? toEmbedUrl(currentLesson.video_url) : null

  return (
    <div className="p-8">

      {/* ── 返回 + 課程標題 ── */}
      <BackButton />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
          {course.title}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full tabular-nums"
            style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#6D97B6' }}
          >
            {formatPrice(course.price)}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(52,199,89,0.10)', color: '#34C759' }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            已擁有
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          主體雙欄：Mobile 上下堆疊 / Desktop 左右並排
      ══════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ── 左側主區塊 (lg:w-2/3) ── */}
        <div className="w-full lg:w-2/3">

          {/* 影片播放器 */}
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="w-full aspect-video rounded-2xl shadow-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentLesson?.title ?? '課程影片'}
            />
          ) : (
            /* 佔位符：無影片時顯示 */
            <div className="w-full aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center shadow-lg overflow-hidden relative">
              {course.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              )}
              <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/10 backdrop-blur-sm border border-white/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <p className="relative z-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {lessons.length === 0 ? '本課程尚未上傳影片' : '影片播放器準備中…'}
              </p>
            </div>
          )}

          {/* 當前單元資訊 */}
          {currentLesson && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#1D1D1F' }}>
                {currentLesson.title}
              </h2>
              {currentLesson.description && (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6E6E73' }}>
                  {currentLesson.description}
                </p>
              )}
            </div>
          )}

          {/* 分隔線 + 課程簡介 */}
          <hr className="my-8 border-gray-100" />
          <div>
            <h3 className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#AEAEB2' }}>
              課程簡介
            </h3>
            {course.description ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#3D3D3F' }}>
                {course.description}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: '#C7C7CC' }}>本課程暫無簡介。</p>
            )}
          </div>
        </div>

        {/* ── 右側：章節目錄面板 (lg:w-1/3) ── */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-8">

          {/* 面板標題 */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>課程單元</h3>
            <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>共 {lessons.length} 個單元</p>
          </div>

          {/* 單元列表 */}
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-xs" style={{ color: '#AEAEB2' }}>尚無單元</p>
            </div>
          ) : (
            <ul className="max-h-[480px] overflow-y-auto">
              {lessons.map(lesson => {
                const isActive = currentLesson?.id === lesson.id
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => setCurrentLesson(lesson)}
                      className="w-full text-left flex items-start gap-3 px-5 py-4 transition-colors duration-150"
                      style={{
                        backgroundColor: isActive ? 'rgba(109,151,182,0.08)' : 'transparent',
                        borderLeft: isActive ? '4px solid #6D97B6' : '4px solid transparent',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.02)'
                      }}
                      onMouseLeave={e => {
                        if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      {/* 順序號 */}
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor: isActive ? 'rgba(109,151,182,0.2)' : 'rgba(0,0,0,0.06)',
                          color: isActive ? '#6D97B6' : '#8E8E93',
                        }}
                      >
                        {lesson.sequence_order}
                      </span>

                      {/* 單元名稱 + Badge */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-snug"
                          style={{ color: isActive ? '#6D97B6' : '#1D1D1F' }}
                        >
                          {lesson.title}
                        </p>
                        {lesson.is_free_preview && (
                          <span
                            className="inline-block mt-1 text-[9px] font-medium tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}
                          >
                            免費試看
                          </span>
                        )}
                      </div>

                      {/* 播放中指示 */}
                      {isActive && (
                        <svg className="shrink-0 mt-1" width="12" height="12" viewBox="0 0 24 24" fill="#6D97B6">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
