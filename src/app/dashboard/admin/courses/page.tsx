import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

// ── 型別定義 ─────────────────────────────────────────────────
type Course = {
  id:              string
  title:           string
  description:     string | null
  subject:         string
  price:           number
  status:          string
  cover_image_url: string | null
  created_at:      string
}

// ── 學科塗裝引擎（Color Mapping Engine）─────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  math:    'bg-[#6D97B6]/10 text-[#6D97B6] border-[#6D97B6]/20',   // GT 藍
  chinese: 'bg-[#C8474B]/10 text-[#C8474B] border-[#C8474B]/20',   // 磚紅
  english: 'bg-[#597E5B]/10 text-[#597E5B] border-[#597E5B]/20',   // 森林綠
}

const SUBJECT_NAMES: Record<string, string> = {
  math:    '📐 數學',
  chinese: '📚 國文',
  english: '🔤 英文',
}

// ─────────────────────────────────────────────────────────────
// CoursesDashboardPage — Server Component
//
// 流程：
//   1. 驗證身份，非 owner / admin 導向 explore
//   2. 從 Supabase 抓取 courses（由新到舊）
//   3. 渲染彈藥庫卡片 Grid
// ─────────────────────────────────────────────────────────────
export default async function CoursesDashboardPage() {
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

  // ── 2. 從 Supabase 讀取課程列表（最新在前）──
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, description, subject, price, status, cover_image_url, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* ── 頂部導航與行動呼籲 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            彈藥庫{' '}
            <span className="font-light" style={{ color: '#6D97B6' }}>| 課程管理</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            管理您所有的賽道與教學資源
          </p>
        </div>

        {/* 只有 owner 可以新增課程 */}
        {isOwner && (
          <Link
            href="/dashboard/courses/new"
            className="
              px-6 py-3 text-white font-medium rounded-2xl shadow-md
              hover:shadow-lg hover:-translate-y-0.5
              transition-all duration-300
            "
            style={{ backgroundColor: '#6D97B6' }}
          >
            + 打造新賽道
          </Link>
        )}
      </div>

      {/* ── 錯誤狀態 ── */}
      {error && (
        <div
          className="px-5 py-4 rounded-2xl text-sm"
          style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
        >
          資料載入失敗：{error.message}
        </div>
      )}

      {/* ── 空狀態 ── */}
      {!error && (!courses || courses.length === 0) && (
        <div
          className="flex flex-col items-center justify-center py-32 gap-4 rounded-3xl"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: 'var(--border-subtle)' }}>
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            車庫目前空空如也
          </p>
          {isOwner && (
            <Link
              href="/dashboard/courses/new"
              className="text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all duration-200 hover:opacity-80"
              style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}
            >
              打造你的第一條賽道 →
            </Link>
          )}
        </div>
      )}

      {/* ── 課程卡片 Grid ── */}
      {!error && courses && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(courses as Course[]).map(course => {
              const colorClass  = SUBJECT_COLORS[course.subject] ?? 'bg-gray-100/50 text-gray-500 border-gray-200'
              const subjectName = SUBJECT_NAMES[course.subject]  ?? course.subject
              const isPublished = course.status === 'published'

              return (
                <div
                  key={course.id}
                  className="
                    group relative rounded-3xl p-6 shadow-sm
                    hover:shadow-2xl hover:-translate-y-1
                    transition-all duration-500 overflow-hidden
                  "
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    backdropFilter:  'blur(20px)',
                    border:          '1px solid var(--border-subtle)',
                  }}
                >
                  {/* 裝飾性背景光暈 */}
                  <div
                    className="
                      absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24
                      bg-gradient-to-br from-gray-100 to-transparent
                      opacity-20 rounded-full blur-2xl
                      transition-transform group-hover:scale-150
                    "
                    style={{ backgroundColor: 'var(--nav-hover-bg)' }}
                  />

                  <div className="relative z-10 space-y-4">

                    {/* 學科標籤 + 狀態 */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${colorClass}`}>
                        {subjectName}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        {isPublished ? '🟢 運轉中' : '🟡 車庫保養'}
                      </span>
                    </div>

                    {/* 封面縮圖（若有）*/}
                    {course.cover_image_url && (
                      <div className="w-full h-32 rounded-2xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={course.cover_image_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 課程標題與售價 */}
                    <div>
                      <h3
                        className="text-xl font-bold line-clamp-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {course.title}
                      </h3>
                      {course.description && (
                        <p
                          className="mt-1 text-xs line-clamp-2"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {course.description}
                        </p>
                      )}
                      <p className="mt-2 text-2xl font-light" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-sm font-medium mr-1" style={{ color: 'var(--text-tertiary)' }}>NT$</span>
                        {course.price.toLocaleString('zh-TW')}
                      </p>
                    </div>

                    {/* 編輯按鈕（owner 限定）*/}
                    {isOwner && (
                      <div
                        className="pt-4"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                      >
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="
                            block w-full py-2 text-center text-sm font-medium rounded-xl
                            transition-colors duration-200
                          "
                          style={{
                            color:           '#6D97B6',
                            backgroundColor: 'rgba(109,151,182,0.1)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(109,151,182,0.2)'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(109,151,182,0.1)'
                          }}
                        >
                          進入維修站（編輯）→
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部統計 */}
          <p className="text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>
            共 <strong style={{ color: 'var(--text-secondary)' }}>{courses.length}</strong> 堂課程・
            已發布 <strong style={{ color: '#34C759' }}>{courses.filter(c => c.status === 'published').length}</strong> 堂・
            草稿 <strong style={{ color: '#AEAEB2' }}>{courses.filter(c => c.status === 'draft').length}</strong> 堂
          </p>
        </>
      )}
    </div>
  )
}
