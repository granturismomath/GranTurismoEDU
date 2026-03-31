'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

// ── Icons ──
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const IconMonitor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

// ── 主題預覽縮圖 ──
function MiniPreview({ themeValue }: { themeValue: string }) {
  const isDark   = themeValue === 'dark'
  const isSystem = themeValue === 'system'
  return (
    <div className="w-full h-[72px] rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)' }}>
      {isSystem ? (
        <div className="h-full flex">
          <div className="flex-1 flex flex-col justify-end px-2 pb-2 gap-1"
            style={{ backgroundColor: '#F5F5F7' }}>
            <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: '#D1D1D6' }} />
            <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: '#D1D1D6' }} />
          </div>
          <div className="w-px" style={{ backgroundColor: 'rgba(109,151,182,0.3)' }} />
          <div className="flex-1 flex flex-col justify-end px-2 pb-2 gap-1"
            style={{ backgroundColor: '#131C25' }}>
            <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: '#2A3C50' }} />
            <div className="h-1.5 rounded-full w-1/2" style={{ backgroundColor: '#2A3C50' }} />
          </div>
        </div>
      ) : (
        <div className="h-full flex" style={{ backgroundColor: isDark ? '#131C25' : '#F5F5F7' }}>
          <div className="w-7 h-full flex flex-col items-center pt-2.5 gap-1.5"
            style={{ backgroundColor: isDark ? '#172030' : '#ffffff' }}>
            {[0,1,2].map(i => (
              <div key={i} className="w-4 h-1.5 rounded-full"
                style={{ backgroundColor: isDark ? '#2A3C50' : '#E5E5EA' }} />
            ))}
          </div>
          <div className="flex-1 p-2 flex flex-col gap-1.5">
            <div className="flex-1 rounded-xl"
              style={{ backgroundColor: isDark ? '#1C2A38' : '#ffffff' }} />
            <div className="h-2 rounded-full w-2/3"
              style={{ backgroundColor: isDark ? '#7FAED2' : '#6D97B6', opacity: 0.5 }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主題選項 ──
const THEMES = [
  { value: 'light',  label: '日間模式', desc: '明亮賽道', icon: <IconSun /> },
  { value: 'dark',   label: '午夜賽道', desc: '品牌藍艙', icon: <IconMoon /> },
  { value: 'system', label: '跟隨系統', desc: '自動切換', icon: <IconMonitor /> },
]

function ThemeBtn({ value, label, desc, icon, selected, onSelect }: {
  value: string; label: string; desc: string; icon: React.ReactNode
  selected: boolean; onSelect: () => void
}) {
  return (
    <button onClick={onSelect}
      className="relative flex-1 min-w-[120px] flex flex-col gap-3 p-5 rounded-3xl text-left transition-all duration-300"
      style={{
        backgroundColor: selected ? 'var(--nav-active-bg)' : 'var(--background)',
        border: selected ? '2px solid var(--brand)' : '2px solid var(--border-subtle)',
        boxShadow: selected ? '0 0 0 4px color-mix(in srgb, var(--brand) 12%, transparent)' : 'none',
      }}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--brand)' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <MiniPreview themeValue={value} />
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300"
          style={{
            backgroundColor: selected ? 'color-mix(in srgb, var(--brand) 18%, transparent)' : 'var(--border-subtle)',
            color: selected ? 'var(--brand)' : 'var(--text-secondary)',
          }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold transition-colors duration-300"
            style={{ color: selected ? 'var(--brand)' : 'var(--text-primary)' }}>{label}</p>
          <p className="text-[11px] transition-colors duration-300"
            style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
        </div>
      </div>
    </button>
  )
}

// ── Section Card 共用外殼 ──
function SectionCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl p-8 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
      }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
        </div>
      </div>
      <div className="mb-6" style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
      {children}
    </section>
  )
}

