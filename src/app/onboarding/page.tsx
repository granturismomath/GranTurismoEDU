'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// ── 縣市／行政區範例資料（後續可擴充完整版）──
const CITY_DISTRICT_MAP: Record<string, string[]> = {
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "台北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  "新北市": ["萬里區", "金山區", "板橋區", "汐止區", "深坑區", "石碇區", "瑞芳區", "平溪區", "雙溪區", "貢寮區", "新店區", "坪林區", "烏來區", "永和區", "中和區", "土城區", "三峽區", "樹林區", "鶯歌區", "三重區", "新莊區", "泰山區", "林口區", "蘆洲區", "五股區", "八里區", "淡水區", "三芝區", "石門區"],
  "桃園市": ["中壢區", "平鎮區", "龍潭區", "楊梅區", "新屋區", "觀音區", "桃園區", "龜山區", "八德區", "大溪區", "復興區", "大園區", "蘆竹區"],
  "新竹市": ["東區", "北區", "香山區"],
  "新竹縣": ["竹北市", "湖口鄉", "新豐鄉", "新埔鎮", "關西鎮", "芎林鄉", "寶山鄉", "竹東鎮", "五峰鄉", "橫山鄉", "尖石鄉", "北埔鄉", "峨眉鄉"],
  "苗栗縣": ["竹南鎮", "頭份市", "三灣鄉", "南庄鄉", "獅潭鄉", "後龍鎮", "通霄鎮", "苑裡鎮", "苗栗市", "造橋鄉", "頭屋鄉", "公館鄉", "大湖鄉", "泰安鄉", "銅鑼鄉", "三義鄉", "西湖鄉", "卓蘭鎮"],
  "台中市": ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "石岡區", "東勢區", "和平區", "新社區", "潭子區", "大雅區", "神岡區", "大肚區", "沙鹿區", "龍井區", "梧棲區", "清水區", "大甲區", "外埔區", "大安區"],
  "彰化縣": ["彰化市", "芬園鄉", "花壇鄉", "秀水鄉", "鹿港鎮", "福興鄉", "線西鄉", "和美鎮", "伸港鄉", "員林市", "社頭鄉", "永靖鄉", "埔心鄉", "溪湖鎮", "大村鄉", "埔鹽鄉", "田中鎮", "北斗鎮", "田尾鄉", "埤頭鄉", "溪州鄉", "竹塘鄉", "二林鎮", "大城鄉", "芳苑鄉", "二水鄉"],
  "南投縣": ["南投市", "中寮鄉", "草屯鎮", "國姓鄉", "埔里鎮", "仁愛鄉", "名間鄉", "集集鎮", "水里鄉", "魚池鄉", "信義鄉", "竹山鎮", "鹿谷鄉"],
  "雲林縣": ["斗南鎮", "大埤鄉", "虎尾鎮", "土庫鎮", "褒忠鄉", "東勢鄉", "臺西鄉", "崙背鄉", "麥寮鄉", "斗六市", "林內鄉", "古坑鄉", "莿桐鄉", "西螺鎮", "二崙鄉", "北港鎮", "水林鄉", "口湖鄉", "四湖鄉", "元長鄉"],
  "嘉義市": ["東區", "西區"],
  "嘉義縣": ["番路鄉", "梅山鄉", "竹崎鄉", "阿里山鄉", "中埔鄉", "大埔鄉", "水上鄉", "鹿草鄉", "太保市", "朴子市", "東石鄉", "六腳鄉", "新港鄉", "民雄鄉", "大林鎮", "溪口鄉", "義竹鄉", "布袋鎮"],
  "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "東沙群島", "南沙群島", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區", "茄萣區"],
  "屏東縣": ["屏東市", "三地門鄉", "霧臺鄉", "瑪家鄉", "九如鄉", "里港鄉", "高樹鄉", "鹽埔鄉", "長治鄉", "麟洛鄉", "竹田鄉", "內埔鄉", "萬丹鄉", "潮州鎮", "泰武鄉", "來義鄉", "萬巒鄉", "崁頂鄉", "新埤鄉", "南州鄉", "林邊鄉", "東港鎮", "琉球鄉", "佳冬鄉", "新園鄉", "枋寮鄉", "枋山鄉", "春日鄉", "獅子鄉", "車城鄉", "牡丹鄉", "恆春鎮", "滿州鄉"],
  "宜蘭縣": ["宜蘭市", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "羅東鎮", "三星鄉", "大同鄉", "五結鄉", "冬山鄉", "蘇澳鎮", "南澳鄉"],
  "花蓮縣": ["花蓮市", "新城鄉", "秀林鄉", "吉安鄉", "壽豐鄉", "鳳林鎮", "光復鄉", "豐濱鄉", "瑞穗鄉", "萬榮鄉", "玉里鎮", "卓溪鄉", "富里鄉"],
  "台東縣": ["臺東市", "綠島鄉", "蘭嶼鄉", "延平鄉", "卑南鄉", "鹿野鄉", "關山鎮", "海端鄉", "池上鄉", "東河鄉", "成功鎮", "長濱鄉", "太麻里鄉", "金峰鄉", "大武鄉", "達仁鄉"],
  "澎湖縣": ["馬公市", "西嶼鄉", "望安鄉", "七美鄉", "白沙鄉", "湖西鄉"],
  "金門縣": ["金沙鎮", "金湖鎮", "金寧鄉", "金城鎮", "烈嶼鄉", "烏坵鄉"],
  "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};

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
  const [birthYear,  setBirthYear]  = useState('') // birth_date (年)
  const [birthMonth, setBirthMonth] = useState('') // birth_date (月)
  const [birthDay,   setBirthDay]   = useState('') // birth_date (日)
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
      // 組合生日：三欄皆有值才寫入，否則為 null
      const birthDate = birthYear && birthMonth && birthDay
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : null

      const { error } = await supabase
        .from('users')
        .update({
          parent_name: field_A || null,
          student_name: field_B || null,
          phone: field_C || null,
          birth_date: birthDate,
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

            {/* field_C：聯絡電話（單欄） */}
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

            {/* 學生出生日期：年 / 月 / 日 三欄 select */}
            <div>
              <label className={labelClass} style={{ color: '#6E6E73' }}>學生出生日期</label>
              <div className="grid grid-cols-3 gap-3">
                {/* 年 */}
                <div className="relative">
                  <select
                    value={birthYear}
                    onChange={e => setBirthYear(e.target.value)}
                    className={selectClass}
                    style={{ color: birthYear ? '#1D1D1F' : '#C7C7CC' }}
                  >
                    <option value="" disabled>年</option>
                    {Array.from({ length: 31 }, (_, i) => 2020 - i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
                {/* 月 */}
                <div className="relative">
                  <select
                    value={birthMonth}
                    onChange={e => setBirthMonth(e.target.value)}
                    className={selectClass}
                    style={{ color: birthMonth ? '#1D1D1F' : '#C7C7CC' }}
                  >
                    <option value="" disabled>月</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={String(m)}>{m} 月</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
                {/* 日 */}
                <div className="relative">
                  <select
                    value={birthDay}
                    onChange={e => setBirthDay(e.target.value)}
                    className={selectClass}
                    style={{ color: birthDay ? '#1D1D1F' : '#C7C7CC' }}
                  >
                    <option value="" disabled>日</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d)}>{d} 日</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#AEAEB2] text-xs">▼</span>
                </div>
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
