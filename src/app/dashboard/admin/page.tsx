import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminConsole from './AdminConsole'

// ── 型別定義 ─────────────────────────────────────────────────
export type UserRow = {
  id:                   string
  email:                string | null
  name:                 string | null
  role:                 string
  grade:                string | null
  phone:                string | null
  onboarding_completed: boolean | null
  created_at:           string
}

export type AuditRow = {
  id:         string
  user_id:    string
  old_data:   Record<string, string | null> | null
  new_data:   Record<string, string | null> | null
  changed_at: string
  // 關聯欄位（client-side join）
  user_email?: string | null
  user_name?:  string | null
}

// ─────────────────────────────────────────────────────────────
// AdminPage — Server Component
//
// 流程：
//   1. 取得目前使用者，驗證 role 為 admin 或 owner
//   2. 若無權限 → redirect('/dashboard/explore')
//   3. 並行撈取 users 名冊 + profile_history 稽核紀錄
//   4. 合併 audit rows 的使用者資訊後傳入 Client Component
// ─────────────────────────────────────────────────────────────
export default async function AdminPage() {
  const supabase = await createClient()

  // ── 1. 驗證身份與角色 ──
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = currentProfile?.role ?? ''
  if (!['admin', 'owner'].includes(role)) {
    redirect('/dashboard/explore')
  }

  // ── 2. 並行撈取資料 ──
  const [usersResult, auditResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, name, role, grade, phone, onboarding_completed, created_at')
      .order('created_at', { ascending: false }),

    supabase
      .from('profile_history')
      .select('id, user_id, old_data, new_data, changed_at')
      .order('changed_at', { ascending: false })
      .limit(200),
  ])

  const users: UserRow[]    = usersResult.data ?? []
  const rawAudit             = auditResult.data ?? []

  // ── 3. 將使用者 email/name 合併進稽核紀錄 ──
  const userMap = new Map(users.map(u => [u.id, { email: u.email, name: u.name }]))
  const auditLogs: AuditRow[] = rawAudit.map(row => ({
    ...row,
    user_email: userMap.get(row.user_id)?.email ?? null,
    user_name:  userMap.get(row.user_id)?.name  ?? null,
  }))

  return (
    <AdminConsole
      users={users}
      auditLogs={auditLogs}
      currentUserRole={role}
      currentUserId={user.id}
    />
  )
}
