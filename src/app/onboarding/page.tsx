'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { completeOnboarding } from './actions'
import { ThemeToggleMini } from '@/components/ThemeToggleMini'

// ── 台灣全區縣市完整資料庫 ───────────────────────────────
const TAIWAN_REGIONS: Record<string, string[]> = {
  '台北市': ['中正區', '大安區', '信義區', '中山區', '松山區', '內湖區', '南港區', '士林區', '北投區', '文山區', '大同區', '萬華區'],
  '新北市': ['板橋區', '中和區', '永和區', '新莊區', '三重區', '蘆洲區', '新店區', '汐止區', '淡水區', '林口區', '樹林區', '鶯歌區', '三峽區', '土城區', '瑞芳區', '五股區', '泰山區', '八里區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '金山區', '萬里區', '平溪區', '雙溪區', '貢寮區', '烏來區'],
  '基隆市': ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
  '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龜山區', '大園區', '觀音區', '新屋區', '龍潭區', '復興區'],
  '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '芎林鄉', '橫山鄉', '北埔鄉', '寶山鄉', '峨眉鄉', '尖石鄉', '五峰鄉'],
  '新竹市': ['東區', '北區', '香山區'],
  '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '卓蘭鎮', '造橋鄉', '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉', '南庄鄉', '泰安鄉'],
  '台中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區', '霧峰區', '烏日區', '豐原區', '后里區', '石岡區', '東勢區', '和平區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區'],
  '彰化縣': ['彰化市', '員林市', '和美鎮', '鹿港鎮', '溪湖鎮', '二林鎮', '田中鎮', '北斗鎮', '花壇鄉', '芬園鄉', '大村鄉', '埔心鄉', '埔鹽鄉', '秀水鄉', '福興鄉', '線西鄉', '伸港鄉', '社頭鄉', '二水鄉', '田尾鄉', '埤頭鄉', '芳苑鄉', '大城鄉', '竹塘鄉', '溪州鄉'],
  '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉', '仁愛鄉'],
  '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '古坑鄉', '大埤鄉', '莿桐鄉', '林內鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '東勢鄉', '褒忠鄉', '臺西鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉'],
  '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
  '嘉義市': ['東區', '西區'],
  '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
  '高雄市': ['楠梓區', '左營區', '鼓山區', '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '旗津區', '小港區', '鳳山區', '林園區', '大寮區', '大樹區', '大社區', '仁武區', '鳥松區', '岡山區', '橋頭區', '燕巢區', '田寮區', '阿蓮區', '路竹區', '湖內區', '茄萣區', '永安區', '彌陀區', '梓官區', '旗山區', '美濃區', '六龜區', '甲仙區', '杉林區', '內門區', '茂林區', '桃源區', '那瑪夏區'],
  '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '竹田鄉', '新埤鄉', '枋寮鄉', '新園鄉', '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋山鄉', '三地門鄉', '霧臺鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉'],
  '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
  '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
  '台東縣': ['臺東市', '成功鎮', '關山鎮', '卑南鄉', '大武鄉', '太麻里鄉', '東河鄉', '長濱鄉', '鹿野鄉', '池上鄉', '綠島鄉', '延平鄉', '海端鄉', '達仁鄉', '金峰鄉', '蘭嶼鄉'],
  '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
  '金門縣': ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
  '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
}
const CITIES = Object.keys(TAIWAN_REGIONS)

// ── 年級選項 (純淨版) ──────────────────────────────────────
const GRADE_OPTIONS = [
  { value: '',         label: '請選擇年級' },
  { value: 'elem_1',   label: '小學一年級' },
  { value: 'elem_2',   label: '小學二年級' },
  { value: 'elem_3',   label: '小學三年級' },
  { value: 'elem_4',   label: '小學四年級' },
  { value: 'elem_5',   label: '小學五年級' },
  { value: 'elem_6',   label: '小學六年級' },
  { value: 'junior_1', label: '國中一年級' },
  { value: 'junior_2', label: '國中二年級' },
  { value: 'junior_3', label: '國中三年級' },
  { value: 'senior_1', label: '高中一年級' },
  { value: 'senior_2', label: '高中二年級' },
  { value: 'senior_3', label: '高中三年級' },
]

