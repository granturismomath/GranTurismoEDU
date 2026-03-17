import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

// ═════════════════════════════════════════════════════════════
// 型別定義
// ═════════════════════════════════════════════════════════════

type TabKey    = 'students' | 'team'
type SortOrder = 'asc' | 'desc'

// Supabase users 表的欄位對應
type UserRow = {
  id:                   string
  email:                string | null
  name:                 string | null    // 學生姓名（onboarding 時填寫）
  parent_name:          string | null
  parent_phone:         string | null
  school:               string | null
  grade:                string | null
  district:             string | null    // 格式："台北市大安區"（城市+行政區）
  role:                 string
  onboarding_completed: boolean | null
  created_at:           string
  // 🔮 未來擴充欄位（請在 DB 建立後取消註解，並加入 SELECT 與排序）
  // last_sign_in_at:          string | null   → 來自 Supabase Auth
  // course_completion_rate:   number | null   → 0~100，從購課/進度系統計算
}

// ═════════════════════════════════════════════════════════════
// 常數與設定
// ═════════════════════════════════════════════════════════════

const PAGE_SIZE = 20

// Tab 設定：各頁籤對應的 role 組合
const TAB_CONFIG: Record<TabKey, { label: string; roles: string[]; emptyText: string }> = {
  students: {
    label:     '學員名單',
    roles:     ['user', 'student', 'parent'],
    emptyText: '目前尚無學員資料',
  },
  team: {
    label:     '管理團隊',
    roles:     ['owner', 'admin'],
    emptyText: '目前尚無管理員資料',
  },
}

// 排序欄位白名單（防止任意字串傳入 Supabase order() 造成錯誤）
const VALID_SORT_COLS = new Set([
  'name', 'email', 'created_at', 'role',
  'school', 'grade', 'onboarding_completed',
])

// 年級顯示對照表
const GRADE_LABEL: Record<string, string> = {
  elem_1: '小一', elem_2: '小二', elem_3: '小三',
  elem_4: '小四', elem_5: '小五', elem_6: '小六',
  junior_1: '國一', junior_2: '國二', junior_3: '國三',
  senior_1: '高一', senior_2: '高二', senior_3: '高三',
  parent: '家長', teacher: '教師', other: '其他',
}

// Role Badge 樣式
const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  owner:   { label: 'OWNER', bg: 'rgba(109,151,182,0.15)', color: '#7FAED2' },
  admin:   { label: 'ADMIN', bg: 'rgba(255,159,10,0.15)',  color: '#FF9F0A' },
  user:    { label: '車手',  bg: 'rgba(52,199,89,0.15)',   color: '#34C759' },
  student: { label: '學員',  bg: 'rgba(52,199,89,0.15)',   color: '#34C759' },
  parent:  { label: '家長',  bg: 'rgba(175,82,222,0.15)',  color: '#AF52DE' },
}

// ═════════════════════════════════════════════════════════════
// 工具函式
// ═════════════════════════════════════════════════════════════

/** 格式化日期為台灣格式 YYYY/MM/DD */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

/**
 * 建構更新部分 URL Params 後的完整 query string。
 * 確保切換排序時，tab 與 page 等其他 params 不會遺失。
 */
function buildUrl(
  base: { tab: string; sort: string; order: string; page: number },
  overrides: Partial<{ tab: string; sort: string; order: string; page: number }>,
): string {
  const next = { ...base, ...overrides }
  return `?tab=${next.tab}&sort=${next.sort}&order=${next.order}&page=${next.page}`
}

/** 計算分頁按鈕應顯示的頁碼陣列（最多顯示 5 個，含省略邏輯）*/
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  if (current > 3)         pages.push('…')
  if (current > 2)         pages.push(current - 1)
  if (current !== 1 && current !== total) pages.push(current)
  if (current < total - 1) pages.push(current + 1)
  if (current < total - 2) pages.push('…')
  pages.push(total)

  return pages
}

