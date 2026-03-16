'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import CourseCard, { type Course } from '@/components/CourseCard'

const supabase = createClient()

// ── 骨架卡片 — 與 CourseCard 同等比例 ────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden animate-pulse transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="h-52" style={{ backgroundColor: 'var(--border-subtle)' }} />
      <div className="p-6 space-y-3">
        <div className="h-3 rounded-full w-1/4" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="h-5 rounded-full w-3/4" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="h-3 rounded-full w-full" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="h-6 rounded-full w-1/3" style={{ backgroundColor: 'var(--border-subtle)' }} />
        </div>
        <div className="h-11 rounded-3xl mt-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
      </div>
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────
export default function ExplorePage() {
  const [courses, setCourses]     = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

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
    <div className="px-6 py-10 md:px-10">

      {/* ════════════════════════════════════════════════════════
          頁面 Header
          · 大標題 + 副標題
          · 上方小 Badge 帶閃電 icon 強調「Explore Store」
      ════════════════════════════════════════════════════════ */}
      <div className="mb-14">

        {/* Store Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full text-[11px] font-semibold tracking-widest uppercase"
          style={{
            color: '#6D97B6',
            backgroundColor: 'rgba(109,151,182,0.10)',
            border: '1px solid rgba(109,151,182,0.20)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Explore Store
        </div>

        {/* 大標題 */}
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3 transition-colors duration-300"
          style={{ color: 'var(--text-primary)' }}
        >
          探索課程
        </h1>

        {/* 副標題 */}
        <p className="text-base md:text-lg transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
          選擇你的極速成長引擎&nbsp;
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          &nbsp;每一堂課都是超跑等級的知識升級
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════
          錯誤狀態
      ════════════════════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════════════════════
          載入中：骨架屏 Grid
      ════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          空狀態
      ════════════════════════════════════════════════════════ */}
      {!isLoading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-36 gap-5">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(109,151,182,0.08)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6D97B6" strokeWidth="1.3">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8"  y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold mb-1 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
              目前尚無公開課程
            </p>
            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
              敬請期待！我們正在為您準備頂級課程內容。
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          課程 Grid — 三欄極大間距呼吸空間
      ════════════════════════════════════════════════════════ */}
      {!isLoading && !error && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* 底部課程數量標示 */}
          <p className="mt-12 text-xs text-center transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
            共&nbsp;{courses.length}&nbsp;堂精選課程
          </p>
        </>
      )}

    </div>
  )
}
