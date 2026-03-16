'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ── RBAC 角色常數（企業級三層）────────────────────────────────
//  owner → 最高指揮官  (唯一可指派 admin)
//  admin → 車隊管理員  (可查看名冊、稽核，但不能改人員角色)
//  user  → 一般車手    (學生/家長/教師等，新用戶預設值)
export type AppRole        = 'owner' | 'admin' | 'user'
export type MutableRole    = 'admin' | 'user'   // owner 不可被異動

export type RoleUpdateResult = {
  success: boolean
  error?:  string
}

// ─────────────────────────────────────────────────────────────
// updateUserRole — 權限指派 Server Action
//
// 安全層級（由外而內）：
//   L1  驗證呼叫者身份（getUser，來自 Supabase Auth，不可偽造）
//   L2  去資料庫二次確認呼叫者 role = 'owner'（防止 JWT 與 DB 不同步）
//   L3  防止降級 owner（owner 不能被更改）
//   L4  防止自我更改（owner 不能更改自己）
//   L5  寫入 profile_history Audit Log
//   L6  執行 UPDATE
//   L7  revalidatePath 使 Server Component 快取失效
// ─────────────────────────────────────────────────────────────
export async function updateUserRole(
  targetUserId: string,
  newRole:      MutableRole,
): Promise<RoleUpdateResult> {
  const supabase = await createClient()

  // ── L1：驗證 Auth 身份 ──
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: '身份驗證失敗，請重新登入。' }
  }

  // ── L2：資料庫二次確認呼叫者必須是 owner ──
  const { data: callerProfile, error: callerError } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (callerError || !callerProfile) {
    return { success: false, error: '無法驗證您的帳號資料，請重新登入。' }
  }
  if (callerProfile.role !== 'owner') {
    // 嚴格拋出 Error — 這不應該是正常業務流程，是明確的越權行為
    throw new Error('權限不足：只有車隊老闆 (OWNER) 可以更改人員權限')
  }

  // ── L3：目標使用者不能是 owner ──
  const { data: targetProfile, error: targetError } = await supabase
    .from('users')
    .select('role, name, email')
    .eq('id', targetUserId)
    .single()

  if (targetError || !targetProfile) {
    return { success: false, error: '目標使用者不存在或已被刪除。' }
  }
  if (targetProfile.role === 'owner') {
    return { success: false, error: '無法更改 Owner 的權限，最高指揮官不可異動。' }
  }

  // ── L4：防止自我更改 ──
  if (targetUserId === user.id) {
    return { success: false, error: '無法更改自己的權限。' }
  }

  // ── 若新舊角色相同，直接回傳成功（冪等操作）──
  if (targetProfile.role === newRole) {
    return { success: true }
  }

  const oldRole = targetProfile.role

  // ── L5：寫入 Audit Log ──
  const { error: historyError } = await supabase
    .from('profile_history')
    .insert({
      user_id:  targetUserId,
      old_data: {
        role:         oldRole,
        _changed_by:  callerProfile.name ?? user.id,
        _action:      'role_update',
      },
      new_data: {
        role:         newRole,
        _changed_by:  callerProfile.name ?? user.id,
        _action:      'role_update',
      },
      // changed_at 由資料庫 DEFAULT now() 自動填入
    })

  if (historyError) {
    // Audit Log 失敗時記錄 server log，但不阻斷主流程（業務優先）
    console.error('[updateUserRole] audit log insert error:', historyError.message)
  }

  // ── L6：執行角色更新 ──
  const { error: updateError } = await supabase
    .from('users')
    .update({
      role:       newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)

  if (updateError) {
    console.error('[updateUserRole] update error:', updateError.message)
    return { success: false, error: '權限更新失敗，請稍後再試。' }
  }

  // ── L7：使快取失效，觸發 Server Component 重新取得資料 ──
  revalidatePath('/dashboard/admin')

  return { success: true }
}
