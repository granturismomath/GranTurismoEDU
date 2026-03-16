'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ── 型別定義 ─────────────────────────────────────────────────
export type ProfileData = {
  name:         string  // 學生姓名
  grade:        string  // 年級
  gender:       string  // 性別
  birthday:     string  // 出生年月日 YYYY-MM-DD（或空字串）
  district:     string  // 學區
  school:       string  // 學校
  parent_name:  string  // 家長姓名
  parent_phone: string  // 家長聯絡電話
}

export type ActionResult = {
  success: boolean
  error?: string
}

// ─────────────────────────────────────────────────────────────
// updateUserProfile — Server Action
//
// 流程：
//   1. 驗證使用者身份（getUser）
//   2. 讀取目前的舊資料（SELECT from users）
//   3. 將舊資料 INSERT 進 profile_history（Audit Log）
//   4. UPDATE users 主表為新資料（全 8 個欄位）
//   5. revalidatePath 重新整理頁面快取
// ─────────────────────────────────────────────────────────────
export async function updateUserProfile(data: ProfileData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // ── 1. 驗證身份 ──
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '身份驗證失敗，請重新登入。' }
    }

    // ── 2. 讀取舊資料（為 Audit Log 備份）──
    const { data: oldProfile, error: fetchError } = await supabase
      .from('users')
      .select('name, grade, gender, birthday, district, school, parent_name, parent_phone')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found，新使用者可忽略
      console.error('DB Fetch Error (updateUserProfile):', fetchError)
    }

    // ── 3. 寫入歷史紀錄表（即使舊資料不存在也寫入，old_data 為 null）──
    const { error: historyError } = await supabase
      .from('profile_history')
      .insert({
        user_id:  user.id,
        old_data: oldProfile ?? null,
        new_data: {
          name:         data.name.trim(),
          grade:        data.grade,
          gender:       data.gender                  || null,
          birthday:     data.birthday                || null,
          district:     data.district.trim()         || null,
          school:       data.school.trim()           || null,
          parent_name:  data.parent_name.trim()      || null,
          parent_phone: data.parent_phone.trim()     || null,
        },
        // changed_at 由資料庫 DEFAULT now() 自動填入
      })

    if (historyError) {
      // 歷史紀錄寫入失敗時記錄 log 但不中斷主流程
      console.error('DB Insert Error (profile_history):', historyError)
    }

    // ── 4. 更新主表（含詳細錯誤回傳）──
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name:         data.name.trim(),
        grade:        data.grade,
        gender:       data.gender                  || null,
        birthday:     data.birthday                || null,
        district:     data.district.trim()         || null,
        school:       data.school.trim()           || null,
        parent_name:  data.parent_name.trim()      || null,
        parent_phone: data.parent_phone.trim()     || null,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('DB Update Error (updateUserProfile):', updateError)
      return {
        success: false,
        error:   `資料庫更新失敗：${updateError.message}（代碼：${updateError.code}）`,
      }
    }

    // ── 5. 重新驗證路由快取 ──
    revalidatePath('/dashboard/account')

    return { success: true }

  } catch (err: unknown) {
    console.error('Unexpected Error (updateUserProfile):', err)
    return { success: false, error: '系統發生未知錯誤，請稍後再試。' }
  }
}
