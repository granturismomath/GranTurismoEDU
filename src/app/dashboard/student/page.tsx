import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

// ─── TypeScript 型別定義 ───────────────────────────────────────────────────────

type UserProfile = {
  name: string | null
  grade: string | null
}

type EnrolledCourse = {
  id: string
  title: string
  subject: string | null
  description: string | null
  price: number | null
  cover_image_url: string | null
  created_at: string
  enrolled_at: string
  progress: number   // 0–100，可接入 lesson_completions 表格取得真實進度
}

type SubjectStyle = {
  label:    string
  color:    string
  bg:       string
  glow:     string
  gradient: string
}

// ─── 工具函式 ─────────────────────────────────────────────────────────────────

/** 智慧塗裝：優先讀取 subject 欄位，次以 title 關鍵字推斷 */
function getSubjectStyle(title: string, subject?: string | null): SubjectStyle {
  const MATH = { label: '數學', color: '#6D97B6', bg: 'rgba(109,151,182,0.12)', glow: 'rgba(109,151,182,0.28)', gradient: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 100%)' }
  const CHN  = { label: '國文', color: '#C8474B', bg: 'rgba(200,71,75,0.10)',   glow: 'rgba(200,71,75,0.22)',   gradient: 'linear-gradient(135deg, #C8474B 0%, #A53237 100%)' }
  const ENG  = { label: '英文', color: '#597E5B', bg: 'rgba(89,126,91,0.10)',   glow: 'rgba(89,126,91,0.22)',   gradient: 'linear-gradient(135deg, #597E5B 0%, #3D6040 100%)' }

  const detect = (s: string): SubjectStyle | null => {
    if (s.includes('數學') || s.toLowerCase().includes('math'))                                      return MATH
    if (s.includes('國文') || s.includes('語文') || s.includes('寫作') || s.includes('作文'))        return CHN
    if (s.includes('英文') || s.includes('英語') || s.toLowerCase().includes('english'))             return ENG
    return null
  }

  return (subject ? detect(subject) : null) ?? detect(title) ?? MATH
}

// ─── 學習統計儀表卡 ───────────────────────────────────────────────────────────

function StatCard({
  value, label, icon, color, bgColor,
}: {
  value: string | number
  label: string
  icon: ReactNode
  color: string
  bgColor: string
}) {
  return (
    <div
      className="relative flex-1 min-w-0 rounded-3xl p-5 sm:p-6 overflow-hidden backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* 右上角裝飾光點 */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
        style={{ backgroundColor: color }}
      />

      {/* Icon 背景框 */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </div>

      {/* 數字 */}
      <p
        className="text-3xl font-extrabold tabular-nums tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </p>

      {/* 標籤 */}
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </p>
    </div>
  )
}

// ─── 空車庫狀態 ───────────────────────────────────────────────────────────────

function EmptyGarage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-7">

      {/* 圖示：超跑輪廓 */}
      <div
        className="relative w-28 h-28 rounded-3xl flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(109,151,182,0.07)',
          border: '1px solid rgba(109,151,182,0.14)',
        }}
      >
        {/* 方格旗底紋 */}
        <div
          className="absolute inset-0 rounded-3xl opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-conic-gradient(#1D1D1F 0% 25%, transparent 0% 50%)',
            backgroundSize: '8px 8px',
          }}
        />
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#6D97B6" strokeWidth="1.3">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>

      {/* 文案 */}
      <div className="text-center max-w-xs">
        <h3
          className="text-xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          車庫空空如也
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          您的賽道還沒有任何超跑。前往探索課程，找到您的第一輛戰車！
        </p>
      </div>

      {/* 動態漸層 CTA 按鈕 */}
      <Link
        href="/dashboard/explore"
        className="
          inline-flex items-center gap-2
          px-8 py-4 rounded-3xl
          text-sm font-semibold text-white
          hover:-translate-y-1 hover:brightness-110 hover:shadow-2xl
          transition-all duration-300 ease-out
          active:translate-y-0
        "
        style={{
          background: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 100%)',
          boxShadow: '0 8px 28px rgba(109,151,182,0.38)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        探索課程商城
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

    </div>
  )
}

// ─── 已購課程卡片（含進度條 + 啟動引擎按鈕） ─────────────────────────────────

