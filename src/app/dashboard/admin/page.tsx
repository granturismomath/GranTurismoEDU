import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// ══════════════════════════════════════════════════════════════
// 型別定義
// ══════════════════════════════════════════════════════════════
type LogType = '註冊' | '購買課程' | '系統更新' | '錯誤警告'

type LogRow = {
  id:          string
  time:        string   // 'YYYY-MM-DD HH:mm:ss'
  type:        LogType
  description: string
  actor:       string   // 'name / IP'
}

// ── 事件類型 Badge 樣式表 ──────────────────────────────────────
const LOG_BADGE: Record<LogType, { bg: string; color: string }> = {
  '註冊':     { bg: 'rgba(52,199,89,0.13)',   color: '#34C759' },
  '購買課程': { bg: 'rgba(109,151,182,0.18)', color: '#6D97B6' },
  '系統更新': { bg: 'rgba(175,82,222,0.13)',  color: '#BF5AF2' },
  '錯誤警告': { bg: 'rgba(255,59,48,0.13)',   color: '#FF3B30' },
}

// ══════════════════════════════════════════════════════════════
// Mock Data
// ══════════════════════════════════════════════════════════════

// TODO: 未來串接 Supabase system_logs 表格
const MOCK_LOGS: LogRow[] = [
  {
    id: '1',
    time: '2026-03-18 09:42:11',
    type: '註冊',
    description: '新車手完成帳號建立並通過 Email 驗證',
    actor: '林志豪 / 203.0.113.42',
  },
  {
    id: '2',
    time: '2026-03-18 09:31:05',
    type: '購買課程',
    description: '課程《GT 極速入門》購買成功　NT$ 2,800',
    actor: '王雅婷 / 198.51.100.7',
  },
  {
    id: '3',
    time: '2026-03-18 09:18:33',
    type: '系統更新',
    description: 'GranTurismoEDU v1.2.0 — 車手名冊頁面上線部署完成',
    actor: 'System / 127.0.0.1',
  },
  {
    id: '4',
    time: '2026-03-18 08:55:20',
    type: '錯誤警告',
    description: '影片串流連線逾時，Cloudflare Edge 自動重試 3 次後恢復',
    actor: 'CDN Edge / 104.21.5.9',
  },
  {
    id: '5',
    time: '2026-03-18 08:40:47',
    type: '購買課程',
    description: '課程《賽道煞車技術》購買成功　NT$ 1,980',
    actor: '陳建宏 / 192.168.1.45',
  },
  {
    id: '6',
    time: '2026-03-18 08:22:09',
    type: '註冊',
    description: '新車手完成帳號建立，首次 Onboarding 問卷填寫完畢',
    actor: '張美玲 / 203.0.113.88',
  },
  {
    id: '7',
    time: '2026-03-17 23:14:58',
    type: '系統更新',
    description: 'Supabase chapters 資料表索引最佳化完成，查詢提速 40%',
    actor: 'System / 127.0.0.1',
  },
  {
    id: '8',
    time: '2026-03-17 22:03:31',
    type: '錯誤警告',
    description: 'OAuth Google 登入失敗 — 帳號不存在於系統',
    actor: 'unknown / 185.220.101.3',
  },
  {
    id: '9',
    time: '2026-03-17 20:45:16',
    type: '購買課程',
    description: '課程《彎道過彎物理學》購買成功　NT$ 3,200',
    actor: '劉雨晴 / 198.51.100.22',
  },
  {
    id: '10',
    time: '2026-03-17 18:30:00',
    type: '註冊',
    description: '新車手完成首次 Onboarding 問卷，偏好設定已儲存',
    actor: '吳志明 / 203.0.113.11',
  },
]

// ══════════════════════════════════════════════════════════════
// Sub-components（Server Component — 純渲染，無 hook）
// ══════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  unit,
  trend,
  trendUp,
  accentColor,
  icon,
}: {
  label:       string
  value:       string
  unit:        string
  trend:       string
  trendUp:     boolean
  accentColor: string
  icon:        React.ReactNode
}) {
  return (
    <div
      className="relative rounded-3xl p-6 overflow-hidden"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        border:          '1px solid var(--border-subtle)',
        boxShadow:       '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* 頂部：圖示 + label */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
        <span style={{ color: accentColor, opacity: 0.85 }}>
          {icon}
        </span>
      </div>

      {/* 主數值 */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {unit}
        </span>
      </div>

      {/* Trend badge */}
      <span
        className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: trendUp
            ? 'rgba(52,199,89,0.12)'
            : 'rgba(255,59,48,0.10)',
          color: trendUp ? '#34C759' : '#FF3B30',
        }}
      >
        {trend}
      </span>

      {/* 左側彩色邊條 */}
      <div
        className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SVG 圖示
// ─────────────────────────────────────────────────────────────
const IconDrivers = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconNewUser = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
)

const IconPurchase = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

const IconStatus = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

// ── 時間格式化：擷取 HH:mm:ss ──────────────────────────────────
function formatTime(datetime: string) {
  // 'YYYY-MM-DD HH:mm:ss' → 'HH:mm'
  return datetime.split(' ')[1]?.slice(0, 5) ?? datetime
}

