'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRow, AuditRow } from './types'
import { updateUserRole, type MutableRole } from './actions'

// ── RBAC 輔助 ─────────────────────────────────────────────────
function normalizeToMutableRole(role: string): MutableRole {
  return role === 'admin' ? 'admin' : 'user'
}

// ── 年級顯示對照 ──────────────────────────────────────────────
const GRADE_LABEL: Record<string, string> = {
  elem_1: '小一', elem_2: '小二', elem_3: '小三',
  elem_4: '小四', elem_5: '小五', elem_6: '小六',
  junior_1: '國一', junior_2: '國二', junior_3: '國三',
  senior_1: '高一', senior_2: '高二', senior_3: '高三',
  parent: '家長', teacher: '教師', other: '其他',
}

// ── Role Badge ────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  owner:   { label: 'Owner',  bg: 'rgba(109,151,182,0.15)', color: '#7FAED2' },
  admin:   { label: 'Admin',  bg: 'rgba(255,159,10,0.15)',  color: '#FF9F0A' },
  user:    { label: '車手',   bg: 'rgba(52,199,89,0.15)',   color: '#34C759' },
  student: { label: '學員',   bg: 'rgba(52,199,89,0.15)',   color: '#34C759' },
  parent:  { label: '家長',   bg: 'rgba(175,82,222,0.15)',  color: '#AF52DE' },
  teacher: { label: '教師',   bg: 'rgba(90,200,250,0.15)',  color: '#5AC8FA' },
}

// ── 日期工具 ──────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── 稽核差異提取 ──────────────────────────────────────────────
function extractDiff(
  oldData: Record<string, string | null> | null,
  newData: Record<string, string | null> | null,
): { field: string; before: string; after: string }[] {
  if (!newData) return []
  const fields = Array.from(new Set([
    ...Object.keys(oldData ?? {}), ...Object.keys(newData),
  ])).filter(f => !f.startsWith('_'))
  return fields
    .filter(f => (oldData?.[f] ?? null) !== (newData[f] ?? null))
    .map(f => ({ field: f, before: oldData?.[f] ?? '（空）', after: newData[f] ?? '（空）' }))
}

// ── 版本歷史（靜態 Mock）──────────────────────────────────────
const VERSION_LOG = [
  {
    version: 'v1.2.0',
    date:    '2026-03-16',
    type:    'major' as const,
    changes: [
      '企業級三層 RBAC 系統（Owner / Admin / User）',
      'Admin Console 車隊指揮中心正式上線',
      '新生報到 & 帳號設定擴充至 7 個欄位',
      '系統日誌 Timeline 全面建置',
    ],
  },
  {
    version: 'v1.1.0',
    date:    '2026-02-15',
    type:    'minor' as const,
    changes: [
      '強制新生報到引導流程（Onboarding Gate）',
      '帳號設定頁面升級為 Server Component 零閃爍',
      '系統稽核 Audit Log（profile_history）',
      '年度自動晉升年級 Cron Job（每年 7/1）',
    ],
  },
  {
    version: 'v1.0.0',
    date:    '2026-01-15',
    type:    'release' as const,
    changes: [
      '超跑教育 GranTurismoEDU 平台正式上線 🏁',
      'Google OAuth + Email/Password 雙重登入',
      '課程探索、學員儀表板、我的課程',
      'GT 午夜賽道深色模式（Midnight Blue Palette）',
    ],
  },
]

const VERSION_TYPE_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  major:   { label: 'Major',   bg: 'rgba(109,151,182,0.15)', color: '#7FAED2' },
  minor:   { label: 'Minor',   bg: 'rgba(52,199,89,0.12)',   color: '#34C759' },
  release: { label: 'Release', bg: 'rgba(255,159,10,0.12)',  color: '#FF9F0A' },
}