// ── 性別選項 ────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: '',       label: '請選擇性別' },
  { value: 'male',   label: '男' },
  { value: 'female', label: '女' },
]

// ── 共用 Input 元件 ───────────────────────────────────────────
function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-widest uppercase transition-colors duration-300"
        style={{ color: 'var(--text-tertiary)' }}>
        {label}
        {required && <span className="ml-1" style={{ color: '#FF3B30' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

const SelectChevron = () => (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </div>
);

const inputStyle = {
  backgroundColor: 'var(--background)',
  borderColor:     'var(--border-subtle)',
  color:           'var(--text-primary)',
} as React.CSSProperties

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--brand)'
  e.target.style.boxShadow   = '0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent)'
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border-subtle)'
  e.target.style.boxShadow   = 'none'
}

// ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  // ── 基礎表單 state ──
  const [name,        setName]        = useState('')
  const [grade,       setGrade]       = useState('')
  const [gender,      setGender]      = useState('')
  const [school,      setSchool]      = useState('')
  const [parentName,  setParentName]  = useState('')
  const [parentPhone, setParentPhone] = useState('')

  // ── 動態日期 state ──
  const [bYear, setBYear] = useState('')
  const [bMonth, setBMonth] = useState('')
  const [bDay, setBDay] = useState('')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 25 }, (_, i) => currentYear - 5 - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const daysInMonth = bYear && bMonth ? new Date(Number(bYear), Number(bMonth), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // ── 縣市連動 state ──
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [mounted,      setMounted]      = useState(false)

  const { resolvedTheme } = useTheme()
  useEffect(() => { setMounted(true) }, [])

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo.png'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('請輸入學生姓名。'); return }
    if (!grade)       { setError('請選擇年級。'); return }

    const finalBirthday = (bYear && bMonth && bDay) ? `${bYear}-${bMonth.padStart(2, '0')}-${bDay.padStart(2, '0')}` : ''
    const finalDistrict = (city && area) ? `${city}${area}` : ''

    setIsSubmitting(true)
    try {
      const result = await completeOnboarding({
        name,
        grade,
        gender,
        birthday: finalBirthday,
        district: finalDistrict,
        school,
        parent_name:  parentName,
        parent_phone: parentPhone,
      })
      
      if (result && !result.success) {
        setError(result.error ?? '發生未知錯誤，請稍後再試。')
      }
    } catch {
      // redirect() 正常行為
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="relative min-h-screen flex items-start justify-center overflow-y-auto py-12 transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none select-none"
        style={{
          backgroundImage:    "url('/checkered-flag.png')",
          backgroundSize:     '160%',
          backgroundRepeat:   'no-repeat',
          backgroundPosition: '50% 30%',
          opacity: 0.04,
        }}
      />

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleMini variant="pill" />
      </div>

      <div className="fixed bottom-5 right-6 z-50 text-right leading-tight pointer-events-none">
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>GranTurismoEDU v1.2.0</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>PythaGodzillaCorp. © 2026</p>
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-4 my-4">
        <div
          className="rounded-3xl shadow-sm px-8 py-10 transition-colors duration-300"
          style={{
            backgroundColor: 'var(--card-bg)',
            border:          '1px solid var(--border-subtle)',
            boxShadow:       '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex justify-center mb-7">
            <Image src={logoSrc} alt="超跑教育 Logo" width={260} height={78}
              className="w-60 h-auto object-contain transition-opacity duration-300" priority />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight transition-colors duration-300"
              style={{ color: 'var(--text-primary)' }}>
              歡迎加入超跑教育
            </h1>
            <p className="text-sm mt-2 transition-colors duration-300"
              style={{ color: 'var(--text-secondary)' }}>
              請完成車手檔案，啟動你的專屬引擎
            </p>
          </div>

          <div className="mb-7 transition-colors duration-300"
            style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ─ Row 1: 學生姓名 + 年級 ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="學生姓名" required>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="請輸入學生姓名"
                  className="w-full p-4 rounded-2xl text-sm outline-none border transition-all duration-200"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <Field label="年級" required>
                <div className="relative">
                  <select value={grade} onChange={e => setGrade(e.target.value)}
                    className="w-full p-4 pr-10 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200"
                    style={{ ...inputStyle, color: grade ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    onFocus={focusIn} onBlur={focusOut}>
                    {GRADE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}
                        style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
                <p className="text-xs transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
                  💡 系統將於每年 7 月 1 日自動晉升年級
                </p>
              </Field>
            </div>

            {/* ─ Row 2: 性別 + 出生年月日 ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="性別">
                <div className="relative">
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full p-4 pr-10 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200"
                    style={{ ...inputStyle, color: gender ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    onFocus={focusIn} onBlur={focusOut}>
                    {GENDER_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}
                        style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </Field>
              
              <Field label="出生年月日">
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <select value={bYear} onChange={e => setBYear(e.target.value)} className="w-full py-4 pl-3 pr-8 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200" style={{ ...inputStyle, color: bYear ? 'var(--text-primary)' : 'var(--text-tertiary)' }} onFocus={focusIn} onBlur={focusOut}>
                      <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>年</option>
                      {years.map(y => <option key={y} value={y} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{y}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                  <div className="relative">
                    <select value={bMonth} onChange={e => setBMonth(e.target.value)} className="w-full py-4 pl-3 pr-8 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200" style={{ ...inputStyle, color: bMonth ? 'var(--text-primary)' : 'var(--text-tertiary)' }} onFocus={focusIn} onBlur={focusOut}>
                      <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>月</option>
                      {months.map(m => <option key={m} value={m} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{m}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                  <div className="relative">
                    <select value={bDay} onChange={e => setBDay(e.target.value)} className="w-full py-4 pl-3 pr-8 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200" style={{ ...inputStyle, color: bDay ? 'var(--text-primary)' : 'var(--text-tertiary)' }} onFocus={focusIn} onBlur={focusOut}>
                      <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>日</option>
                      {days.map(d => <option key={d} value={d} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{d}</option>)}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
              </Field>
            </div>

            {/* ─ Row 3: 縣市 + 區域 + 學校 (三分天下) ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="縣市">
                <div className="relative">
                  <select value={city} onChange={e => { setCity(e.target.value); setArea(''); }} className="w-full py-4 pl-4 pr-10 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200" style={{ ...inputStyle, color: city ? 'var(--text-primary)' : 'var(--text-tertiary)' }} onFocus={focusIn} onBlur={focusOut}>
                    <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>選擇縣市</option>
                    {CITIES.map(c => <option key={c} value={c} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{c}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </Field>

              <Field label="行政區">
                <div className="relative">
                  <select value={area} onChange={e => setArea(e.target.value)} disabled={!city} className="w-full py-4 pl-4 pr-10 rounded-2xl text-sm outline-none border appearance-none cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed" style={{ ...inputStyle, color: area ? 'var(--text-primary)' : 'var(--text-tertiary)' }} onFocus={focusIn} onBlur={focusOut}>
                    <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>選擇區域</option>
                    {city && TAIWAN_REGIONS[city].map(a => <option key={a} value={a} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{a}</option>)}
                  </select>
                  <SelectChevron />
                </div>
              </Field>

              <Field label="學校">
                <input type="text" value={school} onChange={e => setSchool(e.target.value)}
                  placeholder="例：○○國中"
                  className="w-full p-4 rounded-2xl text-sm outline-none border transition-all duration-200"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
            </div>

            {/* ─ Row 4: 家長姓名 + 家長聯絡電話 ─ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="家長姓名">
                <input type="text" value={parentName} onChange={e => setParentName(e.target.value)}
                  placeholder="請輸入家長姓名"
                  className="w-full p-4 rounded-2xl text-sm outline-none border transition-all duration-200"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <Field label="家長聯絡電話" hint="用於緊急聯繫，不會公開顯示">
                <input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)}
                  placeholder="09XX-XXX-XXX"
                  className="w-full p-4 rounded-2xl text-sm outline-none border transition-all duration-200"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <p className="text-xs text-center px-4 py-2.5 rounded-2xl transition-colors duration-300"
                style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}>
                {error}
              </p>
            )}

            {/* 提交按鈕 */}
            <div className="pt-4">
              <button type="submit" disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                style={{
                  backgroundColor: 'var(--brand)',
                  boxShadow:       '0 4px 14px color-mix(in srgb, var(--brand) 35%, transparent)',
                }}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    引擎啟動中...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    完成設定，開始探索
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </main>
  )
}