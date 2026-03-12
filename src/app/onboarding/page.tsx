'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ── 台灣縣市與行政區資料 ──
const CITY_DISTRICT_MAP: Record<string, string[]> = {
  台北市: ['大安區', '信義區', '中正區', '中山區', '松山區', '內湖區', '士林區', '北投區', '萬華區', '文山區', '南港區', '大同區'],
  新北市: ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區'],
  桃園市: ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '龜山區', '八德區', '龍潭區', '平鎮區', '大園區'],
  台中市: ['中區', '東區', '西區', '南區', '北區', '西屯區', '南屯區', '北屯區', '豐原區', '大里區', '太平區', '烏日區'],
  台南市: ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區'],
  高雄市: ['楠梓區', '左營區', '鼓山區', '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '鳳山區', '小港區'],
  基隆市: ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
  新竹市: ['東區', '北區', '香山區'],
  新竹縣: ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉'],
  苗栗縣: ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮'],
  彰化縣: ['彰化市', '員林市', '鹿港鎮', '和美鎮', '伸港鄉', '線西鄉'],
  南投縣: ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉'],
  雲林縣: ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮'],
  嘉義市: ['東區', '西區'],
  嘉義縣: ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉'],
  屏東縣: ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉'],
  宜蘭縣: ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉'],
  花蓮縣: ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉'],
  台東縣: ['台東市', '成功鎮', '關山鎮', '卑南鄉', '鹿野鄉', '池上鄉'],
  澎湖縣: ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
}

const GRADE_OPTIONS = ['國一', '國二', '國三', '高一', '高二', '高三', '其他']

const inputClass = `
  w-full px-5 py-3.5 rounded-3xl text-sm
  border border-black/[0.08] bg-white/60
  outline-none transition-all duration-200
  focus:border-[#6D97B6] focus:ring-2 focus:ring-[#6D97B6]/20
`

const selectClass = `
  w-full px-5 py-3.5 rounded-3xl text-sm
  border border-black/[0.08] bg-white/60
  outline-none transition-all duration-200
  focus:border-[#6D97B6] focus:ring-2 focus:ring-[#6D97B6]/20
  appearance-none cursor-pointer
`

const labelClass = 'block text-xs font-medium tracking-widest uppercase mb-1.5'

// 移至模組層級，避免 useEffect 依賴陣列的 ESLint 警告
const supabase = createClient()

export default function OnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── 表單 state ──
  const [field_A, setField_A] = useState('') // parent_name
  const [field_B, setField_B] = useState('') // student_name
  const [field_C, setField_C] = useState('') // phone
  const [field_D, setField_D] = useState('') // birth_date
  const [field_E, setField_E] = useState('') // city
  const [field_F, setField_F] = useState('') // district
  const [field_G, setField_G] = useState('') // school
  const [field_H, setField_H] = useState('') // grade

  // 切換城市時同步清空區域選項
  const handleCityChange = (value: string) => {
    setField_E(value)
    setField_F('')
  }

  // ── 取得登入使用者 id ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
      else router.push('/login')
    })
  }, [])

  // ── 送出表單 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          parent_name: field_A || null,
          student_name: field_B || null,
          phone: field_C || null,
          birth_date: field_D || null,
          city: field_E || null,
          district: field_F || null,
          school: field_G || null,
          grade: field_H || null,
          onboarding_completed: true,
        })
        .eq('id', userId)

      if (error) {
        setError('資料儲存失敗，請稍後再試。')
        return
      }
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const districts = field_E ? (CITY_DISTRICT_MAP[field_E] ?? []) : []

  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-12"
      style={{ backgroundColor: '#F5F5F7' }}
    >
      {/* ── 背景：方格旗底紋 ── */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: "url('/checkered-flag.png')",
          backgroundSize: '160%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '50% 30%',
          opacity: 0.04,
        }}
      />

      {/* ── 表單容器 ── */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-sm border border-white/60 px-8 py-10">

          {/* 頁首 */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#1D1D1F' }}>
              完善學員資料
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6E6E73' }}>
              請填寫以下資訊，幫助我們提供最適合的學習規劃。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* field_A：家長姓名 / field_B：學生姓名 — 並排 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>家長姓名</label>
                <input
                  type="text"
                  value={field_A}
                  onChange={e => setField_A(e.target.value)}
                  placeholder="王小明"
                  className={inputClass}
                  style={{ color: '#1D1D1F' }}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>學生姓名</label>
                <input
                  type="text"
                  value={field_B}
                  onChange={e => setField_B(e.target.value)}
                  placeholder="王小華"
                  className={inputClass}
                  style={{ color: '#1D1D1F' }}
                />
              </div>
            </div>

            {/* field_C：聯絡電話 / field_D：出生日期 — 並排 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>聯絡電話</label>
                <input
                  type="tel"
                  value={field_C}
                  onChange={e => setField_C(e.target.value)}
                  placeholder="09xx-xxx-xxx"
                  className={inputClass}
                  style={{ color: '#1D1D1F' }}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>出生日期</label>
                <input
                  type="date"
                  value={field_D}
                  onChange={e => setField_D(e.target.value)}
                  className={inputClass}
                  style={{ color: '#1D1D1F' }}
                />
              </div>
            </div>

            {/* field_E：居住城市 / field_F：居住區域 — 並排，連動 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>居住城市</label>
                <div className="relative">
                  <select
                    value={field_E}
                    onChange={e => handleCityChange(e.target.value)}
                    className={selectClass}
                    style={{ color: field_E ? '#1D1D1F' : '#C7C7CC' }}
                  >
                    <option value="" disabled>請選擇</option>
                    {Object.keys(CITY_DISTRICT_MAP).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>居住區域</label>
                <div className="relative">
                  <select
                    value={field_F}
                    onChange={e => setField_F(e.target.value)}
                    disabled={!field_E}
                    className={selectClass}
                    style={{ color: field_F ? '#1D1D1F' : '#C7C7CC', opacity: field_E ? 1 : 0.5 }}
                  >
                    <option value="" disabled>{field_E ? '請選擇' : '先選城市'}</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
              </div>
            </div>

            {/* field_G：就讀學校 / field_H：年級 — 並排 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>就讀學校</label>
                <input
                  type="text"
                  value={field_G}
                  onChange={e => setField_G(e.target.value)}
                  placeholder="○○國中"
                  className={inputClass}
                  style={{ color: '#1D1D1F' }}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: '#6E6E73' }}>目前年級</label>
                <div className="relative">
                  <select
                    value={field_H}
                    onChange={e => setField_H(e.target.value)}
                    className={selectClass}
                    style={{ color: field_H ? '#1D1D1F' : '#C7C7CC' }}
                  >
                    <option value="" disabled>請選擇</option>
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
              </div>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <p
                className="text-xs text-center px-4 py-2.5 rounded-2xl"
                style={{ color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.08)' }}
              >
                {error}
              </p>
            )}

            {/* 送出按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 rounded-3xl text-sm font-semibold text-white mt-2
                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-md hover:brightness-105
                active:translate-y-0 active:shadow-sm active:brightness-95
                disabled:opacity-60 disabled:cursor-not-allowed
                disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100
              "
              style={{ backgroundColor: '#6D97B6' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  資料建立中...
                </span>
              ) : (
                '完成設定，進入儀表板'
              )}
            </button>

          </form>
        </div>
      </div>
    </main>
  )
}
