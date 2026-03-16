import Link from 'next/link'

// ── 課程型別（由此統一 export，explore page 直接 import） ──────
export type Course = {
  id: string
  title: string
  description: string | null
  price: number | null
  cover_image_url: string | null
  created_at: string
}

// ── 工具函式 ─────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price == null) return '洽詢價格'
  if (price === 0)   return '免費'
  return 'NT$ ' + price.toLocaleString('zh-TW')
}

/**
 * 根據課程標題關鍵字推斷學科，回傳品牌色設定
 * · 數學 → 品牌灰藍  #6D97B6
 * · 國文 → 磚紅      #C8474B
 * · 英文 → 森林綠    #597E5B
 * · 其他 → 預設灰藍  #6D97B6
 */
function getSubjectStyle(title: string) {
  const t = title
  if (t.includes('數學') || t.toLowerCase().includes('math'))
    return { label: '數學', color: '#6D97B6', bg: 'rgba(109,151,182,0.12)' }
  if (t.includes('國文') || t.includes('語文') || t.includes('寫作') || t.includes('作文'))
    return { label: '國文', color: '#C8474B', bg: 'rgba(200,71,75,0.10)' }
  if (t.includes('英文') || t.includes('英語') || t.toLowerCase().includes('english'))
    return { label: '英文', color: '#597E5B', bg: 'rgba(89,126,91,0.10)' }
  return { label: '課程', color: '#6D97B6', bg: 'rgba(109,151,182,0.10)' }
}

// ── CourseCard 主組件 ─────────────────────────────────────────
/**
 * 課程卡片 — v1.2.x 視覺重塑
 * ─────────────────────────────────────────────────────────
 * · rounded-3xl 極大圓角 (Apple 美學)
 * · hover:-translate-y-2 + shadow-2xl (GT 加速感)
 * · 封面 placeholder 套用 GT 幾何點陣 + 速度斜線
 * · 學科色標籤 Badge (數學/國文/英文)
 * · 儀表板精緻 CTA 按鈕
 */
export default function CourseCard({ course }: { course: Course }) {
  const subject = getSubjectStyle(course.title)

  return (
    <div
      className="
        group relative rounded-3xl overflow-hidden
        hover:-translate-y-2 hover:shadow-2xl
        transition-all duration-300 ease-out
      "
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >

      {/* ════════════════════════════════════════════════
          封面圖區
      ════════════════════════════════════════════════ */}
      <div className="h-52 overflow-hidden relative">
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
            style={{
              background: 'linear-gradient(145deg, #EEF3F7 0%, #DFE9F0 100%)',
            }}
          >
            {/* 底層：GT 方格旗幾何點陣 */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(109,151,182,0.20) 1.2px, transparent 1.2px)',
                backgroundSize: '18px 18px',
              }}
            />
            {/* 前景：GT 速度感 45° 斜線 */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #1D1D1F 0px, #1D1D1F 1px, transparent 1px, transparent 12px)',
              }}
            />
            {/* 中心 Icon */}
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(109,151,182,0.16)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6D97B6" strokeWidth="1.5">
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
            className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-sm"
            style={{ backgroundColor: '#34C759', color: '#fff' }}
          >
            FREE
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          卡片內容區
      ════════════════════════════════════════════════ */}
      <div className="p-6 flex flex-col gap-3">

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
            {/* 學科色指示點 */}
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
            className="text-sm leading-relaxed line-clamp-2 transition-colors duration-300"
            style={{ color: 'var(--text-secondary)' }}
          >
            {course.description}
          </p>
        )}

        {/* 分隔線 + 價格行 */}
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span
            className="text-xl font-bold tabular-nums tracking-tight transition-colors duration-300"
            style={{ color: course.price === 0 ? '#34C759' : 'var(--text-primary)' }}
          >
            {formatPrice(course.price)}
          </span>
        </div>

        {/* ── 儀表板精緻 CTA 按鈕 ── */}
        <Link
          href={`/dashboard/explore/${course.id}`}
          className="
            block w-full py-3
            rounded-3xl
            text-sm font-semibold text-white text-center
            transition-all duration-300 ease-out
            hover:-translate-y-0.5 hover:shadow-lg
            active:translate-y-0 active:shadow-md
          "
          style={{
            backgroundColor: '#6D97B6',
            boxShadow: '0 4px 14px rgba(109,151,182,0.28)',
          }}
        >
          查看課程詳情&nbsp;→
        </Link>

      </div>
    </div>
  )
}
