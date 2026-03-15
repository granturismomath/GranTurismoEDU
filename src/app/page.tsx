import Link from 'next/link'

// ── 功能特色資料 ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: '頂級師資陣容',
    desc: '精選業界頂尖導師，每一堂課都是濃縮的實戰精華。',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    title: '無限回放學習',
    desc: '課程影片永久存取，隨時隨地以自己的節奏深度學習。',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: '專屬學員社群',
    desc: '加入志同道合的高手圈，互相激勵，共同突破極限。',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F5F5F7' }}>

      {/* ════════════════════════════════════
          導覽列 Navbar
      ════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          backgroundColor: 'rgba(245,245,247,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* 左側：品牌名稱 */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#6D97B6' }}
          >
            {/* 閃電 icon — 速度感 */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: '#1D1D1F' }}>
            超跑教育平台
          </span>
        </div>

        {/* 右側：登入按鈕 */}
        <Link
          href="/login"
          className="
            flex items-center gap-1.5 px-5 py-2 rounded-2xl text-sm font-semibold text-white
            transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
            active:translate-y-0
          "
          style={{ backgroundColor: '#6D97B6' }}
        >
          登入 / 註冊
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </nav>

      {/* ════════════════════════════════════
          Hero Section
      ════════════════════════════════════ */}
      <section
        className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ paddingTop: '80px' }}
      >
        {/* 背景光暈裝飾 */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(109,151,182,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* 徽章 */}
        <div
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            backgroundColor: 'rgba(109,151,182,0.10)',
            color: '#6D97B6',
            border: '1px solid rgba(109,151,182,0.20)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: '#6D97B6' }}
          />
          全台頂尖賽車手線上授課平台
        </div>

        {/* 主標題 */}
        <h1
          className="relative text-6xl md:text-7xl font-bold tracking-tight leading-none mb-8 max-w-4xl"
          style={{ color: '#1D1D1F' }}
        >
          啟動您的
          <br />
          <span
            style={{
              backgroundImage: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 50%, #8BB8D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            極速成長
          </span>
          引擎
        </h1>

        {/* 副標題 */}
        <p
          className="relative text-xl leading-relaxed max-w-2xl mb-12"
          style={{ color: '#6E6E73' }}
        >
          專為頂尖學員打造的線上學習平台。
          <br className="hidden md:block" />
          打破時間與空間的限制，讓知識為你加速。
        </p>

        {/* CTA 按鈕區 */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          {/* 主按鈕 */}
          <Link
            href="/login"
            className="
              flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white
              transition-all duration-200
              hover:-translate-y-1 hover:brightness-105
              active:translate-y-0 active:brightness-95
            "
            style={{
              backgroundColor: '#6D97B6',
              boxShadow: '0 8px 32px rgba(109,151,182,0.35), 0 2px 8px rgba(109,151,182,0.20)',
            }}
          >
            開始探索課程
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>

          {/* 次要按鈕 */}
          <Link
            href="#features"
            className="
              flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
              border transition-all duration-200
              hover:bg-[#6D97B6]/[0.06] hover:-translate-y-0.5
              active:translate-y-0
            "
            style={{
              color: '#6D97B6',
              borderColor: 'rgba(109,151,182,0.40)',
              backgroundColor: 'transparent',
            }}
          >
            了解更多
          </Link>
        </div>

        {/* 底部裝飾數字 */}
        <div className="relative flex items-center gap-12 mt-20 pt-10 border-t border-black/[0.06]">
          {[
            { num: '500+', label: '精選課程' },
            { num: '10,000+', label: '學員社群' },
            { num: '98%', label: '好評推薦' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
                {num}
              </p>
              <p className="text-xs mt-1" style={{ color: '#AEAEB2' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════
          Features Section
      ════════════════════════════════════ */}
      <section id="features" className="px-6 py-28" style={{ backgroundColor: 'rgba(0,0,0,0.018)' }}>
        <div className="max-w-5xl mx-auto">

          {/* 標題 */}
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: '#6D97B6' }}>
              為什麼選擇我們
            </p>
            <h2 className="text-4xl font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
              專為贏家設計的學習體驗
            </h2>
          </div>

          {/* 三欄 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="
                  bg-white rounded-3xl p-8
                  shadow-sm border border-black/[0.04]
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                "
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'rgba(109,151,182,0.10)', color: '#6D97B6' }}
                >
                  {f.icon}
                </div>
                {/* 標題 */}
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>
                  {f.title}
                </h3>
                {/* 描述 */}
                <p className="text-sm leading-relaxed" style={{ color: '#6E6E73' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          底部 CTA Banner
      ════════════════════════════════════ */}
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
              inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
              bg-white transition-all duration-200
              hover:-translate-y-1 hover:shadow-xl
              active:translate-y-0
            "
            style={{ color: '#4A7FA5' }}
          >
            免費開始使用
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════
          Footer
      ════════════════════════════════════ */}
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
