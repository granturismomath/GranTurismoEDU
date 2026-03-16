import Link from 'next/link'

// ── 功能特色資料 ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: '頂級師資陣容',
    desc: '精選業界頂尖導師，每一堂課都是濃縮的實戰精華。',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: '無限回放學習',
    desc: '課程影片永久存取，隨時隨地以自己的節奏深度學習。',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: '專屬學員社群',
    desc: '加入志同道合的高手圈，互相激勵，共同突破極限。',
  },
]

// ── 數字統計資料 ────────────────────────────────────────────────────────────
const STATS = [
  { num: '500+',    label: '精選課程' },
  { num: '10,000+', label: '學員社群' },
  { num: '98%',     label: '好評推薦' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans">

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
          · min-h-[88vh] 完整佔滿視窗，極致置中
          · 上方 pt-20 預留全局 Navbar 高度
      ══════════════════════════════════════════════════════════════ */}
      <section className="
        relative min-h-[88vh] pt-20
        flex flex-col items-center justify-center
        text-center px-4 overflow-hidden
      ">

        {/* ── 背景環境光暈（藍色暈光，速度感氛圍） ── */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[720px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(109,151,182,0.13) 0%, transparent 68%)',
            filter: 'blur(48px)',
          }}
        />

        {/* ── v1.2.0 上線 Badge ── */}
        <div className="
          relative inline-flex items-center gap-2
          px-4 py-1.5 mb-10 rounded-full
          text-xs font-medium tracking-wide
          border border-[#6D97B6]/25
          bg-[#6D97B6]/[0.08] text-[#6D97B6]
          animate-pulse-slow
        ">
          {/* 呼吸燈點 */}
          <span className="relative flex h-1.5 w-1.5">
            <span className="
              absolute inline-flex h-full w-full rounded-full
              bg-[#6D97B6] opacity-75 animate-ping
            " />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6D97B6]" />
          </span>
          v1.2.0&nbsp;·&nbsp;系統全面上線
        </div>

        {/* ── 震撼大標題 ── */}
        <h1 className="
          relative z-10
          text-5xl md:text-7xl
          font-extrabold tracking-tight leading-[1.08]
          mb-7 max-w-4xl
          bg-clip-text text-transparent
          bg-gradient-to-r
          from-[#1D1D1F] via-[#6D97B6] to-[#1D1D1F]
        ">
          極速驅動<br className="hidden sm:block" />你的學習引擎
        </h1>

        {/* ── 副標題 ── */}
        <p className="
          relative z-10
          text-lg md:text-xl leading-relaxed
          max-w-xl mb-12
          text-[#6E6E73]
        ">
          超跑教育，重新定義學習的<span className="text-[#4A7FA5] font-medium">推背感</span>。<br className="hidden md:block" />
          打破時間與空間的限制，讓知識為你加速。
        </p>

        {/* ── CTA 按鈕區 ── */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-20">

          {/* 主按鈕：探索課程 */}
          <Link
            href="/login"
            className="
              flex items-center gap-2
              px-8 py-4
              rounded-3xl
              text-base font-semibold text-white
              bg-[#6D97B6]
              hover:-translate-y-1
              hover:shadow-2xl hover:shadow-[#6D97B6]/30
              transition-all duration-300 ease-out
              active:translate-y-0 active:shadow-md
            "
          >
            探索課程
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* 次按鈕：了解更多 */}
          <Link
            href="#features"
            className="
              flex items-center gap-2
              px-8 py-4
              rounded-3xl
              text-base font-semibold
              text-[#1D1D1F]
              border border-[#1D1D1F]/20
              bg-transparent
              hover:bg-[#F5F5F7] hover:-translate-y-0.5 hover:border-[#1D1D1F]/40
              transition-all duration-300 ease-out
              active:translate-y-0
            "
          >
            了解更多
          </Link>
        </div>

        {/* ── 數字統計欄 ── */}
        <div className="
          relative z-10
          flex items-center gap-10 sm:gap-16
          pt-10
          border-t border-black/[0.06]
        ">
          {STATS.map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-[#1D1D1F]">{num}</p>
              <p className="text-xs mt-1 text-[#AEAEB2]">{label}</p>
            </div>
          ))}
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="px-6 py-28" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>
        <div className="max-w-5xl mx-auto">

          {/* 標題 */}
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-3 text-[#6D97B6]">
              為什麼選擇我們
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-[#1D1D1F]">
              專為贏家設計的學習體驗
            </h2>
          </div>

          {/* 三欄卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="
                  bg-white rounded-3xl p-8
                  shadow-sm border border-black/[0.04]
                  hover:shadow-md hover:-translate-y-0.5
                  transition-all duration-200
                "
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'rgba(109,151,182,0.10)', color: '#6D97B6' }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#1D1D1F]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#6E6E73]">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          底部 CTA Banner
      ══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-28">
        <div
          className="max-w-4xl mx-auto rounded-3xl text-center px-8 py-20"
          style={{
            background: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 100%)',
            boxShadow: '0 20px 60px rgba(109,151,182,0.30)',
          }}
        >
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
            準備好了嗎？
          </h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
            立即加入數千位頂尖學員，展開您的極速成長之旅。
          </p>
          <Link
            href="/login"
            className="
              inline-flex items-center gap-2
              px-8 py-4 rounded-3xl
              text-base font-semibold bg-white
              hover:-translate-y-1 hover:shadow-xl
              transition-all duration-300 ease-out
              active:translate-y-0
            "
            style={{ color: '#4A7FA5' }}
          >
            免費開始使用
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          Footer
      ══════════════════════════════════════════════════════════════ */}
      <footer
        className="px-8 py-8 flex items-center justify-between border-t border-black/[0.06]"
        style={{ color: '#AEAEB2' }}
      >
        <span className="text-sm">© 2025 超跑教育平台. All rights reserved.</span>
        <Link
          href="/login"
          className="text-sm transition-opacity hover:opacity-60"
          style={{ color: '#6D97B6' }}
        >
          登入系統
        </Link>
      </footer>

    </div>
  )
}
