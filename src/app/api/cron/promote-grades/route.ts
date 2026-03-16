import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ─────────────────────────────────────────────────────────────
// GET /api/cron/promote-grades
//
// 由 Vercel Cron Job 每年 7 月 1 日 00:00 UTC 呼叫。
// 需帶 Authorization: Bearer <CRON_SECRET> 才能執行。
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // ── 1. 驗證 CRON_SECRET ──
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // ── 2. 呼叫 Postgres 函式執行晉升邏輯 ──
    const { data, error } = await supabase.rpc('promote_student_grades')

    if (error) {
      console.error('[promote-grades] rpc error:', error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, result: data })

  } catch (err: unknown) {
    console.error('[promote-grades] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
