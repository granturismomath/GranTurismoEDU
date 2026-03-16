import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * OAuth Callback Route — GET /auth/callback
 * ─────────────────────────────────────────────────────────────
 * Google (或其他 Provider) 完成授權後會攜帶 `code` 參數重導向到此路由。
 * 流程：
 *   1. 讀取 URL 中的 `code` 參數
 *   2. 呼叫 supabase.auth.exchangeCodeForSession(code)
 *      → 與 Supabase Auth Server 交換，取得真正的 Session Token
 *   3. 將 Session Cookie 附加到 Redirect Response
 *   4. 導向 /dashboard（或 next 參數指定的路由）
 *
 * 為什麼要這個路由？
 * OAuth PKCE Flow 要求必須透過伺服器端交換 code，才能建立有效 Session。
 * 直接把 redirectTo 設為 /dashboard 的話，code 不會被交換，
 * 導致 middleware 拿不到 Session → 把使用者踢回 /login（就是「點兩次才能登入」的根因）。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 支援可選的 `next` 參數，讓特定流程可以指定登入後落地頁
  const next = searchParams.get('next') ?? '/dashboard'

  // ── 沒有 code：異常情況，導回登入頁並附帶錯誤提示 ──
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  // ── 建立將攜帶 Session Cookie 的 Redirect Response ──
  const redirectUrl = new URL(next, origin)
  const response = NextResponse.redirect(redirectUrl)

  // ── 建立 Supabase Server Client，Cookie 直接讀寫 Response ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 從 incoming request 讀取現有 cookie
        getAll() {
          return request.cookies.getAll()
        },
        // 將新 Session Cookie 直接寫入 redirect response
        // 瀏覽器收到此 Response 後會儲存 Cookie，下一個請求即已登入
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── 交換 code → Session ──
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_error', origin)
    )
  }

  // ── 成功：攜帶 Session Cookie 導向目標頁面 ──
  return response
}