function EnrolledCourseCard({ course }: { course: EnrolledCourse }) {
  const subject     = getSubjectStyle(course.title, course.subject)
  const progressPct = Math.max(0, Math.min(100, course.progress))
  const isCompleted = progressPct >= 100

  return (
    /* 外層：負責 Glow 暈光，本身不 overflow-hidden */
    <div className="group relative">

      {/* 學科色 Glow（hover 時升起） */}
      <div
        className="
          absolute inset-2 rounded-3xl -z-10
          opacity-0 group-hover:opacity-100
          transition-all duration-500 ease-out blur-2xl
        "
        style={{ background: subject.glow }}
      />

      {/* 主卡片 */}
      <div
        className="
          relative rounded-3xl overflow-hidden backdrop-blur-xl
          group-hover:-translate-y-1.5 group-hover:shadow-2xl
          transition-all duration-300 ease-out
        "
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >

        {/* 底右角方格旗幾何裝飾 */}
        <div
          className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none z-0"
          style={{
            backgroundImage:
              'repeating-conic-gradient(rgba(29,29,31,1) 0% 25%, transparent 0% 50%)',
            backgroundSize: '9px 9px',
            opacity: 0.035,
            maskImage:
              'radial-gradient(ellipse 100% 100% at 100% 100%, black 15%, transparent 68%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 100% 100% at 100% 100%, black 15%, transparent 68%)',
          }}
        />

        {/* ════════════ 封面圖 ════════════ */}
        <div className="h-44 overflow-hidden relative">

          {/* 頂部 2px 學科色條 */}
          <div
            className="absolute top-0 inset-x-0 z-10"
            style={{ height: '2px', background: subject.gradient }}
          />

          {course.cover_image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2 relative"
              style={{ background: 'linear-gradient(145deg, #EEF3F7 0%, #DFE9F0 100%)' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle, ${subject.glow} 1.2px, transparent 1.2px)`,
                  backgroundSize: '18px 18px',
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #1D1D1F 0px, #1D1D1F 1px, transparent 1px, transparent 12px)',
                }}
              />
              <div
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: subject.bg }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={subject.color} strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
            </div>
          )}

          {/* 完課徽章 */}
          {isCompleted && (
            <div
              className="absolute top-4 left-4 z-10 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-sm"
              style={{ backgroundColor: '#34C759', color: '#fff' }}
            >
              完成 ✓
            </div>
          )}
        </div>

        {/* ════════════ 進度條（4px，學科色，全滿圓角） ════════════ */}
        <div
          className="w-full"
          style={{ height: '4px', backgroundColor: 'var(--border-subtle)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: subject.gradient,
              minWidth: progressPct > 0 ? '8px' : '0px',
            }}
          />
        </div>

        {/* ════════════ 卡片內容 ════════════ */}
        <div className="relative z-10 p-5 flex flex-col gap-3">

          {/* 學科 Badge + 進度百分比 */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full"
              style={{ color: subject.color, backgroundColor: subject.bg }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              {subject.label}
            </span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {progressPct}%
            </span>
          </div>

          {/* 課程名稱 */}
          <h2
            className="
              text-sm font-semibold leading-snug tracking-tight
              transition-colors duration-300
              group-hover:text-[#6D97B6]
            "
            style={{ color: 'var(--text-primary)' }}
          >
            {course.title}
          </h2>

          {/* 課程描述 */}
          {course.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {course.description}
            </p>
          )}

          {/* ── 啟動引擎 CTA 按鈕 ── */}
          <Link
            href={`/dashboard/my-courses/${course.id}`}
            className="
              block w-full py-3 mt-1
              rounded-3xl
              text-sm font-semibold text-white text-center
              transition-all duration-300 ease-out
              hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg
              active:translate-y-0 active:brightness-100
            "
            style={{
              background: subject.gradient,
              boxShadow: `0 4px 14px ${subject.glow}`,
            }}
          >
            {isCompleted ? '重溫課程&nbsp;↩' : '啟動引擎&nbsp;→'}
          </Link>

        </div>
      </div>
    </div>
  )
}

// ─── 主頁面（Server Component）────────────────────────────────────────────────

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  // ── 身分驗證 ──
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── 讀取使用者資料 ──
  const { data: profile } = await supabase
    .from('users')
    .select('name, grade')
    .eq('id', user.id)
    .single<UserProfile>()

  // ── 讀取購買紀錄（enrollments） ──
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = (enrollments ?? []).map(e => e.course_id)

  // ── 讀取已購課程完整資料 ──
  let enrolledCourses: EnrolledCourse[] = []

  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)

    // 組合 enrolledAt + 進度（預設 0，可接入 lesson_completions 表格擴充）
    enrolledCourses = (courses ?? []).map(course => ({
      id:              course.id,
      title:           course.title,
      subject:         course.subject ?? null,
      description:     course.description ?? null,
      price:           course.price ?? null,
      cover_image_url: course.cover_image_url ?? null,
      created_at:      course.created_at,
      enrolled_at:     enrollments?.find(e => e.course_id === course.id)?.created_at ?? '',
      progress:        0,  // TODO: 接入 lesson_completions 計算真實百分比
    }))
  }

  // ── 衍生統計數據 ──
  const userName        = profile?.name ?? '車手'
  const totalCourses    = enrolledCourses.length
  const inProgress      = enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length
  const completed       = enrolledCourses.filter(c => c.progress >= 100).length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-10 md:px-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ══════════════════════════════════════════════════════════════
            HERO — 歡迎回來 Banner
            · 品牌藍漸層 + 方格旗背景紋 + 環境光暈
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded-3xl overflow-hidden px-8 py-10 md:py-12"
          style={{
            background: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 55%, #3A6E95 100%)',
            boxShadow: '0 24px 64px rgba(109,151,182,0.30)',
          }}
        >
          {/* 方格旗底紋 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-conic-gradient(rgba(255,255,255,0.055) 0% 25%, transparent 0% 50%)',
              backgroundSize: '22px 22px',
            }}
          />
          {/* 右側環境光暈 */}
          <div
            className="absolute right-0 top-0 w-2/3 h-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at right center, rgba(255,255,255,0.13) 0%, transparent 62%)',
            }}
          />

          <div className="relative z-10">
            {/* 狀態 Badge */}
            <div
              className="
                inline-flex items-center gap-2
                px-3 py-1 mb-5 rounded-full
                text-[11px] font-semibold tracking-widest uppercase
              "
              style={{
                backgroundColor: 'rgba(255,255,255,0.17)',
                border: '1px solid rgba(255,255,255,0.26)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              駕駛艙上線中
            </div>

            {/* 主標題 */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight mb-2">
              歡迎回來，{userName}
            </h1>

            {/* 副標題 */}
            <p
              className="text-base max-w-lg"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              {totalCourses > 0
                ? `超跑已就位，引擎隨時等候啟動。您目前擁有 ${totalCourses} 堂精選課程。`
                : '超跑已就位，快去探索您的第一堂課，展開極速成長之旅！'}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STATS — 數位轉速儀表面板
            · 3 個學習維度：已購 / 學習中 / 已完成
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-4">

          <StatCard
            value={totalCourses}
            label="已購課程"
            color="#6D97B6"
            bgColor="rgba(109,151,182,0.12)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />

          <StatCard
            value={inProgress}
            label="學習中"
            color="#C8474B"
            bgColor="rgba(200,71,75,0.10)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
          />

          <StatCard
            value={completed}
            label="已完成"
            color="#597E5B"
            bgColor="rgba(89,126,91,0.10)"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />

        </div>

        {/* ══════════════════════════════════════════════════════════════
            COURSES — 繼續學習 / 空車庫狀態
        ══════════════════════════════════════════════════════════════ */}
        <div>

          {/* 區塊標題列 */}
          <div className="flex items-end justify-between mb-8">
            <div>
              {/* 小 Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-[11px] font-semibold tracking-widest uppercase"
                style={{
                  color: '#6D97B6',
                  backgroundColor: 'rgba(109,151,182,0.10)',
                  border: '1px solid rgba(109,151,182,0.20)',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Continue Learning
              </div>

              <h2
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                繼續學習
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                選擇一堂課，踩下油門，全速前進
              </p>
            </div>

            {enrolledCourses.length > 0 && (
              <Link
                href="/dashboard/my-courses"
                className="
                  inline-flex items-center gap-1 shrink-0
                  text-sm font-semibold
                  hover:opacity-70 transition-opacity duration-200
                "
                style={{ color: '#6D97B6' }}
              >
                查看全部
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}
          </div>

          {/* 課程 Grid 或空車庫 */}
          {enrolledCourses.length === 0 ? (
            <EmptyGarage />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(course => (
                <EnrolledCourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
