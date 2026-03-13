'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// ── 側邊欄選單定義 ──────────────────────────────────────────
type NavItem = { label: string; href: string }

const COMMON_NAV: NavItem[] = [
  { label: '總覽儀表板', href: '/dashboard' },
]

const OWNER_NAV: NavItem[] = [
  { label: '學員管理', href: '/dashboard/students' },
  { label: '課程上架', href: '/dashboard/courses' },
]

const ADMIN_NAV: NavItem[] = [
  { label: '學員管理', href: '/dashboard/students' },
]

const STUDENT_NAV: NavItem[] = [
  { label: '我的課程', href: '/dashboard/my-courses' },
]

const PARENT_NAV: NavItem[] = [
  { label: '學習進度', href: '/dashboard/progress' },
]

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  owner:   OWNER_NAV,
  admin:   ADMIN_NAV,
  student: STUDENT_NAV,
  parent:  PARENT_NAV,
}
// ────────────────────────────────────────────────────────────

// 模組層級初始化，避免 useEffect 依賴警告
const supabase = createClient()

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [role, setRole]         = useState<string>('student')
  const [ready, setReady]       = useState(false)   // 防止 role 載入前 UI 閃爍

  // ── 取得使用者 role ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role) setRole(profile.role)
      setReady(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 登出 ──
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 組合目前 role 對應的選單
  const navItems: NavItem[] = [
    ...COMMON_NAV,
    ...(NAV_BY_ROLE[role] ?? []),
  ]

  // role 尚未載入時，回傳最小骨架避免閃爍
  if (!ready) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
        <aside className="w-64 shrink-0 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.06)]" />
        <main className="flex-1" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>

      {/* ── 左側 Sidebar ── */}
      <aside className="
        w-64 shrink-0 flex flex-col
        bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.06)]
        sticky top-0 h-screen overflow-y-auto
      ">
        {/* Logo 區 */}
        <div className="px-6 pt-8 pb-6 border-b border-black/[0.05]">
          <img
            src="/logo.png"
            alt="超跑教育"
            className="w-32 h-auto"
          />
        </div>

        {/* 導覽選單 */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-[#6D97B6]/10 text-[#6D97B6]'
                    : 'text-[#3D3D3F] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                  }
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-150 ${
                  isActive ? 'bg-[#6D97B6]' : 'bg-black/20'
                }`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* role 標籤 */}
        <div className="px-6 pb-3">
          <span
            className="inline-block text-[10px] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#6D97B6' }}
          >
            {role}
          </span>
        </div>

        {/* 登出按鈕 */}
        <div className="px-3 pb-6">
          <button
            onClick={handleSignOut}
            className="
              w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium
              text-[#8E8E93] transition-all duration-150
              hover:bg-red-50 hover:text-red-400
            "
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            登出系統
          </button>
        </div>
      </aside>

      {/* ── 右側主內容區 ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}
