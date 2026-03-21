import Link from 'next/link'

// ── 課程型別（由此統一 export，explore page 直接 import） ──────
export type Course = {
  id: string
  title: string
  subject: string | null      // DB 直接欄位（數學 / 國文 / 英文 / ...）
  description: string | null
  price: number | null
  cover_image_url: string | null
  created_at: string
}

// ── 學科視覺配置型別 ──────────────────────────────────────────
type SubjectStyle = {
  label:    string
  color:    string   // 主色（文字、icon）
  bg:       string   // 淺色背景（badge fill）
  glow:     string   // 發光 / 陰影底色
  gradient: string   // 按鈕漸層、頂部色條
}

// ── 工具函式 ─────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price == null) return '洽詢價格'
  if (price === 0)   return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

/**
 * 智慧塗裝：優先讀取 subject 欄位，次以 title 關鍵字推斷
 * · 數學  → 品牌灰藍  #6D97B6
 * · 國文  → 磚紅      #C8474B
 * · 英文  → 森林綠    #597E5B
 * · 其他  → 預設灰藍  #6D97B6
 */
function getSubjectStyle(title: string, subject?: string | null): SubjectStyle {
  const MATH = { label: '數學', color: '#6D97B6', bg: 'rgba(109,151,182,0.12)', glow: 'rgba(109,151,182,0.28)', gradient: 'linear-gradient(135deg, #6D97B6 0%, #4A7FA5 100%)' }
  const CHN  = { label: '國文', color: '#C8474B', bg: 'rgba(200,71,75,0.10)',   glow: 'rgba(200,71,75,0.22)',   gradient: 'linear-gradient(135deg, #C8474B 0%, #A53237 100%)' }
  const ENG  = { label: '英文', color: '#597E5B', bg: 'rgba(89,126,91,0.10)',   glow: 'rgba(89,126,91,0.22)',   gradient: 'linear-gradient(135deg, #597E5B 0%, #3D6040 100%)' }

  const detect = (s: string): SubjectStyle | null => {
    if (s.includes('數學') || s.toLowerCase().includes('math'))                                      return MATH
    if (s.includes('國文') || s.includes('語文') || s.includes('寫作') || s.includes('作文'))        return CHN
    if (s.includes('英文') || s.includes('英語') || s.toLowerCase().includes('english'))             return ENG
    return null
  }

  return (subject ? detect(subject) : null) ?? detect(title) ?? MATH
}

// ── CourseCard 主組件 ─────────────────────────────────────────
/**
 * CourseCard v1.4.1
 * ──────────────────────────────────────────────────────────────
 * · rounded-3xl 極大圓角 (Apple 美學)
 * · 外層 Glow 暈光 + 內層 -translate-y-1.5 (GT 線性加速感)
 * · 頂部學科色彩條紋（2px 漸層）
 * · 底右角方格旗幾何裝飾（opacity 3.5%，mask 漸隱）
 * · 封面 placeholder：學科色點陣 + 45° 速度斜線
 * · 學科色 Badge · 動態漸層 CTA 按鈕 · hover:brightness-110
 */
