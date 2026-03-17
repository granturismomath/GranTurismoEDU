'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── 允許的科目值（與資料庫 CHECK constraint 對齊）──────────
const VALID_SUBJECTS = ['math', 'chinese', 'english'] as const
type Subject = typeof VALID_SUBJECTS[number]

const VALID_STATUSES = ['draft', 'published'] as const
type Status = typeof VALID_STATUSES[number]

// ── 回傳型別（給前端表單顯示錯誤用）─────────────────────────
export type CreateCourseResult = {
  success: boolean
  error?: string
}

// ─────────────────────────────────────────────────────────────
// createCourse — Server Action
//
// 安全流程：
//   L1  驗證呼叫者身份（getUser，來自 Supabase Auth，不可偽造）
//   L2  資料庫二次確認呼叫者 role = 'owner'（防 JWT 與 DB 不同步）
//   L3  Server-side 必填欄位驗證
//   L4  subject / status 白名單驗證
//   L5  INSERT 進 courses 資料表
//   L6  revalidatePath + redirect
// ─────────────────────────────────────────────────────────────
export async function createCourse(
  formData: FormData,
): Promise<CreateCourseResult> {
  const supabase = await createClient()

  // ── L1：驗證 Auth 身份 ──
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: '身份驗證失敗，請重新登入。' }
  }

  // ── L2：資料庫確認呼叫者必須是 owner ──
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: '無法讀取帳號資料，請重新登入。' }
  }
  if (profile.role !== 'owner') {
    return { success: false, error: '權限不足：只有車隊老闆 (OWNER) 可以新增課程。' }
  }

  // ── L3：讀取並驗證必填欄位 ──
  const title           = (formData.get('title')           as string | null)?.trim() ?? ''
  const description     = (formData.get('description')     as string | null)?.trim() ?? ''
  const subject         = (formData.get('subject')         as string | null)?.trim() ?? ''
  const priceRaw        = (formData.get('price')           as string | null)?.trim() ?? ''
  const status          = (formData.get('status')          as string | null)?.trim() ?? 'draft'
  const coverImageUrl   = (formData.get('cover_image_url') as string | null)?.trim() ?? null

  if (!title) {
    return { success: false, error: '課程名稱為必填欄位。' }
  }

  const price = Number(priceRaw)
  if (!priceRaw || isNaN(price) || price < 0 || !Number.isInteger(price)) {
    return { success: false, error: '課程售價必須為非負整數。' }
  }

  // ── L4：白名單驗證 ──
  if (!VALID_SUBJECTS.includes(subject as Subject)) {
    return {
      success: false,
      error: `科目無效，請選擇：${VALID_SUBJECTS.join(' / ')}。`,
    }
  }
  if (!VALID_STATUSES.includes(status as Status)) {
    return { success: false, error: '發布狀態無效。' }
  }

  // ── L5：寫入 courses 資料表 ──
  const { error: insertError } = await supabase
    .from('courses')
    .insert({
      title,
      description:      description || null,
      subject:          subject as Subject,
      price,
      status:           status as Status,
      cover_image_url:  coverImageUrl || null,
    })

  if (insertError) {
    console.error('[createCourse] insert error:', insertError.message)
    return { success: false, error: `課程建立失敗：${insertError.message}` }
  }

  // ── L6：同時清除兩個路由的快取，再導回列表頁 ──
  revalidatePath('/dashboard/courses')
  revalidatePath('/dashboard/admin/courses')
  redirect('/dashboard/courses')
}