// ── Toast ─────────────────────────────────────────────────────
type ToastType  = 'success' | 'error'
type ToastState = { id: number; type: ToastType; message: string }

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  const ok = toast.type === 'success'
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{
        backgroundColor: ok ? '#1C2A38' : '#2A1C1C',
        border:          `1px solid ${ok ? '#2A3C50' : '#4A2020'}`,
        minWidth:        '300px',
        boxShadow:       ok
          ? '0 8px 32px rgba(19,28,37,0.6), 0 0 0 1px rgba(127,174,210,0.2)'
          : '0 8px 32px rgba(37,19,19,0.6)',
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: ok ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)' }}>
        {ok ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        )}
      </div>
      <p className="text-sm font-medium flex-1" style={{ color: ok ? '#EEF2F6' : '#FFB3B0' }}>{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="opacity-40 hover:opacity-100 transition-opacity ml-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EEF2F6" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

// ── RoleSelect ────────────────────────────────────────────────
function RoleSelect({ userId, currentRole, isLoading, onConfirm }: {
  userId: string; currentRole: string; isLoading: boolean
  onConfirm: (userId: string, newRole: MutableRole) => void
}) {
  const [value, setValue] = useState<MutableRole>(normalizeToMutableRole(currentRole))
  useEffect(() => { setValue(normalizeToMutableRole(currentRole)) }, [currentRole])

  if (isLoading) return (
    <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-xs">更新中…</span>
    </div>
  )
  return (
    <div className="relative inline-block">
      <select value={value}
        onChange={e => { const r = e.target.value as MutableRole; setValue(r); onConfirm(userId, r) }}
        className="appearance-none text-xs font-semibold pl-3 pr-7 py-1.5 rounded-xl outline-none cursor-pointer transition-all duration-200"
        style={{
          backgroundColor: value === 'admin' ? 'rgba(255,159,10,0.12)' : 'rgba(52,199,89,0.10)',
          color:           value === 'admin' ? '#FF9F0A' : '#34C759',
          border:          `1px solid ${value === 'admin' ? 'rgba(255,159,10,0.3)' : 'rgba(52,199,89,0.25)'}`,
        }}>
        <option value="admin" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>管理員 (Admin)</option>
        <option value="user"  style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>一般車手 (User)</option>
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: value === 'admin' ? '#FF9F0A' : '#34C759' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </span>
    </div>
  )
}

// ── LockCell ──────────────────────────────────────────────────
function LockCell() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
      style={{ backgroundColor: 'var(--nav-hover-bg)', color: 'var(--text-tertiary)' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      無法更改
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
function EmptyState({ icon, text, subtext }: { icon: React.ReactNode; text: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div style={{ color: 'var(--border-subtle)' }}>{icon}</div>
      <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>{text}</p>
      {subtext && <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>{subtext}</p>}
    </div>
  )
}

// ── ComingSoon Card ───────────────────────────────────────────
function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--nav-hover-bg)', color: 'var(--text-tertiary)' }}
      >
        {icon}
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
      </div>
      <span
        className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
        style={{ backgroundColor: 'rgba(109,151,182,0.12)', color: '#7FAED2' }}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        即將上線
      </span>
    </div>
  )
}

// ── 包覆 Table 的卡片容器 ─────────────────────────────────────
function TableCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-bg)',
        border:          '1px solid var(--border-subtle)',
        boxShadow:       '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {children}
      {footer && (
        <div className="px-6 py-4 transition-colors duration-300"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {footer}
        </div>
      )}
    </div>
  )
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className="px-6 py-4 font-semibold text-xs tracking-wider whitespace-nowrap transition-colors duration-300"
      style={{ color: 'var(--text-tertiary)', textAlign: right ? 'right' : 'left' }}>
      {children}
    </th>
  )
}

