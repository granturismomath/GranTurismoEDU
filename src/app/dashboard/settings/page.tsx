'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

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

// ── 主題選項按鈕 ──
const THEMES = [
  { value: 'light',  label: '日間模式',  desc: '明亮賽道',    icon: <IconSun /> },
  { value: 'dark',   label: '午夜賽道',  desc: '品牌藍艙',    icon: <IconMoon /> },
  { value: 'system', label: '跟隨系統',  desc: '自動切換',    icon: <IconMonitor /> },
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

// ── 主頁面 ──
export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="p-8 max-w-3xl">

      {/* 頁首 */}
      <div className="mb-10">
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

      {/* 外觀設定卡片 */}
      <section className="rounded-3xl p-8 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* 標題列 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>外觀設定</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>選擇最適合你駕駛風格的介面主題</p>
          </div>
        </div>

        <div className="mb-6" style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

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
      </section>

    </div>
  )
}