// ── 日期分隔符（當日期不同時顯示）────────────────────────────────
function formatDate(datetime: string) {
  return datetime.split(' ')[0] ?? datetime
}

// ══════════════════════════════════════════════════════════════
// AdminPage — Server Component（系統監控大廳）
// ══════════════════════════════════════════════════════════════
export default async function AdminPage() {
  const supabase = await createClient()

  // ── RBAC：只有 owner / admin 可進入 ──
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['owner', 'admin'].includes(profile?.role ?? '')) {
    redirect('/dashboard/explore')
  }

  // ── 今日日期 ──
  const today = new Date().toLocaleDateString('zh-TW', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
    weekday: 'short',
  })

  // ── 依日期分組 logs（方便渲染分隔線）──
  const groupedLogs: Array<{ date: string; rows: LogRow[] }> = []
  for (const row of MOCK_LOGS) {
    const date = formatDate(row.time)
    const last = groupedLogs[groupedLogs.length - 1]
    if (!last || last.date !== date) {
      groupedLogs.push({ date, rows: [row] })
    } else {
      last.rows.push(row)
    }
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* ══════════════════════════════════════
          頁面標題列
      ══════════════════════════════════════ */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🛡</span>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            車隊總部
          </h1>
          <span
            className="text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(109,151,182,0.14)', color: '#6D97B6' }}
          >
            System Monitor
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          系統監控大廳 · {today}
        </p>
      </div>

      {/* ══════════════════════════════════════
          Stats Cards Grid
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

        <StatCard
          label="今日活躍車手"
          value="128"
          unit="人"
          trend="↑ 較昨日 +12%"
          trendUp
          accentColor="#6D97B6"
          icon={<IconDrivers />}
        />

        <StatCard
          label="本月新增註冊"
          value="47"
          unit="人"
          trend="↑ 較上月 +8%"
          trendUp
          accentColor="#34C759"
          icon={<IconNewUser />}
        />

        <StatCard
          label="課程購買筆數"
          value="213"
          unit="筆"
          trend="↑ 較上月 +22%"
          trendUp
          accentColor="#BF5AF2"
          icon={<IconPurchase />}
        />

        <StatCard
          label="系統狀態"
          value="🟢"
          unit="運作正常"
          trend="Uptime 99.98%"
          trendUp
          accentColor="#34C759"
          icon={<IconStatus />}
        />

      </div>

      {/* ══════════════════════════════════════
          系統日誌 (System Logs)
      ══════════════════════════════════════ */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          border:          '1px solid var(--border-subtle)',
          boxShadow:       '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* 區塊 Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h2
              className="text-base font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              系統日誌
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              System Logs · 最近 {MOCK_LOGS.length} 筆事件
              {/* TODO: 未來串接 Supabase system_logs 表格 */}
            </p>
          </div>

          {/* Badge 圖例 */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
            {(Object.keys(LOG_BADGE) as LogType[]).map(type => (
              <span
                key={type}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: LOG_BADGE[type].bg, color: LOG_BADGE[type].color }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* 表頭 */}
        <div
          className="grid grid-cols-[90px_100px_1fr_160px] gap-4 px-7 py-3 text-[10px] font-semibold tracking-widest uppercase"
          style={{
            color:           'var(--text-tertiary)',
            borderBottom:    '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0,0,0,0.015)',
          }}
        >
          <span>時間</span>
          <span>類型</span>
          <span>描述</span>
          <span className="text-right">操作者 / IP</span>
        </div>

        {/* 日誌列表（按日期分組）*/}
        {groupedLogs.map(({ date, rows }) => (
          <div key={date}>

            {/* 日期分隔線 */}
            <div
              className="flex items-center gap-3 px-7 py-2.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              <div
                className="h-px flex-1"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              />
              <span
                className="text-[10px] font-semibold tracking-widest shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {date}
              </span>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              />
            </div>

            {/* 該日期的各筆 log */}
            {rows.map((row, idx) => {
              const badge = LOG_BADGE[row.type]
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[90px_100px_1fr_160px] gap-4 px-7 py-4 items-center transition-colors duration-100"
                  style={{
                    borderBottom:
                      idx < rows.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                  }}
                >
                  {/* 時間 */}
                  <span
                    className="text-xs tabular-nums font-mono"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {formatTime(row.time)}
                  </span>

                  {/* 類型 Badge */}
                  <span>
                    <span
                      className="inline-block text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {row.type}
                    </span>
                  </span>

                  {/* 描述 */}
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {row.description}
                  </span>

                  {/* 操作者 / IP */}
                  <span
                    className="text-xs text-right font-mono leading-tight"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {row.actor}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        {/* Footer */}
        <div
          className="px-7 py-4 text-center"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {/* TODO: 未來串接 Supabase system_logs 表格，支援即時訂閱與無限滾動 */}
            目前顯示 Mock 資料 · 待串接 Supabase system_logs 表格
          </p>
        </div>

      </div>
    </div>
  )
}
