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

type SubjectTheme = {
  color: string
  bg: string
  light: string
  label: string
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatPrice(price: number | null): string {
  if (price == null) return '洽詢價格'
  if (price === 0)   return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

// ── YouTube / Vimeo URL → embed URL ──────────────────────────
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v'))
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    if (u.hostname === 'youtu.be')
      return `https://www.youtube.com/embed${u.pathname}`
    if (u.hostname.includes('vimeo.com'))
      return `https://player.vimeo.com/video/${u.pathname.replace('/', '')}`
    return url
  } catch {
    return null
  }
}

// ── 學科變色龍：根據課程名稱自動切換主題色 ──────────────────
function getSubjectTheme(title: string): SubjectTheme {
  const t = title
  if (t.includes('數學') || t.toLowerCase().includes('math'))
    return { color: '#6D97B6', bg: 'rgba(109,151,182,0.14)', light: 'rgba(109,151,182,0.07)', label: '數學' }
  if (t.includes('國文') || t.includes('語文') || t.includes('寫作') || t.includes('作文'))
    return { color: '#C8474B', bg: 'rgba(200,71,75,0.12)', light: 'rgba(200,71,75,0.06)', label: '國文' }
  if (t.includes('英文') || t.includes('英語') || t.toLowerCase().includes('english'))
    return { color: '#597E5B', bg: 'rgba(89,126,91,0.12)', light: 'rgba(89,126,91,0.06)', label: '英文' }
  return { color: '#6D97B6', bg: 'rgba(109,151,182,0.14)', light: 'rgba(109,151,182,0.07)', label: '課程' }
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

  // ════════════════════════════════════════════════════════
  // 載入中 — 骨架屏
  // ════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="px-6 py-10 md:px-10">
        <div className="h-4 w-28 bg-gray-100 rounded-full mb-8 animate-pulse" />
        <div className="space-y-2 mb-10">
          <div className="h-7 w-2/3 bg-gray-100 rounded-full animate-pulse" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="w-full aspect-video bg-gray-100 rounded-3xl animate-pulse" />
            <div className="h-36 bg-gray-100 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-gray-100 h-96 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // 錯誤狀態
  // ════════════════════════════════════════════════════════
  if (error || !course) {
    return (
      <div className="px-6 py-10 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-8 transition-all duration-200 hover:opacity-70"
          style={{ color: '#6D97B6' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回我的課程
        </button>
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gray-50">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold mb-1" style={{ color: '#3D3D3F' }}>找不到此課程</p>
            <p className="text-sm" style={{ color: '#AEAEB2' }}>該課程可能已被下架或連結有誤</p>
          </div>
          <button
            onClick={() => router.back()}
            className="
              px-6 py-2.5 rounded-3xl text-sm font-semibold text-white
              transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
            "
            style={{ backgroundColor: '#6D97B6' }}
          >
            返回課程列表
          </button>
        </div>
      </div>
    )
  }

  // ── 計算衍生狀態 ──
  const theme        = getSubjectTheme(course.title)
  const embedUrl     = currentLesson?.video_url ? toEmbedUrl(currentLesson.video_url) : null
  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id)
  const prevLesson   = currentIndex > 0                  ? lessons[currentIndex - 1] : null
  const nextLesson   = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const progress     = lessons.length > 0 ? Math.round(((currentIndex + 1) / lessons.length) * 100) : 0

  return (
    <div className="px-6 py-8 md:px-10 pb-20">

      {/* ── 返回按鈕 — 主題色 ── */}
      <button
        onClick={() => router.back()}
        className="
          flex items-center gap-1.5 text-sm mb-8
          transition-all duration-200 hover:opacity-70 hover:-translate-x-0.5
        "
        style={{ color: theme.color }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        返回我的課程
      </button>

      {/* ── 課程標題 + 狀態 Badges ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* 學科色標籤 */}
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full"
            style={{ color: theme.color, backgroundColor: theme.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.color }} />
            {theme.label}
          </span>
          {/* 已擁有 */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(52,199,89,0.10)', color: '#34C759' }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            已擁有
          </span>
          {/* 價格 */}
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#6E6E73' }}
          >
            {formatPrice(course.price)}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
          {course.title}
        </h1>
      </div>

      {/* ════════════════════════════════════════════════════════════
          主體雙欄 Grid
          · Mobile (< lg)  → 單欄堆疊（播放器上 / 清單下）
          · Desktop (≥ lg) → col-span-8 播放器 + col-span-4 清單
      ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ════════════════════════════════════
            左欄 col-span-8
            播放器 → 單元資訊 → 課程簡介
        ════════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* ── 🏎️ 賽車級播放器容器 ───────────────────────────
              · 外層 relative 包覆 GT 方格旗點陣背景
              · 內層 rounded-3xl overflow-hidden shadow-2xl
          ─────────────────────────────────────────────── */}
          <div className="relative">

            {/* GT 方格旗幾何點陣背景裝飾（5% 透明度，極度克制） */}
            <div
              className="absolute -inset-4 rounded-[2.5rem] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(29,29,31,0.06) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* 播放器主容器：rounded-3xl + shadow-2xl 懸浮感 */}
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            >
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  className="w-full aspect-video bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentLesson?.title ?? '課程影片'}
                />
              ) : (
                /* ── 無影片佔位符：GT 沉浸式黑色舞台 ── */
                <div className="w-full aspect-video bg-[#0C0C0E] flex flex-col items-center justify-center relative overflow-hidden">
                  {/* 課程封面底圖 */}
                  {course.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-[0.12]"
                    />
                  )}
                  {/* GT 幾何點陣疊加 */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />
                  {/* 速度斜線裝飾 */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(55deg, white 0px, white 1px, transparent 1px, transparent 22px)',
                    }}
                  />
                  {/* 播放按鈕 */}
                  <div className="relative z-10 flex flex-col items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center border border-white/10"
                      style={{ backgroundColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="white" className="ml-1.5 opacity-60">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      {lessons.length === 0 ? '本課程尚未上傳影片' : '影片播放器準備中…'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 目前單元資訊卡 ─────────────────────────────── */}
          {currentLesson && (
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: theme.light,
                border: `1px solid ${theme.bg}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 學科 + 單元序號 */}
                  <p
                    className="text-[11px] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: theme.color }}
                  >
                    正在播放&nbsp;·&nbsp;第 {currentLesson.sequence_order} 單元
                  </p>
                  {/* 單元標題 */}
                  <h2 className="text-xl font-bold tracking-tight mb-2" style={{ color: '#1D1D1F' }}>
                    {currentLesson.title}
                  </h2>
                  {/* 單元描述 */}
                  {currentLesson.description && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6E6E73' }}>
                      {currentLesson.description}
                    </p>
                  )}
                </div>
                {currentLesson.is_free_preview && (
                  <span
                    className="shrink-0 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}
                  >
                    免費試看
                  </span>
                )}
              </div>

              {/* ── 上一課 / 下一課 儀表板按鈕 ── */}
              {(prevLesson || nextLesson) && (
                <div
                  className="flex items-center gap-3 mt-5 pt-5 border-t"
                  style={{ borderColor: theme.bg }}
                >
                  {prevLesson ? (
                    <button
                      onClick={() => setCurrentLesson(prevLesson)}
                      className="
                        flex items-center gap-2 px-4 py-2.5 rounded-3xl
                        text-sm font-semibold
                        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0
                      "
                      style={{ backgroundColor: theme.bg, color: theme.color }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      上一單元
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextLesson && (
                    <button
                      onClick={() => setCurrentLesson(nextLesson)}
                      className="
                        flex items-center gap-2 px-4 py-2.5 rounded-3xl
                        text-sm font-semibold text-white
                        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
                      "
                      style={{
                        backgroundColor: theme.color,
                        boxShadow: `0 4px 14px ${theme.bg}`,
                      }}
                    >
                      下一單元
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 課程簡介 ── */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <h3
              className="text-[11px] font-semibold tracking-widest uppercase mb-4"
              style={{ color: '#AEAEB2' }}
            >
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

        {/* ════════════════════════════════════
            右欄 col-span-4
            章節目錄面板（Desktop: sticky）
        ════════════════════════════════════ */}
        <div
          className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 overflow-hidden lg:sticky lg:top-8"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >

          {/* 面板 Header + 進度條 */}
          <div className="px-5 py-5 border-b border-gray-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
                  課程單元
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
                  共 {lessons.length} 個單元
                  {currentIndex >= 0 && (
                    <>&nbsp;·&nbsp;{currentIndex + 1}&nbsp;/&nbsp;{lessons.length}</>
                  )}
                </p>
              </div>

              {/* 學科色進度環 */}
              {lessons.length > 0 && (
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: theme.color }}>
                    {progress}%
                  </span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%`, backgroundColor: theme.color }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 單元列表 */}
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-xs font-medium" style={{ color: '#AEAEB2' }}>尚無單元</p>
            </div>
          ) : (
            <ul className="max-h-[520px] overflow-y-auto divide-y divide-gray-50/80">
              {lessons.map(lesson => {
                const isActive = currentLesson?.id === lesson.id
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => setCurrentLesson(lesson)}
                      className="
                        group w-full text-left
                        flex items-start gap-3
                        px-5 py-4
                        transition-all duration-300 ease-out
                        hover:bg-gray-50/60
                      "
                      style={{
                        backgroundColor: isActive ? theme.light : undefined,
                        /* 學科色左側邊框高光 */
                        borderLeft: `3px solid ${isActive ? theme.color : 'transparent'}`,
                      }}
                    >
                      {/* 序號圓 / 播放中脈衝圈 */}
                      <div
                        className={`
                          mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0
                          transition-all duration-300
                          ${isActive ? 'animate-pulse' : ''}
                        `}
                        style={{
                          backgroundColor: isActive ? theme.bg : 'rgba(0,0,0,0.05)',
                          color: isActive ? theme.color : '#8E8E93',
                        }}
                      >
                        {isActive ? (
                          /* 播放中 ▶ icon */
                          <svg width="9" height="9" viewBox="0 0 24 24" fill={theme.color}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold">{lesson.sequence_order}</span>
                        )}
                      </div>

                      {/* 文字區：hover 時整體向右位移 (加速感) */}
                      <div className="flex-1 min-w-0 transition-transform duration-300 group-hover:translate-x-1">
                        <p
                          className="text-sm font-medium leading-snug transition-colors duration-200"
                          style={{ color: isActive ? theme.color : '#1D1D1F' }}
                        >
                          {lesson.title}
                        </p>
                        {lesson.is_free_preview && (
                          <span
                            className="inline-block mt-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}
                          >
                            免費試看
                          </span>
                        )}
                      </div>

                      {/* 未播放的序號小字 */}
                      {!isActive && (
                        <span
                          className="shrink-0 mt-1 text-[10px] tabular-nums"
                          style={{ color: '#D1D1D6' }}
                        >
                          {String(lesson.sequence_order).padStart(2, '0')}
                        </span>
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
