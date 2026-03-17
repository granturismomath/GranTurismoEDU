'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ── 回傳型別 ─────────────────────────────────────────────────
export type ChapterActionResult = {
  success: boolean
  error?:  string
}

// ─────────────────────────────────────────────────────────────
// createChapter — 新增章節 Server Action
//
// 安全層級：
//   L1  getUser() 驗證 Auth 身份（來自 Supabase，不可偽造）
//   L2  DB 二次確認呼叫者 role 為 owner 或 admin
//   L3  Server-side 必填欄位驗證
//   L4  自動計算 order_index（現有最大值 + 1）
//   L5  INSERT 進 chapters 資料表
//   L6  revalidatePath 清除該課程頁快取
// ─────────────────────────────────────────────────────────────
export async function createChapter(
  formData: FormData,
  courseId: string,
): Promise<ChapterActionResult> {
  const supabase = await createClient()

  // ── L1：驗證 Auth 身份 ──
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: '身份驗證失敗，請重新登入。' }
  }

  // ── L2：資料庫確認呼叫者為 owner 或 admin ──
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: '無法讀取帳號資料，請重新登入。' }
  }
  if (!['owner', 'admin'].includes(profile.role)) {
    return { success: false, error: '權限不足：只有車隊老闆或管理員可以管理章節。' }
  }

  // ── L3：讀取並驗證必填欄位 ──
  const title       = (formData.get('title')       as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() ?? ''
  const videoUrl    = (formData.get('video_url')   as string | null)?.trim() ?? ''
  const isFreeRaw   = formData.get('is_free')

  if (!title) {
    return { success: false, error: '章節名稱為必填欄位。' }
  }
  if (!courseId) {
    return { success: false, error: '無效的課程 ID。' }
  }

  // ── L4：自動計算 order_index（抓目前最大值 + 1）──
  const { data: maxRow } = await supabase
    .from('chapters')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxRow?.order_index ?? 0) + 1

  // ── L5：INSERT 進 chapters 資料表 ──
  const { error: insertError } = await supabase
    .from('chapters')
    .insert({
      course_id:   courseId,
      title,
      description: description || null,
      video_url:   videoUrl    || null,
      is_free:     isFreeRaw === 'on' || isFreeRaw === 'true',
      order_index: nextOrder,
    })

  if (insertError) {
    console.error('[createChapter] insert error:', insertError.message)
    return { success: false, error: `章節建立失敗：${insertError.message}` }
  }

  // ── L6：清除課程維修站頁快取 ──
  revalidatePath(`/dashboard/admin/courses/${courseId}`)

  return { success: true }
}
