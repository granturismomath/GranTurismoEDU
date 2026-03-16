'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ── 型別定義 ─────────────────────────────────────────────────
export type OnboardingData = {
  name:         string  // 學生姓名（必填）
  grade:        string  // 年級（必填）
  gender:       string  // 性別（選填）
  birthday:     string  // 出生年月日 YYYY-MM-DD（選填）
  district:     string  // 學區（選填）
  school:       string  // 學校（選填）
  parent_name:  string  // 家長姓名（選填）
  parent_phone: string  // 家長聯絡電話（選填）
}

export type OnboardingResult = {
  success: boolean
  error?:  string
}

// ─────────────────────────────────────────────────────────────
// completeOnboarding — Server Action
//
// 流程：
//   1. 驗證使用者身份
//   2. Server-side 驗證必填欄位（name, grade）
//   3. UPDATE users 主表（全 8 個欄位 + onboarding_completed = true）
//   4. redirect 至 /dashboard/explore
// ─────────────────────────────────────────────────────────────
export async function completeOnboarding(data: OnboardingData): Promise<OnboardingResult> {
  // ── 1. 驗證身份 ──
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '身份驗證失敗，請重新登入。' }
  }

  // ── 2. Server-side 必填驗證 ──
  const trimmedName = data.name.trim()
  if (!trimmedName) {
    return { success: false, error: '請輸入學生姓名。' }
  }
  if (!data.grade) {
    return { success: false, error: '請選擇年級 / 身分。' }
  }

  // ── 3. 寫入資料庫 ──
  const { error: updateError } = await supabase
    .from('users')
    .update({
      name:                 trimmedName,
      grade:                data.grade,
      gender:               data.gender                  || null,
      birthday:             data.birthday                || null,
      district:             data.district.trim()         || null,
      school:               data.school.trim()           || null,
      parent_name:          data.parent_name.trim()      || null,
      parent_phone:         data.parent_phone.trim()     || null,
      onboarding_completed: true,
      updated_at:           new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('DB Update Error (completeOnboarding):', updateError)
    return {
      success: false,
      error:   `資料庫更新失敗：${updateError.message}（代碼：${updateError.code}）`,
    }
  }

  // ── 4. 清除快取 & 導向儀表板 ──
  // redirect() 必須在 try/catch 外執行，避免被誤攔截
  revalidatePath('/dashboard')
  redirect('/dashboard/explore')
}
