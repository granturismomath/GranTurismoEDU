'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 全局導覽列 — v1.2.x 視覺重塑
 * ─────────────────────────────────────────────────────
 * · 磨砂玻璃底：bg-[#F5F5F7]/70 backdrop-blur-md
 * · Logo 絕對置中，不受左右元素長度影響
 * · Logo Hover → #6D97B6 品牌藍漸層文字
 * · 右側按鈕：rounded-3xl + 加速感懸停動畫
 * · /dashboard/* 路由下自動隱藏，讓 Sidebar 獨立主宰版面
 */
export default function Navbar() {
  const pathname = usePathname()

  // 以下路由有自己的 UI，不需要全局 Navbar
  const HIDDEN_ON = ['/dashboard', '/onboarding', '/login']
  if (HIDDEN_ON.some(p => pathname?.startsWith(p))) return null

  return (
    <nav
      className="
        fixed top-0 left-0 right-0 z-50
        h-20
        backdrop-blur-md
        transition-colors duration-300
      "
      style={{
        backgroundColor: 'color-mix(in srgb, var(--background) 70%, transparent)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="relative flex items-center h-full px-8 max-w-7xl mx-auto">

        {/* ── 左側：預留空間（未來可放導覽連結） ── */}
        <div className="flex-1" />

        {/* ── 絕對置中 Logo ─────────────────────────────────
            使用 absolute + -translate 確保「真正置中」
            完全不受左右欄位長度干擾
        ─────────────────────────────────────────────── */}
        <Link
          href="/"
          className="
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            group flex items-center gap-2.5
          "
        >
          {/* 品牌 Icon — 閃電·速度感 */}
          <div
            className="
              w-8 h-8 rounded-xl shrink-0
              flex items-center justify-center
              bg-[#6D97B6]
              transition-transform duration-300
              group-hover:scale-110
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>

          {/* 品牌文字 — Hover 時過渡到品牌藍漸層 */}
          <span
            className="
              text-base font-semibold tracking-tight whitespace-nowrap
              bg-clip-text
              transition-all duration-300
              group-hover:text-transparent
              group-hover:bg-gradient-to-r
              group-hover:from-[#6D97B6]
              group-hover:to-[#4A7FA5]
            "
            style={{ color: 'var(--text-primary)' }}
          >
            超跑教育&nbsp;GranTurismoEDU
          </span>
        </Link>

        {/* ── 右側：CTA 按鈕 ────────────────────────────────
            rounded-3xl 大圓角 + 加速感懸停動畫
        ─────────────────────────────────────────────── */}
        <div className="flex-1 flex justify-end">
          <Link
            href="/login"
            className="
              flex items-center gap-1.5
              px-5 py-2.5
              rounded-3xl
              text-sm font-semibold text-white
              bg-[#6D97B6]
              hover:-translate-y-0.5 hover:shadow-lg
              transition-all duration-300
              active:translate-y-0 active:shadow-md
            "
          >
            登入&nbsp;/&nbsp;進入車庫
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

      </div>
    </nav>
  )
}
