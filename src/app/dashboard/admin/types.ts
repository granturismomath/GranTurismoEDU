/**
 * src/app/dashboard/admin/types.ts
 *
 * Admin Console 共用型別定義
 * ────────────────────────────────────────────────────────────
 * 將 UserRow 與 AuditRow 抽離至獨立模組，
 * 避免 page.tsx（Server Component）與 AdminConsole.tsx（Client Component）
 * 之間產生循環依賴或型別匯出問題。
 */

// ── 車手名冊資料列 ─────────────────────────────────────────────────────────────
//
// 對應 Supabase `users` 資料表的查詢結果。
// school / parent_name 等選填欄位以型別擴展的方式使用，不列入基礎定義。
//
export interface UserRow {
  id:                   string
  name:                 string | null
  email:                string | null
  role:                 string          // 'owner' | 'admin' | 'user' | 'student' | ...
  grade:                string | null   // e.g. 'junior_1', 'senior_3', 'parent'
  onboarding_completed: boolean
  created_at:           string          // ISO 8601 timestamp string
}

// ── 系統稽核資料列 ─────────────────────────────────────────────────────────────
//
// 對應 Supabase `profile_history`（或 audit_logs）資料表的查詢結果。
// old_data / new_data 儲存 JSONB 快照，鍵值均為字串或 null。
//
export interface AuditRow {
  id:         string
  user_id:    string
  user_name:  string | null
  user_email: string | null
  changed_at: string          // ISO 8601 timestamp string
  old_data:   Record<string, string | null> | null
  new_data:   Record<string, string | null> | null
}
