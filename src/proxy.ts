import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── 路由分類 ──────────────────────────────────────────────────
// 需要登入才能進入的路由前綴
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/onboarding']

// 已登入後不應再進入的路由
const AUTH_ONLY_ROUTES = ['/login']

// Onboarding 完成後不應再進入的路由
const PRE_ONBOARDING_ROUTES = ['/onboarding', '/login']
// ─────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── Step 1：更新 Session（此行必須最優先執行，禁止移動位置）──
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 工具函式：建立重導向 Response 並轉移現有 Cookie
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    const res = NextResponse.redirect(url)
    // 確保 Supabase Session Cookie 不會在重導向時遺失
    supabaseResponse.cookies.getAll().forEach(cookie => {
      res.cookies.set(cookie.name, cookie.value)
    })
    return res
  }

  // ── Step 2：未登入攔截 ──
  // 未登入者嘗試進入受保護路由 → 強制跳回登入頁
  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return redirectTo('/login')
  }

  // ── Step 3：已登入邏輯 ──
  if (user) {
    // 查詢 onboarding_completed（只查一個欄位，效能最佳化）
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const isOnboardingDone = profile?.onboarding_completed === true

    // 狀況 A：尚未完成 Onboarding
    // → 若當前路徑不是 /onboarding，強制導向 /onboarding（避免停在登入頁或直衝 dashboard）
    if (!isOnboardingDone && !pathname.startsWith('/onboarding')) {
      return redirectTo('/onboarding')
    }

    // 狀況 B：已完成 Onboarding
    // → 若當前路徑是 /login 或 /onboarding，強制導向 /dashboard
    if (isOnboardingDone && PRE_ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
      return redirectTo('/dashboard')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // 略過靜態資源與 Next.js 內部路由，只攔截頁面請求
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
