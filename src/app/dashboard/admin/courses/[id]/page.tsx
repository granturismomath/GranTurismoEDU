import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ChapterForm from './ChapterForm'

// ── 型別定義 ─────────────────────────────────────────────────
type Course = {
  id:              string
  title:           string
  description:     string | null
  subject:         string | null
  price:           number
  status:          string
  cover_image_url: string | null
  created_at:      string
}

type Chapter = {
  id:          string
  title:       string
  description: string | null
  video_url:   string | null
  is_free:     boolean
  order_index: number
}

// ── 學科顯示名稱 ──────────────────────────────────────────────
const SUBJECT_NAMES: Record<string, string> = {
  math:    '📐 數學',
  chinese: '📚 國文',
  english: '🔤 英文',
}

// ── 狀態 Badge ────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '運轉中',  bg: 'rgba(52,199,89,0.12)',  color: '#34C759' },
  draft:     { label: '車庫保養', bg: 'rgba(142,142,147,0.1)', color: '#8E8E93' },
}

// ─────────────────────────────────────────────────────────────
// CourseWorkshopPage — 課程維修站（Server Component）
//
// 流程：
//   1. 驗證身份，非 owner / admin 導向 explore
//   2. 並行撈取課程資料 + 所有章節（依 order_index 排序）
//   3. 渲染三個區塊（A: 課程資訊、B: 章節清單、C: 新增表單）
// ─────────────────────────────────────────────────────────────
export default async function CourseWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseId } = await params
  const supabase = await createClient()

  // ── 1. 驗證身份與角色 ──
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard/explore')
  }

  const isOwner = profile.role === 'owner'

  // ── 2. 並行撈取課程 + 章節 ──
  const [courseRes, chaptersRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, subject, price, status, cover_image_url, created_at')
      .eq('id', courseId)
      .single(),

    supabase
      .from('chapters')
      .select('id, title, description, video_url, is_free, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
  ])

  // 找不到課程 → 404
  if (courseRes.error || !courseRes.data) notFound()

  const course: Course   = courseRes.data
  const chapters: Chapter[] = chaptersRes.data ?? []
  const badge = STATUS_BADGE[course.status] ?? STATUS_BADGE.draft
  const subjectName = course.subject ? (SUBJECT_NAMES[course.subject] ?? course.subject) : null

  return (
    <div className="p-6 max-w-6xl space-y-6">

      {/* ── 返回按鈕 ── */}
      <Link
        href="/dashboard/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm transition-opacity duration-150 hover:opacity-60"
        style={{ color: '#6D97B6' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        返回彈藥庫
      </Link>

      {/* ══════════════════════════════════════════
          區塊 A：課程基本資訊卡片
      ══════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-6 backdrop-blur-xl transition-colors duration-300"
        style={{
          backgroundColor: 'var(--card-bg)',
          border:          '1px solid var(--border-subtle)',
          boxShadow:       '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex gap-6 items-start">

          {/* 封面縮圖 */}
          <div className="w-40 h-24 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--nav-hover-bg)' }}>
            {course.cover_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--border-subtle)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
          </div>

          {/* 課程資訊 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">

                {/* 學科 + 狀態標籤列 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {subjectName && (
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#6D97B6' }}>
                      {subjectName}
                    </span>
                  )}
                  <span className="text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                {/* 課程名稱 */}
                <h1 className="text-xl font-bold tracking-tight leading-snug"
                  style={{ color: 'var(--text-primary)' }}>
                  {course.title}
                </h1>

                {/* 課程描述 */}
                {course.description && (
                  <p className="mt-1.5 text-sm line-clamp-2 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}>
                    {course.description}
                  </p>
                )}

                {/* 售價 */}
                <p className="mt-2 text-base font-semibold tabular-nums" style={{ color: '#6D97B6' }}>
                  {course.price === 0 ? '免費' : `NT$ ${course.price.toLocaleString('zh-TW')}`}
                </p>
              </div>

              {/* 編輯基本資訊按鈕（owner 限定）*/}
              {isOwner && (
                <Link
                  href={`/dashboard/courses/${courseId}/edit`}
                  className="
                    shrink-0 inline-flex items-center gap-1.5
                    px-4 py-2 rounded-xl text-xs font-medium
                    transition-all duration-150
                  "
                  style={{
                    color:           'var(--text-secondary)',
                    border:          '1px solid var(--border-subtle)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  編輯基本資訊
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          下半部：左右兩欄佈局
          左欄 (B): 章節清單
          右欄 (C): 新增章節表單
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── 區塊 B：章節清單 ── */}
        <div
          className="rounded-3xl overflow-hidden backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: 'var(--card-bg)',
            border:          '1px solid var(--border-subtle)',
            boxShadow:       '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* 區塊標題 */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                章節清單
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Chapters · 共 {chapters.length} 集
              </p>
            </div>

            {/* 右上：章節統計膠囊 */}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="px-2 py-1 rounded-lg text-[11px]"
                style={{ backgroundColor: 'rgba(255,159,10,0.10)', color: '#FF9F0A' }}>
                免費試看 {chapters.filter(c => c.is_free).length} 集
              </span>
            </div>
          </div>

          {/* 空狀態 */}
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                style={{ color: 'var(--border-subtle)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                尚無章節，請使用右側表單新增第一集。
              </p>
            </div>
          ) : (
            <ul>
              {chapters.map((chapter, idx) => (
                <li
                  key={chapter.id}
                  className="flex items-start gap-4 px-6 py-4 transition-colors duration-150"
                  style={{
                    borderBottom: idx < chapters.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  }}
                >
                  {/* 集數號碼 */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#6D97B6' }}
                  >
                    {chapter.order_index}
                  </span>

                  {/* 章節資訊 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {chapter.title}
                    </p>
                    {chapter.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                        {chapter.description}
                      </p>
                    )}
                    {/* 影片狀態 */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {chapter.video_url ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(52,199,89,0.10)', color: '#34C759' }}>
                          🎬 影片已上傳
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--nav-hover-bg)', color: 'var(--text-tertiary)' }}>
                          ⏳ 影片待上傳
                        </span>
                      )}
                      {chapter.is_free && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(255,159,10,0.10)', color: '#FF9F0A' }}>
                          免費試看
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 區塊 C：新增章節表單 ── */}
        <div
          className="rounded-3xl p-6 backdrop-blur-xl transition-colors duration-300 lg:sticky lg:top-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            border:          '1px solid var(--border-subtle)',
            boxShadow:       '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div className="mb-5">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              新增章節
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              將自動排在最後一集
            </p>
          </div>

          {/* 注入 courseId，由 Client Component 接手呼叫 Server Action */}
          <ChapterForm courseId={courseId} />
        </div>

      </div>
    </div>
  )
}