// ── Toast ──
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  const ok = type === 'success'
  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{
        backgroundColor: ok ? 'var(--card-bg)' : '#2A1C1C',
        border: `1px solid ${ok ? 'var(--border-subtle)' : '#4A2020'}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: ok ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)' }}>
        {ok ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        )}
      </div>
      <p className="text-sm font-medium" style={{ color: ok ? 'var(--text-primary)' : '#FFB3B0' }}>{message}</p>
    </div>
  )
}

// ── 主頁面 ──
export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Password
  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading]           = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null)
  const [userName, setUserName]     = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    // 載入目前的頭像和名字
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', data.user.id)
        .single()
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      if (profile?.name) setUserName(profile.name)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 更改密碼 ──
  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setToast({ message: '密碼長度至少 6 個字元', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: '兩次密碼輸入不一致', type: 'error' })
      return
    }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: '密碼更新成功！', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // ── 上傳頭像 ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 限制 2MB
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: '檔案大小不可超過 2MB', type: 'error' })
      return
    }

    setAvatarLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAvatarLoading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${ext}`

    // 上傳至 Supabase Storage (avatars bucket)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setAvatarLoading(false)
      setToast({ message: '頭像上傳失敗：' + uploadError.message, type: 'error' })
      return
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl + '?t=' + Date.now()

    // 更新 users 表
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    setAvatarLoading(false)
    if (updateError) {
      setToast({ message: '頭像更新失敗', type: 'error' })
    } else {
      setAvatarUrl(publicUrl)
      setToast({ message: '頭像更新成功！', type: 'success' })
    }
  }

  const initials = (userName || '?').slice(0, 1).toUpperCase()

  return (
    <div className="p-8 max-w-3xl space-y-8">

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* 頁首 */}
      <div className="mb-2">
        <span className="inline-block text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-4"
          style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}>
          Settings
        </span>
        <h1 className="text-3xl font-bold tracking-tight transition-colors duration-300"
          style={{ color: 'var(--text-primary)' }}>
          系統設定
        </h1>
        <p className="mt-2 text-base transition-colors duration-300"
          style={{ color: 'var(--text-secondary)' }}>
          調整你的駕駛艙介面環境
        </p>
      </div>

      {/* ══════════════════════════════════════
          1. 頭像設定
      ══════════════════════════════════════ */}
      <SectionCard
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
        title="頭像設定"
        subtitle="上傳你的專屬車手照片"
      >
        <div className="flex items-center gap-6">
          {/* 頭像預覽 */}
          <div className="relative group">
            {avatarUrl ? (
              <div
                className="w-20 h-20 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}
              >
                {initials}
              </div>
            )}
            {/* hover overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              style={{
                backgroundColor: 'var(--brand)',
                color: 'white',
              }}
            >
              {avatarLoading ? '上傳中...' : '選擇照片'}
            </button>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              支援 JPG、PNG，檔案大小上限 2MB
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════
          2. 更改密碼
      ══════════════════════════════════════ */}
      <SectionCard
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        }
        title="更改密碼"
        subtitle="定期更換密碼以確保帳號安全"
      >
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}>
              新密碼
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="至少 6 個字元"
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 focus:ring-2"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}>
              確認新密碼
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再輸入一次新密碼"
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 focus:ring-2"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={pwLoading || !newPassword}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
            style={{
              backgroundColor: 'var(--brand)',
              color: 'white',
            }}
          >
            {pwLoading ? '更新中...' : '更新密碼'}
          </button>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════
          3. 外觀設定
      ══════════════════════════════════════ */}
      <SectionCard
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        }
        title="外觀設定"
        subtitle="選擇最適合你駕駛風格的介面主題"
      >
        {mounted ? (
          <>
            <div className="flex gap-4 flex-wrap">
              {THEMES.map(t => (
                <ThemeBtn key={t.value} {...t}
                  selected={theme === t.value}
                  onSelect={() => setTheme(t.value)} />
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: 'var(--nav-hover-bg)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--brand)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                目前：
                <span className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>
                  {resolvedTheme === 'dark' ? '🌙 午夜賽道' : '☀️ 日間模式'}
                </span>
                {theme === 'system' && <span className="ml-1" style={{ color: 'var(--text-tertiary)' }}>· 由系統決定</span>}
              </p>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 h-44 rounded-3xl animate-pulse"
                style={{ backgroundColor: 'var(--border-subtle)' }} />
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
