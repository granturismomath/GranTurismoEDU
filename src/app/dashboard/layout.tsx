'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

// ── 側邊欄選單定義 ──────────────────────────────────────────
type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

// ── SVG Icons ────────────────────────────────────────────────
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconCompass = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
)

const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const IconActivity = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
// ────────────────────────────────────────────────────────────

// 【帳號資料】置頂
const ACCOUNT_NAV: NavItem = {
  label: '帳號資料',
  href: '/dashboard/account',
  icon: <IconUser />,
}

// 【系統設定】固定底部
const SETTINGS_NAV: NavItem = {
  label: '系統設定',
  href: '/dashboard/settings',
  icon: <IconSettings />,
}

// 【車隊總部】僅 admin / owner 可見
const ADMIN_CONSOLE_NAV: NavItem = {
  label: '車隊總部',
  href:  '/dashboard/admin',
  icon:  <IconShield />,
}

const OWNER_NAV: NavItem[] = [
  { label: '車手名冊', href: '/dashboard/admin/users', icon: <IconUsers /> },
  { label: '課程上架', href: '/dashboard/courses',     icon: <IconUpload /> },
  ADMIN_CONSOLE_NAV,
]

const ADMIN_NAV: NavItem[] = [
  { label: '車手名冊', href: '/dashboard/admin/users', icon: <IconUsers /> },
  ADMIN_CONSOLE_NAV,
]

const STUDENT_NAV: NavItem[] = [
  { label: '探索課程', href: '/dashboard/explore',    icon: <IconCompass /> },
  { label: '我的課程', href: '/dashboard/my-courses', icon: <IconBook /> },
]

const PARENT_NAV: NavItem[] = [
  { label: '學習進度', href: '/dashboard/progress', icon: <IconActivity /> },
]

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  owner:   OWNER_NAV,
  admin:   ADMIN_NAV,
  user:    STUDENT_NAV,   // 一般車手：探索課程 + 我的課程，不含車隊總部
  student: STUDENT_NAV,
  parent:  PARENT_NAV,
}

// ────────────────────────────────────────────────────────────

const supabase = createClient()

// ── NavLink 子組件（解耦 hover 邏輯）────────────────────────
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
      style={{
        backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'var(--nav-hover-bg)'
          el.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'transparent'
          el.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <span className="shrink-0 transition-colors duration-200">{item.icon}</span>
      {item.label}
    </Link>
  )
}

// ────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [role, setRole]           = useState<string>('student')
  const [userName, setUserName]   = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [ready, setReady]         = useState(false)
  const [mounted, setMounted]     = useState(false)   // 防止 dark mode logo hydration mismatch

  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserEmail(data.user.email ?? '')

      const { data: profile } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', data.user.id)
        .single()

      if (profile?.role) setRole(profile.role)
      if (profile?.name) setUserName(profile.name)
      setReady(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 帳號設定置頂，再接 role 對應選單
  const navItems: NavItem[] = [
    ACCOUNT_NAV,
    ...(NAV_BY_ROLE[role] ?? []),
  ]

  // 主題感知 Logo 路徑
  // logo.png      → 藍底彩色版（亮色模式）
  // logo-dark.png → 透明/深色版（暗色模式）
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo.png'

  // ── 骨架 ──
  if (!ready) {
    return (
      <div className="flex min-h-screen transition-colors duration-300"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <aside
          className="w-64 shrink-0"
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            boxShadow: '1px 0 0 0 var(--sidebar-border)',
          }}
        />
        <main className="flex-1" />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* ── 左側 Sidebar ── */}
      <aside
        className="w-64 shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto transition-colors duration-300"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          boxShadow: '1px 0 0 0 var(--sidebar-border)',
        }}
      >
        {/* ── Logo 區：大器置中 ── */}
        <div
          className="flex w-full justify-center items-center pt-7 pb-6"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <Link href="/dashboard/explore" className="block w-[85%]">
            <Image
              src={logoSrc}
              alt="超跑教育 Logo"
              width={320}
              height={96}
              className="w-full h-auto object-contain transition-opacity duration-300"
              priority
            />
          </Link>
        </div>

        {/* ── 使用者姓名膠囊 ── */}
        <div className="flex w-full justify-center py-4">
          <span
            className="inline-block text-[11px] font-semibold tracking-wide px-3.5 py-1.5 rounded-full
              max-w-[80%] truncate text-center transition-colors duration-300"
            style={{
              backgroundColor: 'var(--nav-active-bg)',
              color: 'var(--brand)',
            }}
          >
            {userName || (userEmail ? userEmail.split('@')[0] : '未設定名稱')}
          </span>
        </div>

        {/* ── 導覽選單（帳號資料置頂） ── */}
        <nav className="flex-1 px-3 space-y-0.5 pb-2">
          {navItems.map(item => {
            // 精確匹配：以「最長吻合路徑」為優先，避免父路徑與子路徑同時高亮
            const matches = (href: string) =>
              pathname === href || pathname.startsWith(href + '/')
            const isActive =
              matches(item.href) &&
              !navItems.some(
                other =>
                  other.href !== item.href &&
                  other.href.length > item.href.length &&
                  matches(other.href),
              )
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive}
              />
            )
          })}
        </nav>

        {/* ── 底部分隔線 ── */}
        <div
          className="mx-4 transition-colors duration-300"
          style={{ height: '1px', backgroundColor: 'var(--sidebar-border)' }}
        />

        {/* ── 系統設定（固定底部） ── */}
        <div className="px-3 pt-2">
          <NavLink
            item={SETTINGS_NAV}
            isActive={pathname.startsWith(SETTINGS_NAV.href)}
          />
        </div>

        {/* ── 登出按鈕 ── */}
        <div className="px-3 pt-4 pb-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = 'rgba(255,59,48,0.08)'
              el.style.color = '#FF3B30'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.backgroundColor = 'transparent'
              el.style.color = 'var(--text-tertiary)'
            }}
          >
            <IconLogOut />
            登出系統
          </button>
        </div>

        {/* ── 版權銘牌 ── */}
        <div className="px-4 pb-5 text-center leading-tight transition-colors duration-300">
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            GranTurismoEDU v1.2.0
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            PythaGodzillaCorp. © 2026
          </p>
        </div>

      </aside>

      {/* ── 右側主內容區 ── */}
      <main
        className="flex-1 min-w-0 overflow-y-auto transition-colors duration-300"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>

    </div>
  )
}