// ═════════════════════════════════════════════════════════════
// SortableHeader 子元件
//
// 純 Server Component（無狀態、無事件），以 <Link> 實作排序。
// 點擊後更新 URL ?sort= 與 ?order= 並重置到第一頁。
// ═════════════════════════════════════════════════════════════
function SortableHeader({
  col, label, sortable = true,
  currentSort, currentOrder, baseParams,
}: {
  col:          string
  label:        string
  sortable?:    boolean
  currentSort:  string
  currentOrder: SortOrder
  baseParams:   { tab: string; sort: string; order: string; page: number }
}) {
  const thClass = 'px-5 py-4 text-left text-[11px] font-semibold tracking-widest uppercase whitespace-nowrap'

  // 不可排序欄位：靜態文字
  if (!sortable) {
    return (
      <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>
        <span className="flex items-center gap-1">
          {label}
          {/* 🔮 標記未來才能排序的欄位 */}
          <span className="text-[9px] normal-case font-normal opacity-40">（待串接）</span>
        </span>
      </th>
    )
  }

  const isActive  = currentSort === col
  // 若當前已按此欄位降序，點擊後改為升序；其餘情況一律先降序
  const nextOrder: SortOrder = isActive && currentOrder === 'desc' ? 'asc' : 'desc'
  const href = buildUrl(baseParams, { sort: col, order: nextOrder, page: 1 })

  return (
    <th className={thClass}>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 transition-opacity duration-150 hover:opacity-70"
        style={{ color: isActive ? 'var(--brand)' : 'var(--text-tertiary)' }}
      >
        {label}
        {/* 排序方向指示器 */}
        <span
          className="text-[10px] transition-all duration-150"
          style={{ opacity: isActive ? 1 : 0.35 }}
        >
          {isActive
            ? currentOrder === 'desc' ? '↓' : '↑'
            : '↕'}
        </span>
      </Link>
    </th>
  )
}

