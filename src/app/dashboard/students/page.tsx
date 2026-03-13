'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

// ── 型別定義 ──────────────────────────────────────────────────
type UserRow = {
  id: string
  email: string
  role: string
  display_name: string | null
  parent_name: string | null
  student_name: string | null
  phone: string | null
  school: string | null
  grade: string | null
  city: string | null
  district: string | null
  created_at: string
}
// ─────────────────────────────────────────────────────────────

// ── Role Badge 樣式對照 ────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  owner:   { label: 'Owner',   bg: 'rgba(109,151,182,0.12)', color: '#6D97B6' },
  admin:   { label: 'Admin',   bg: 'rgba(255,159,10,0.12)',  color: '#FF9F0A' },
  student: { label: '學員',    bg: 'rgba(52,199,89,0.12)',   color: '#34C759' },
  parent:  { label: '家長',    bg: 'rgba(175,82,222,0.12)',  color: '#AF52DE' },
}
// ─────────────────────────────────────────────────────────────

const supabase = createClient()

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function StudentsPage() {
  const [users, setUsers]       = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError('資料載入失敗，請稍後再試。')
        } else {
          setUsers(data ?? [])
        }
        setIsLoading(false)
      })
  }, [])

  return (
    <div className="p-8">

      {/* ── 頁首 ── */}
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: '#1D1D1F' }}
        >
          學員管理
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
          檢視所有已註冊的學員與家長帳號資訊
        </p>
      </div>

      {/* ── 資料表容器 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── 載入中 ── */}
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

        {/* ── 空狀態 ── */}
        {!isLoading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm" style={{ color: '#AEAEB2' }}>目前尚無學員資料</p>
          </div>
        )}

        {/* ── 資料表格 ── */}
        {!isLoading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['註冊時間', '學生姓名', '家長姓名', '聯絡電話', '學校 / 年級', '居住地區', '角色'].map(col => (
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
                {users.map((u, idx) => {
                  const badge = ROLE_BADGE[u.role] ?? { label: u.role, bg: 'rgba(0,0,0,0.06)', color: '#6E6E73' }
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors duration-100 hover:bg-black/[0.018]"
                      style={{ borderBottom: idx < users.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
                    >
                      {/* 註冊時間 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#AEAEB2' }}>
                        {formatDate(u.created_at)}
                      </td>

                      {/* 學生姓名 */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium" style={{ color: '#1D1D1F' }}>
                        {u.student_name ?? <span style={{ color: '#C7C7CC' }}>—</span>}
                      </td>

                      {/* 家長姓名 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#3D3D3F' }}>
                        {u.parent_name ?? <span style={{ color: '#C7C7CC' }}>—</span>}
                      </td>

                      {/* 聯絡電話 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#3D3D3F' }}>
                        {u.phone ?? <span style={{ color: '#C7C7CC' }}>—</span>}
                      </td>

                      {/* 學校 / 年級 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#3D3D3F' }}>
                        {u.school || u.grade
                          ? [u.school, u.grade].filter(Boolean).join(' · ')
                          : <span style={{ color: '#C7C7CC' }}>—</span>
                        }
                      </td>

                      {/* 居住地區 */}
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#3D3D3F' }}>
                        {u.city || u.district
                          ? [u.city, u.district].filter(Boolean).join(' ')
                          : <span style={{ color: '#C7C7CC' }}>—</span>
                        }
                      </td>

                      {/* 角色 Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-block text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 底部筆數統計 ── */}
      {!isLoading && !error && users.length > 0 && (
        <p className="mt-4 text-xs text-right" style={{ color: '#AEAEB2' }}>
          共 {users.length} 筆資料
        </p>
      )}
    </div>
  )
}