export default function CourseCard({ course }: { course: Course }) {
  const subject = getSubjectStyle(course.title, course.subject)

  return (
    /* ── 外層：負責 Glow 暈光，本身不 overflow-hidden ── */
    <div className="group relative">

      {/* ── 學科色 Glow（hover 時升起，blur 擴散） ── */}
      <div
        className="
          absolute inset-2 rounded-3xl -z-10
          opacity-0 group-hover:opacity-100
          transition-all duration-500 ease-out
          blur-2xl
        "
        style={{ background: subject.glow }}
      />

      {/* ── 主卡片（hover 時輕浮 + 加深陰影） ── */}
      <div
        className="
          relative rounded-3xl overflow-hidden
          group-hover:-translate-y-1.5 group-hover:shadow-2xl
          transition-all duration-300 ease-out
        "
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >

        {/* ── 底右角方格旗幾何裝飾（方格旗紋 5% 透明，mask 漸隱） ── */}
        <div
          className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none z-0"
          style={{
            backgroundImage:
              'repeating-conic-gradient(rgba(29,29,31,1) 0% 25%, transparent 0% 50%)',
            backgroundSize: '9px 9px',
            opacity: 0.035,
            maskImage:
              'radial-gradient(ellipse 100% 100% at 100% 100%, black 15%, transparent 68%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 100% 100% at 100% 100%, black 15%, transparent 68%)',
          }}
        />

        {/* ════════════════════════════════════════════════
            封面圖區
        ════════════════════════════════════════════════ */}
        <div className="h-52 overflow-hidden relative">

          {/* 頂部學科漸層色條（2px，視覺品牌標識） */}
          <div
            className="absolute top-0 inset-x-0 z-10"
            style={{ height: '2px', background: subject.gradient }}
          />

          {course.cover_image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="
                  w-full h-full object-cover
                  transition-transform duration-500
                  group-hover:scale-105
                "
              />
              {/* 底部漸層遮罩，平滑過渡到卡片內容 */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
            </>
          ) : (
            /* ── GT 幾何點陣佔位封面 ── */
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3 relative"
              style={{ background: 'linear-gradient(145deg, #EEF3F7 0%, #DFE9F0 100%)' }}
            >
              {/* 底層：學科色點陣 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle, ${subject.glow} 1.2px, transparent 1.2px)`,
                  backgroundSize: '18px 18px',
                }}
              />
              {/* 前景：GT 速度感 45° 斜線 */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #1D1D1F 0px, #1D1D1F 1px, transparent 1px, transparent 12px)',
                }}
              />
              {/* 中心 Icon */}
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: subject.bg }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={subject.color} strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <span className="relative text-[11px] font-medium tracking-wide" style={{ color: '#AEAEB2' }}>
                課程封面
              </span>
            </div>
          )}

          {/* FREE 角標 */}
          {course.price === 0 && (
            <div
              className="absolute top-4 left-4 z-10 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-sm"
              style={{ backgroundColor: '#34C759', color: '#fff' }}
            >
              FREE
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════
            卡片內容區
        ════════════════════════════════════════════════ */}
        <div className="relative z-10 p-6 flex flex-col gap-3">

          {/* 學科 Badge */}
          <div>
            <span
              className="
                inline-flex items-center gap-1.5
                text-[11px] font-semibold tracking-wide
                px-2.5 py-1 rounded-full
              "
              style={{ color: subject.color, backgroundColor: subject.bg }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              {subject.label}
            </span>
          </div>

          {/* 課程名稱 */}
          <h2
            className="
              text-base font-semibold leading-snug tracking-tight
              transition-colors duration-300
              group-hover:text-[#6D97B6]
            "
            style={{ color: 'var(--text-primary)' }}
          >
            {course.title}
          </h2>

          {/* 課程簡介 */}
          {course.description && (
            <p
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {course.description}
            </p>
          )}

          {/* 分隔線 + 價格行 */}
          <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span
              className="text-xl font-bold tabular-nums tracking-tight"
              style={{ color: course.price === 0 ? '#34C759' : 'var(--text-primary)' }}
            >
              {formatPrice(course.price)}
            </span>
          </div>

          {/* ── 儀表板精緻 CTA 按鈕（學科色漸層 + hover 增亮） ── */}
          <Link
            href={`/dashboard/explore/${course.id}`}
            className="
              block w-full py-3 mt-1
              rounded-3xl
              text-sm font-semibold text-white text-center
              transition-all duration-300 ease-out
              hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg
              active:translate-y-0 active:brightness-100
            "
            style={{
              background: subject.gradient,
              boxShadow: `0 4px 14px ${subject.glow}`,
            }}
          >
            查看課程詳情&nbsp;→
          </Link>

        </div>
      </div>
    </div>
  )
}