// ─────────────────────────────────────────────────────────────
// AdminConsole — 三頁籤主體
// ─────────────────────────────────────────────────────────────
export default function AdminConsole({
  users,
  auditLogs,
  currentUserRole,
  currentUserId,
}: {
  users:           UserRow[]
  auditLogs:       AuditRow[]
  currentUserRole: string
  currentUserId:   string
}) {
  const router = useRouter()

  type Tab       = 'users' | 'audit' | 'logs'
  type LogFilter = 'version' | 'course' | 'registration' | 'purchase'

  const [activeTab,   setActiveTab]   = useState<Tab>('users')
  const [logFilter,   setLogFilter]   = useState<LogFilter>('registration')
  const [loadingUser, setLoadingUser] = useState<string | null>(null)
  const [toasts,      setToasts]      = useState<ToastState[]>([])
  let toastCounter = 0

  const pushToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, type, message }])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleRoleChange = useCallback(async (targetUserId: string, newRole: MutableRole) => {
    setLoadingUser(targetUserId)
    try {
      const result = await updateUserRole(targetUserId, newRole)
      if (result.success) {
        pushToast('success', `✓ 權限已更新為「${newRole === 'admin' ? '管理員' : '一般車手'}」`)
        router.refresh()
      } else {
        pushToast('error', result.error ?? '更新失敗，請稍後再試。')
      }
    } catch (err: unknown) {
      pushToast('error', err instanceof Error ? err.message : '系統錯誤，請聯繫技術支援。')
    } finally {
      setLoadingUser(null)
    }
  }, [pushToast, router])

  const isOwner      = currentUserRole === 'owner'
  const isAdminViewer = currentUserRole === 'admin'

  // ── Tab 定義 ─────────────────────────────────────────────
  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'users', label: '車手名冊', count: users.length,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      id: 'audit', label: '系統稽核', count: auditLogs.length,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    },
    {
      id: 'logs', label: '系統日誌', count: users.length,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
  ]

  // ── 系統日誌 子分類 ───────────────────────────────────────
  const logFilters: { id: LogFilter; label: string; count?: number }[] = [
    { id: 'version',      label: '更新版本',    count: VERSION_LOG.length },
    { id: 'course',       label: '課程管理日誌' },
    { id: 'registration', label: '學員註冊日誌', count: users.length },
    { id: 'purchase',     label: '課程購買日誌' },
  ]

  return (
    <>
      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
          {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={dismissToast} />)}
        </div>
      )}

      <div className="p-8 max-w-6xl">

        {/* ── 頁首 ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {isOwner ? 'Owner' : 'Admin'} Console
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight transition-colors duration-300"
            style={{ color: 'var(--text-primary)' }}>
            車隊最高指揮中心
          </h1>
          <p className="mt-2 text-base transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
            {isOwner ? '管理所有車手資料、指派權限、監控系統變更紀錄' : '檢視所有車手資料與系統變更紀錄（唯讀）'}
          </p>
        </div>

        {/* ── 主頁籤 ── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6 w-fit transition-colors duration-300"
          style={{ backgroundColor: 'var(--nav-hover-bg)' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: active ? 'var(--card-bg)' : 'transparent',
                  color:           active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow:       active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                <span>{tab.icon}</span>
                {tab.label}
                <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: active ? 'var(--nav-active-bg)' : 'transparent',
                    color:           active ? 'var(--brand)' : 'var(--text-tertiary)',
                  }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* ════════════════════════════════════════════════════
            TAB 1: 車手名冊
        ════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <TableCard
            footer={users.length > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                  共 <strong style={{ color: 'var(--text-secondary)' }}>{users.length}</strong> 位車手
                </span>
                <span className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                  已報到 <strong style={{ color: '#34C759' }}>
                    {users.filter(u => u.onboarding_completed).length}
                  </strong> 位
                </span>
              </div>
            ) : undefined}
          >
            {users.length === 0 ? (
              <EmptyState text="尚無車手資料"
                icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="transition-colors duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <TH>姓名</TH><TH>Email</TH><TH>身分</TH><TH>年級</TH>
                      <TH>學校</TH><TH>家長</TH><TH>完成報到</TH><TH right>操作</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => {
                      const badge      = ROLE_BADGE[u.role] ?? { label: u.role, bg: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }
                      const isSelf     = u.id === currentUserId
                      const canChange  = isOwner && u.role !== 'owner' && !isSelf
                      const rowLoading = loadingUser === u.id
                      return (
                        <tr key={u.id}
                          className="transition-all duration-150"
                          style={{ borderBottom: idx < users.length - 1 ? '1px solid var(--border-subtle)' : 'none', opacity: rowLoading ? 0.6 : 1 }}
                          onMouseEnter={e => { if (!rowLoading) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                        >
                          {/* 姓名 */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                {u.name ?? <span style={{ color: 'var(--text-tertiary)' }}>未設定</span>}
                                {isSelf && (
                                  <span className="ml-1.5 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md"
                                    style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}>你</span>
                                )}
                              </span>
                              <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{fmtDate(u.created_at)} 加入</span>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {u.email ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>
                          {/* Role */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                          </td>
                          {/* 年級 */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {u.grade ? (GRADE_LABEL[u.grade] ?? u.grade) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>
                          {/* 學校 */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {(u as UserRow & { school?: string | null }).school ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>
                          {/* 家長 */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {(u as UserRow & { parent_name?: string | null }).parent_name ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>
                          {/* 完成報到 */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.onboarding_completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                style={{ backgroundColor: 'rgba(52,199,89,0.12)', color: '#34C759' }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                已完成
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                style={{ backgroundColor: 'rgba(255,59,48,0.10)', color: '#FF3B30' }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                未完成
                              </span>
                            )}
                          </td>
                          {/* 操作 */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {isSelf && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>（您）</span>}
                            {!isSelf && u.role === 'owner' && (
                              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                                style={{ backgroundColor: 'rgba(109,151,182,0.1)', color: '#7FAED2' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                最高指揮官
                              </span>
                            )}
                            {canChange && (
                              <RoleSelect userId={u.id} currentRole={u.role}
                                isLoading={rowLoading} onConfirm={handleRoleChange} />
                            )}
                            {!isSelf && !canChange && u.role !== 'owner' && isAdminViewer && <LockCell />}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2: 系統稽核
        ════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <TableCard
            footer={auditLogs.length > 0 ? (
              <span className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                最近 <strong style={{ color: 'var(--text-secondary)' }}>{auditLogs.length}</strong> 筆變更紀錄
              </span>
            ) : undefined}
          >
            {auditLogs.length === 0 ? (
              <EmptyState text="尚無稽核紀錄"
                icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="transition-colors duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <TH>時間</TH><TH>車手</TH><TH>變更欄位</TH><TH>修改前</TH><TH>修改後</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((row, idx) => {
                      const diffs = extractDiff(row.old_data, row.new_data)
                      const displayDiffs = diffs.length > 0 ? diffs : [{ field: '—', before: '—', after: '—' }]
                      return displayDiffs.map((diff, dIdx) => (
                        <tr key={`${row.id}-${dIdx}`}
                          className="transition-all duration-150"
                          style={{ borderBottom: idx < auditLogs.length - 1 || dIdx < displayDiffs.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                        >
                          {dIdx === 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-tertiary)' }} rowSpan={displayDiffs.length}>
                              {fmtDateTime(row.changed_at)}
                            </td>
                          )}
                          {dIdx === 0 && (
                            <td className="px-6 py-4 whitespace-nowrap" rowSpan={displayDiffs.length}>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{row.user_name ?? '未知車手'}</span>
                                <span className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{row.user_email ?? `${row.user_id.slice(0, 8)}…`}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-lg"
                              style={{ backgroundColor: 'var(--nav-hover-bg)', color: 'var(--brand)' }}>
                              {diff.field}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs max-w-[160px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="line-clamp-2">{diff.before}</span>
                          </td>
                          <td className="px-6 py-4 text-xs max-w-[160px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            <span className="line-clamp-2">{diff.after}</span>
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 3: 系統日誌
        ════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="space-y-5">

            {/* ── 子分類篩選列 ── */}
            <div className="flex flex-wrap gap-2">
              {logFilters.map(f => {
                const active = logFilter === f.id
                return (
                  <button key={f.id} onClick={() => setLogFilter(f.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: active ? 'var(--nav-active-bg)' : 'var(--nav-hover-bg)',
                      color:           active ? 'var(--brand)'          : 'var(--text-tertiary)',
                      border:          active ? '1px solid color-mix(in srgb, var(--brand) 30%, transparent)' : '1px solid var(--border-subtle)',
                    }}>
                    {f.label}
                    {f.count !== undefined && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: active ? 'color-mix(in srgb, var(--brand) 15%, transparent)' : 'var(--border-subtle)',
                          color:           active ? 'var(--brand)' : 'var(--text-tertiary)',
                        }}>
                        {f.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── 更新版本 ── */}
            {logFilter === 'version' && (
              <div className="space-y-4">
                {VERSION_LOG.map((v, idx) => {
                  const typeStyle = VERSION_TYPE_STYLE[v.type] ?? VERSION_TYPE_STYLE.minor
                  return (
                    <div key={v.version} className="relative flex gap-5">
                      {/* 時間軸線 */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 z-10"
                          style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </div>
                        {idx < VERSION_LOG.length - 1 && (
                          <div className="w-px flex-1 mt-2 transition-colors duration-300" style={{ backgroundColor: 'var(--border-subtle)', minHeight: '24px' }} />
                        )}
                      </div>
                      {/* 版本卡片 */}
                      <div className="flex-1 pb-4 rounded-3xl p-6 transition-colors duration-300"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{v.version}</span>
                          <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                            {typeStyle.label}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>{v.date}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {v.changes.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brand)' }}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── 課程管理日誌（待串接）── */}
            {logFilter === 'course' && (
              <TableCard>
                <ComingSoon
                  icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
                  title="課程管理日誌"
                  desc="課程上架、下架、修改記錄將於課程管理系統串接後自動顯示"
                />
              </TableCard>
            )}

            {/* ── 學員註冊日誌（真實資料）── */}
            {logFilter === 'registration' && (
              <TableCard
                footer={users.length > 0 ? (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    共 <strong style={{ color: 'var(--text-secondary)' }}>{users.length}</strong> 位車手完成註冊
                  </span>
                ) : undefined}
              >
                {users.length === 0 ? (
                  <EmptyState text="尚無註冊紀錄"
                    icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
                ) : (
                  <div className="divide-y transition-colors duration-300" style={{ borderColor: 'var(--border-subtle)' }}>
                    {[...users].sort((a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ).map(u => {
                      const badge = ROLE_BADGE[u.role] ?? { label: u.role, bg: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }
                      const initials = (u.name ?? u.email ?? '?').slice(0, 2).toUpperCase()
                      return (
                        <div key={u.id}
                          className="flex items-center gap-4 px-6 py-4 transition-all duration-150"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--brand)' }}>
                            {initials}
                          </div>
                          {/* 名稱 + Email */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {u.name ?? '未設定姓名'}
                            </p>
                            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {u.email ?? '—'}
                            </p>
                          </div>
                          {/* Role Badge */}
                          <span className="hidden sm:inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full shrink-0"
                            style={{ backgroundColor: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          {/* 報到狀態 */}
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0"
                            style={u.onboarding_completed
                              ? { backgroundColor: 'rgba(52,199,89,0.12)', color: '#34C759' }
                              : { backgroundColor: 'rgba(255,59,48,0.10)', color: '#FF3B30' }}>
                            {u.onboarding_completed ? '已報到' : '未報到'}
                          </span>
                          {/* 時間 */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{fmtDate(u.created_at)}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                              {new Date(u.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TableCard>
            )}

            {/* ── 課程購買日誌（待串接）── */}
            {logFilter === 'purchase' && (
              <TableCard>
                <ComingSoon
                  icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
                  title="課程購買日誌"
                  desc="金流交易記錄將於金流系統（如 ECPay / Stripe）串接後自動顯示"
                />
              </TableCard>
            )}

          </div>
        )}

      </div>
    </>
  )
}