// ═════════════════════════════════════════════════════════════
// UsersPage — 高階車手名冊 (Server Component)
//
// 流程：
//   1. RBAC：只有 owner / admin 可進入
//   2. 解析 searchParams（Next.js 15 需 await）
//   3. Supabase 分頁查詢（.range + count: 'exact'）
//   4. 渲染 Tab、Table、Pagination（全部純 <Link>，零 JS）
// ═════════════════════════════════════════════════════════════
export default async function UsersPage({
  searchParams,
}: {
  // Next.js 15 App Router：searchParams 是 Promise
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()

  // ── 1. RBAC 身份驗證 ──────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard/explore')
  }

  // ── 2. 解析 URL 參數（並設定安全預設值）─────────────────────
  const sp = await searchParams

  const tab: TabKey = sp.tab === 'team' ? 'team' : 'students'
  const page        = Math.max(1, parseInt(sp.page  ?? '1',          10))
  const sort        = VALID_SORT_COLS.has(sp.sort ?? '')
                        ? (sp.sort ?? 'created_at')
                        : 'created_at'
  const order: SortOrder = sp.order === 'asc' ? 'asc' : 'desc'

  // 方便傳入工具函式的 base 物件
  const baseParams = { tab, sort, order, page }

  // ── 3. 計算分頁範圍 ────────────────────────────────────────
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1   // Supabase range 為包含式 (inclusive)

  // ── 4. Supabase 查詢（含精確總數）────────────────────────────
  const { data, count, error } = await supabase
    .from('users')
    .select(
      'id, email, name, parent_name, parent_phone, school, grade, district, role, onboarding_completed, created_at',
      { count: 'exact' },  // ← 關鍵：取得符合條件的精確總筆數，用於計算總頁數
    )
    .in('role', TAB_CONFIG[tab].roles)
    .order(sort, { ascending: order === 'asc' })
    .range(from, to)       // ← 伺服器端分頁：只取本頁的資料，不拉全表

  const users: UserRow[] = data ?? []
  const totalCount       = count ?? 0
  const totalPages       = Math.ceil(totalCount / PAGE_SIZE)
  const pageNumbers      = getPageNumbers(page, totalPages)

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-[1400px] space-y-6">

      {/* ── 頁首 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              車手名冊
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            高階車手名冊
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            伺服器端分頁 · 點擊欄位標題排序 · 依角色篩選
          </p>
        </div>

        {/* 右上：當前分頁資訊 */}
        {totalCount > 0 && (
          <div
            className="shrink-0 text-right text-xs pb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span>
              第 <strong style={{ color: 'var(--text-secondary)' }}>
                {from + 1}–{Math.min(to + 1, totalCount)}
              </strong> 筆
            </span>
            <span className="mx-1.5 opacity-30">/</span>
            <span>
              共 <strong style={{ color: 'var(--text-secondary)' }}>{totalCount}</strong> 筆
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          Tab 切換列
          點擊改變 ?tab= 並重置到第 1 頁
      ══════════════════════════════════════════════════════ */}
      <div
        className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ backgroundColor: 'var(--nav-hover-bg)' }}
      >
        {(Object.keys(TAB_CONFIG) as TabKey[]).map(key => {
          const cfg      = TAB_CONFIG[key]
          const isActive = tab === key
          return (
            <Link
              key={key}
              href={buildUrl(baseParams, { tab: key, page: 1 })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--card-bg)' : 'transparent',
                color:           isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow:       isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {cfg.label}
              {/* 當前 tab 顯示筆數氣泡 */}
              {isActive && totalCount > 0 && (
                <span
                  className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}
                >
                  {totalCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── 錯誤狀態 ── */}
      {error && (
        <div
          className="px-5 py-4 rounded-2xl text-sm"
          style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
        >
          資料載入失敗：{error.message}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          主資料表卡片（毛玻璃 + 大圓角）
      ══════════════════════════════════════════════════════ */}
      {!error && (
        <div
          className="rounded-3xl overflow-hidden backdrop-blur-xl transition-colors duration-300"
          style={{
            backgroundColor: 'var(--card-bg)',
            border:          '1px solid var(--border-subtle)',
            boxShadow:       '0 2px 20px rgba(0,0,0,0.05)',
          }}
        >
          {/* ── 空狀態 ── */}
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                style={{ color: 'var(--border-subtle)' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {TAB_CONFIG[tab].emptyText}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                {/* ════════════════════════════════════════════
                    表頭：可點擊排序的 <Link> 欄位
                    注意：Server Component 不可用 onClick，
                          排序邏輯完全透過 URL Params 驅動。
                ════════════════════════════════════════════ */}
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>

                    {/* ─── 學員名單欄位 ─── */}
                    {tab === 'students' && (<>
                      <SortableHeader col="created_at" label="註冊日期"  currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      <SortableHeader col="name"       label="學生姓名"  currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      <SortableHeader col="parent_name" label="家長姓名" currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                      <SortableHeader col="parent_phone" label="聯絡電話" currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                      <SortableHeader col="school"     label="學校 / 年級" currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      <SortableHeader col="district"   label="地區"      currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                      <SortableHeader col="onboarding_completed" label="完成報到" currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      {/* 🔮 course_completion_rate：待 DB 建立 course_completion_rate 欄位後啟用排序 */}
                      <SortableHeader col="course_completion_rate" label="課程完成率" currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                    </>)}

                    {/* ─── 管理團隊欄位 ─── */}
                    {tab === 'team' && (<>
                      <SortableHeader col="name"       label="姓名"      currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      <SortableHeader col="email"      label="Email"     currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      <SortableHeader col="role"       label="角色"      currentSort={sort} currentOrder={order} baseParams={baseParams} />
                      {/* 🔮 last_sign_in_at：待串接 Supabase Auth 後啟用 */}
                      <SortableHeader col="last_sign_in_at" label="最後上線" currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                      {/* 🔮 course_completion_rate：待 DB 欄位建立後啟用 */}
                      <SortableHeader col="course_completion_rate" label="課程完成率" currentSort={sort} currentOrder={order} baseParams={baseParams} sortable={false} />
                      <SortableHeader col="created_at" label="註冊日期"  currentSort={sort} currentOrder={order} baseParams={baseParams} />
                    </>)}

                  </tr>
                </thead>

                {/* ════════════════════════════════════════════
                    表格資料列
                ════════════════════════════════════════════ */}
                <tbody>
                  {users.map((u, idx) => {
                    const badge = ROLE_BADGE[u.role]
                      ?? { label: u.role.toUpperCase(), bg: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-black/[0.018] dark:hover:bg-white/[0.025] transition-colors duration-100"
                        style={{
                          borderBottom: idx < users.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                        }}
                      >

                        {/* ─── 學員名單資料列 ─── */}
                        {tab === 'students' && (<>

                          {/* 註冊日期 */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs tabular-nums"
                            style={{ color: 'var(--text-tertiary)' }}>
                            {fmtDate(u.created_at)}
                          </td>

                          {/* 學生姓名 */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {u.name ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                            </span>
                          </td>

                          {/* 家長姓名 */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm"
                            style={{ color: 'var(--text-secondary)' }}>
                            {u.parent_name ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>

                          {/* 聯絡電話 */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm tabular-nums"
                            style={{ color: 'var(--text-secondary)' }}>
                            {u.parent_phone ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>

                          {/* 學校 / 年級 */}
                          <td className="px-5 py-4 whitespace-nowrap text-sm"
                            style={{ color: 'var(--text-secondary)' }}>
                            {u.school || u.grade ? (
                              <>
                                {u.school}
                                {u.school && u.grade && (
                                  <span style={{ color: 'var(--text-tertiary)' }}> · </span>
                                )}
                                {u.grade && (GRADE_LABEL[u.grade] ?? u.grade)}
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>

                          {/* 居住地區（格式：城市+行政區，如「台北市大安區」）*/}
                          <td className="px-5 py-4 whitespace-nowrap text-sm"
                            style={{ color: 'var(--text-secondary)' }}>
                            {u.district ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>

                          {/* 完成報到 */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {u.onboarding_completed ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: 'rgba(52,199,89,0.12)', color: '#34C759' }}
                              >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                已完成
                              </span>
                            ) : (
                              <span
                                className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: 'var(--nav-hover-bg)', color: 'var(--text-tertiary)' }}
                              >
                                未完成
                              </span>
                            )}
                          </td>

                          {/* 🔮 課程完成率（待 course_completion_rate 欄位上線後替換）*/}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className="text-xs"
                              style={{ color: 'var(--text-tertiary)' }}
                              title="此欄位待 course_completion_rate 欄位建立後自動顯示真實數據"
                            >
                              — %
                            </span>
                          </td>

                        </>)}

                        {/* ─── 管理團隊資料列 ─── */}
                        {tab === 'team' && (<>

                          {/* 姓名 */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {u.name ?? <span style={{ color: 'var(--text-tertiary)' }}>未設定</span>}
                            </span>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs"
                            style={{ color: 'var(--text-secondary)' }}>
                            {u.email ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>

                          {/* 角色 Badge */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* 🔮 最後上線（待串接 Supabase Auth last_sign_in_at 欄位）
                               實作時：從 supabase.auth.admin.listUsers() 取得 last_sign_in_at */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="待串接 Supabase Auth last_sign_in_at">
                            —
                          </td>

                          {/* 🔮 課程完成率（待 course_completion_rate 欄位上線後替換）*/}
                          <td className="px-5 py-4 whitespace-nowrap text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                            title="待串接 course_completion_rate">
                            — %
                          </td>

                          {/* 註冊日期 */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs tabular-nums"
                            style={{ color: 'var(--text-tertiary)' }}>
                            {fmtDate(u.created_at)}
                          </td>

                        </>)}

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              分頁控制列
              全部以 <Link> 實作，點擊更新 ?page= 參數
          ══════════════════════════════════════════════════ */}
          {users.length > 0 && (
            <div
              className="flex items-center justify-between px-6 py-4 flex-wrap gap-4"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              {/* 左：分頁統計 */}
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                共 <strong style={{ color: 'var(--text-secondary)' }}>{totalCount}</strong> 筆 ·
                第 <strong style={{ color: 'var(--text-secondary)' }}>{page}</strong> /
                <strong style={{ color: 'var(--text-secondary)' }}>{Math.max(totalPages, 1)}</strong> 頁
              </p>

              {/* 右：分頁按鈕群 */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">

                  {/* 上一頁 */}
                  {page > 1 ? (
                    <Link
                      href={buildUrl(baseParams, { page: page - 1 })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--nav-hover-bg)',
                        color:           'var(--text-secondary)',
                        border:          '1px solid var(--border-subtle)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                      上一頁
                    </Link>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--nav-hover-bg)',
                        color:           'var(--text-tertiary)',
                        border:          '1px solid var(--border-subtle)',
                        opacity:         0.4,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                      上一頁
                    </span>
                  )}

                  {/* 頁碼列（含省略號邏輯）*/}
                  <div className="flex items-center gap-1">
                    {pageNumbers.map((p, i) =>
                      p === '…' ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="w-8 h-8 flex items-center justify-center text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          …
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={buildUrl(baseParams, { page: p })}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150"
                          style={p === page
                            ? { backgroundColor: 'var(--brand)', color: 'white' }
                            : { color: 'var(--text-tertiary)', backgroundColor: 'transparent' }
                          }
                        >
                          {p}
                        </Link>
                      )
                    )}
                  </div>

                  {/* 下一頁 */}
                  {page < totalPages ? (
                    <Link
                      href={buildUrl(baseParams, { page: page + 1 })}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--nav-active-bg)',
                        color:           'var(--brand)',
                        border:          '1px solid color-mix(in srgb, var(--brand) 20%, transparent)',
                      }}
                    >
                      下一頁
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--nav-active-bg)',
                        color:           'var(--brand)',
                        border:          '1px solid color-mix(in srgb, var(--brand) 20%, transparent)',
                        opacity:         0.4,
                      }}
                    >
                      下一頁
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
