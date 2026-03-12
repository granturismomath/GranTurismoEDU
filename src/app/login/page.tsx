'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('帳號或密碼錯誤，請再試一次。')
        return
      }
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError('Google 登入失敗，請稍後再試。')
      setIsLoading(false)
    }
    // OAuth 會跳轉離開頁面，無需手動 setIsLoading(false)
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#F5F5F7' }}
    >
      {/* ── 背景：格點 + 藍色幾何三角形 ── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* 極淡格點網格 */}
            <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#1D1D1F" fillOpacity="0.05" />
            </pattern>
            {/* 灰藍品牌色幾何三角形（8% 透明度） */}
            <pattern id="triangles" width="120" height="120" patternUnits="userSpaceOnUse">
              <polygon
                points="60,8 112,112 8,112"
                fill="none"
                stroke="#6D97B6"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              <polygon
                points="60,30 95,100 25,100"
                fill="none"
                stroke="#6D97B6"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          <rect width="100%" height="100%" fill="url(#triangles)" />
        </svg>
      </div>

      {/* ── 四角方格旗裝飾（CSS background，5% 透明度）── */}
      {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} w-40 h-20 pointer-events-none select-none`}
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(29,29,31,0.05) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(29,29,31,0.05) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(29,29,31,0.05) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(29,29,31,0.05) 75%)
            `,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        />
      ))}

      {/* ── 登入卡片 ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-sm border border-white/60 px-10 py-10">

          {/* Logo & 標題 */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{ backgroundColor: '#6D97B6' }}
            >
              {/* 方格旗 icon */}
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect x="3"  y="5"  width="6" height="6" rx="0.5" fill="white" fillOpacity="0.95" />
                <rect x="9"  y="5"  width="6" height="6" rx="0.5" fill="white" fillOpacity="0.35" />
                <rect x="15" y="5"  width="6" height="6" rx="0.5" fill="white" fillOpacity="0.95" />
                <rect x="21" y="5"  width="6" height="6" rx="0.5" fill="white" fillOpacity="0.35" />
                <rect x="3"  y="11" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.35" />
                <rect x="9"  y="11" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.95" />
                <rect x="15" y="11" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.35" />
                <rect x="21" y="11" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.95" />
                <rect x="3"  y="19" width="24" height="2.5" rx="1.25" fill="white" fillOpacity="0.65" />
              </svg>
            </div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: '#1D1D1F' }}
            >
              超跑教育
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#6E6E73' }}>
              Supercar Education Platform
            </p>
          </div>

          {/* 表單 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: '#6E6E73' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="
                  w-full px-5 py-3.5 rounded-3xl text-sm
                  border border-black/[0.08] bg-white/60
                  outline-none transition-all duration-200
                  focus:border-[#6D97B6] focus:ring-2 focus:ring-[#6D97B6]/20
                  placeholder:text-[#C7C7CC]
                "
                style={{ color: '#1D1D1F' }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: '#6E6E73' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="
                  w-full px-5 py-3.5 rounded-3xl text-sm
                  border border-black/[0.08] bg-white/60
                  outline-none transition-all duration-200
                  focus:border-[#6D97B6] focus:ring-2 focus:ring-[#6D97B6]/20
                  placeholder:text-[#C7C7CC]
                "
                style={{ color: '#1D1D1F' }}
              />
            </div>

            {/* 忘記密碼 */}
            <div className="text-right">
              <button
                type="button"
                className="text-xs transition-opacity duration-150 hover:opacity-60"
                style={{ color: '#6D97B6' }}
              >
                忘記密碼？
              </button>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <p
                className="text-xs text-center px-4 py-2.5 rounded-2xl"
                style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}
              >
                {error}
              </p>
            )}

            {/* 主要登入按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 rounded-3xl text-sm font-semibold text-white
                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
                active:translate-y-0 active:shadow-sm active:brightness-95
                disabled:opacity-60 disabled:cursor-not-allowed
                disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100
              "
              style={{ backgroundColor: '#6D97B6' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  引擎啟動中...
                </span>
              ) : (
                '登入系統'
              )}
            </button>
          </form>

          {/* 分隔線 */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
            <span className="text-xs" style={{ color: '#AEAEB2' }}>或</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
          </div>

          {/* Google 登入按鈕 */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="
              w-full flex items-center justify-center gap-3 py-3.5 rounded-3xl
              border border-black/[0.08] bg-white/60 text-sm font-medium
              transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-sm hover:bg-white/90
              active:translate-y-0 active:shadow-none
              disabled:opacity-60 disabled:cursor-not-allowed
              disabled:hover:translate-y-0 disabled:hover:shadow-none
            "
            style={{ color: '#1D1D1F' }}
          >
            {/* Google 官方 SVG icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            使用 Google 帳號登入
          </button>

          {/* 底部法律說明 */}
          <p className="text-center text-xs mt-7" style={{ color: '#AEAEB2' }}>
            登入即代表您同意我們的服務條款與隱私政策
          </p>
        </div>
      </div>
    </main>
  )
}
