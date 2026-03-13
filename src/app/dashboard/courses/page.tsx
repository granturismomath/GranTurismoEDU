'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ── 型別定義 ──────────────────────────────────────────────────
type Course = {
  id: string
  title: string
  price: number | null
  status: string
  created_at: string
}
// ─────────────────────────────────────────────────────────────

// ── 狀態 Badge 對照 ───────────────────────────────────────────
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '已發布', bg: 'rgba(52,199,89,0.12)',  color: '#34C759' },
  draft:     { label: '草稿',   bg: 'rgba(0,0,0,0.06)',       color: '#8E8E93' },
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatPrice(price: number | null) {
  if (price == null) return '—'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses]     = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError('資料載入失敗，請稍後再試。')
        } else {
          setCourses(data ?? [])
        }
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="p-8">

      {/* ── 頂部區域 ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: '#1D1D1F' }}
          >
            課程管理
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
            管理所有已上架與草稿中的課程內容
          </p>
        </div>

        {/* 新增課程按鈕 */}
        <button
          onClick={() => router.push('/dashboard/courses/new')}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white
            transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
            active:translate-y-0 active:shadow-sm active:brightness-95
          "
          style={{ backgroundColor: '#6D97B6' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增課程
        </button>
      </div>

      {/* ── 課程列表容器 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* 載入中 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg
              className="animate-spin h-7 w-7"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              style={{ color: '#6D97B6' }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm" style={{ color: '#AEAEB2' }}>資料載入中…</span>
          </div>
        )}

        {/* 錯誤狀態 */}
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

        {/* 空狀態 */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <p className="text-sm" style={{ color: '#AEAEB2' }}>
              目前尚無課程，點擊上方按鈕新增您的第一堂課！
            </p>
          </div>
        )}

        {/* 資料表格 */}
        {!isLoading && !error && courses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['課程名稱', '價格', '狀態', '建立時間', '操作'].map(col => (
                    <th
                      key={col}
                      className="px-5 py-3.5 text-left font-medium text-xs tracking-wider whitespace-nowrap"
                      style={{ color: '#AEAEB2' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((c, idx) => {
                  const badge = STATUS_BADGE[c.status] ?? { label: c.status, bg: 'rgba(0,0,0,0.06)', color: '#8E8E93' }
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors duration-100 hover:bg-black/[0.018]"
                      style={{ borderBottom: idx < courses.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                    >
                      {/* 課程名稱 */}
                      <td className="px-5 py-4 font-medium" style={{ color: '#1D1D1F' }}>
                        {c.title}
                      </td>

                      {/* 價格 */}
                      <td className="px-5 py-4 whitespace-nowrap tabular-nums" style={{ color: '#3D3D3F' }}>
                        {formatPrice(c.price)}
                      </td>

                      {/* 狀態 Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-block text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* 建立時間 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#AEAEB2' }}>
                        {formatDate(c.created_at)}
                      </td>

                      {/* 操作 */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/courses/${c.id}`}
                          className="text-xs font-medium transition-opacity duration-150 hover:opacity-60"
                          style={{ color: '#6D97B6' }}
                        >
                          編輯
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 底部筆數統計 */}
      {!isLoading && !error && courses.length > 0 && (
        <p className="mt-4 text-xs text-right" style={{ color: '#AEAEB2' }}>
          共 {courses.length} 堂課程
        </p>
      )}
    </div>
  )
}
