/**
 * src/lib/ecpay.ts
 *
 * 綠界科技 (ECPay) 加密工具箱
 * ────────────────────────────────────────────────────────────
 * 實作綠界全方位金流 AIO API v5 的 CheckMacValue 簽章演算法：
 *   1. 參數依字典順序 (A-Z) 排序
 *   2. 組裝 key=value&key=value 字串
 *   3. 前後包夾 HashKey / HashIV
 *   4. ECPay 特規 URL Encode（相容 .NET HttpUtility.UrlEncode）
 *   5. 轉小寫
 *   6. SHA256 雜湊 → 轉大寫
 *
 * 環境變數（.env.local）：
 *   ECPAY_MERCHANT_ID  — 特店編號（測試預設：2000132）
 *   ECPAY_HASH_KEY     — HashKey（測試預設：5294y06JbISpM5x9）
 *   ECPAY_HASH_IV      — HashIV（測試預設：v77hoKGq4kWxNNIS）
 *   ECPAY_IS_PRODUCTION— 設為 "true" 時切換至正式環境 API
 *   NEXT_PUBLIC_SITE_URL — 本站公開 URL（用於組裝 ReturnURL）
 *
 * ⚠️ server-only：此模組含敏感金鑰，禁止在 Client Component import
 */
import 'server-only'
import crypto from 'node:crypto'

// ── 環境變數（含測試環境預設值）──────────────────────────────────────────────
//
// 綠界官方測試特店資料（來源：ECPay 技術文件 §2.1）
// 正式上線前請務必替換為真實商家帳號的 Merchant ID / HashKey / HashIV
//
export const ECPAY_MERCHANT_ID  = process.env.ECPAY_MERCHANT_ID  ?? '2000132'
export const ECPAY_HASH_KEY     = process.env.ECPAY_HASH_KEY     ?? '5294y06JbISpM5x9'
export const ECPAY_HASH_IV      = process.env.ECPAY_HASH_IV      ?? 'v77hoKGq4kWxNNIS'
const        IS_PRODUCTION      = process.env.ECPAY_IS_PRODUCTION === 'true'

// ── 綠界 API 端點 ─────────────────────────────────────────────────────────────
export const ECPAY_STAGE_URL = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
export const ECPAY_PROD_URL  = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
export const ECPAY_API_URL   = IS_PRODUCTION ? ECPAY_PROD_URL : ECPAY_STAGE_URL

// ── 綠界付款參數型別 ──────────────────────────────────────────────────────────

/** 傳入 generateCheckMacValue 的完整參數集（不含 CheckMacValue 本身） */
export type EcpayParams = {
  MerchantID:       string
  MerchantTradeNo:  string   // 最長 20 碼，英數字，必須全局唯一
  MerchantTradeDate:string   // yyyy/MM/dd HH:mm:ss（台灣時間 UTC+8）
  PaymentType:      'aio'
  TotalAmount:      string   // 整數字串，新台幣
  TradeDesc:        string   // 交易描述，會顯示在綠界付款頁
  ItemName:         string   // 商品名稱，多項以 # 分隔
  ReturnURL:        string   // 金流通知 Webhook URL（後端接收）
  ChoosePayment:    'Credit' | 'ALL' | 'WebATM' | 'ATM' | 'CVS' | 'BARCODE'
  EncryptType:      '1'      // 固定為 '1'（SHA256）
  ClientBackURL?:   string   // 付款完成後導向的前端頁面（選填）
  OrderResultURL?:  string   // 客端接收付款結果（選填）
  [key: string]:    string | undefined
}

/** generateCheckoutParams 回傳：帶有 CheckMacValue 的完整參數 */
export type EcpayCheckoutPayload = {
  apiUrl:  string
  params:  Record<string, string>  // 含 CheckMacValue，可直接 POST 到 apiUrl
}

// ── 核心：ECPay 特規 URL Encode ───────────────────────────────────────────────
/**
 * 模擬 .NET `HttpUtility.UrlEncode` 行為
 *
 * 與標準 `encodeURIComponent` 的差異：
 *   · 空白 (%20) → '+' （.NET UrlEncode 使用 + 而非 %20）
 *   · 其餘需還原的字元（-, _, ., !, *, (, )）
 *     encodeURIComponent 本身不編碼這些字元，替換為防禦性保留
 *
 * 參考：綠界技術文件「CheckMacValue 計算方式」附錄
 */
function ecpayUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/gi, '+')   // 空白：%20 → +
    .replace(/%2D/gi, '-')   // 連字號
    .replace(/%5F/gi, '_')   // 底線
    .replace(/%2E/gi, '.')   // 小數點
    .replace(/%21/gi, '!')   // 驚嘆號
    .replace(/%2A/gi, '*')   // 星號
    .replace(/%28/gi, '(')   // 左括號
    .replace(/%29/gi, ')')   // 右括號
}

// ── 核心：CheckMacValue 產生器 ────────────────────────────────────────────────
/**
 * generateCheckMacValue
 *
 * 嚴格遵循綠界 SHA256 簽章演算法（EncryptType=1）：
 *
 * Step 1  參數依 Key 字典順序 (A-Z，大小寫不分) 排序
 * Step 2  組裝為 Key1=Value1&Key2=Value2... 字串
 * Step 3  前加 HashKey=...&，後加 &HashIV=...
 * Step 4  ECPay 特規 URL Encode（空白→+，其餘保留）
 * Step 5  全部轉為小寫
 * Step 6  SHA256 雜湊，輸出轉為大寫
 *
 * @param params  付款參數物件（不含 CheckMacValue）
 * @param hashKey 綠界 HashKey（預設讀取 ECPAY_HASH_KEY 環境變數）
 * @param hashIV  綠界 HashIV（預設讀取 ECPAY_HASH_IV 環境變數）
 * @returns       大寫 SHA256 CheckMacValue
 *
 * @example
 * const cmv = generateCheckMacValue({ MerchantID: '2000132', ... })
 * // => 'A1B2C3D4...'（64 碼大寫十六進位）
 */
export function generateCheckMacValue(
  params:  Record<string, string>,
  hashKey: string = ECPAY_HASH_KEY,
  hashIV:  string = ECPAY_HASH_IV,
): string {
  // Step 1：字典順序排序（忽略大小寫）
  const sorted = Object.entries(params).sort(
    ([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()),
  )

  // Step 2：組裝 key=value 字串
  const paramString = sorted.map(([k, v]) => `${k}=${v}`).join('&')

  // Step 3：包夾 HashKey / HashIV
  const raw = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`

  // Step 4：ECPay 特規 URL Encode
  const encoded = ecpayUrlEncode(raw)

  // Step 5：轉小寫
  const lower = encoded.toLowerCase()

  // Step 6：SHA256 → 大寫
  return crypto.createHash('sha256').update(lower, 'utf8').digest('hex').toUpperCase()
}

// ── 輔助：驗證回傳 CheckMacValue（供 Webhook 驗簽使用）────────────────────────
/**
 * verifyCheckMacValue
 *
 * 用於驗證綠界 ReturnURL Webhook 回傳的簽章是否合法。
 * 使用方式：從 POST body 中取出所有欄位，排除 CheckMacValue 後重新計算，
 * 並與回傳的 CheckMacValue 進行比較。
 *
 * @param params            綠界回傳的完整參數（含 CheckMacValue）
 * @param receivedMacValue  從回傳中取出的 CheckMacValue
 * @returns                 驗簽結果（true = 合法）
 *
 * @example
 * const isValid = verifyCheckMacValue(body, body.CheckMacValue)
 */
export function verifyCheckMacValue(
  params:            Record<string, string>,
  receivedMacValue:  string,
  hashKey:           string = ECPAY_HASH_KEY,
  hashIV:            string = ECPAY_HASH_IV,
): boolean {
  // 複製並移除 CheckMacValue 本身，避免參與計算
  const { CheckMacValue: _, ...rest } = params
  const computed = generateCheckMacValue(rest, hashKey, hashIV)

  // 使用 timingSafeEqual 防止 Timing Attack
  const a = Buffer.from(computed,         'utf8')
  const b = Buffer.from(receivedMacValue, 'utf8')

  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// ── 輔助：產生台灣時間格式的交易日期 ─────────────────────────────────────────
/**
 * getMerchantTradeDate
 * 回傳綠界要求格式：yyyy/MM/dd HH:mm:ss（台灣時間 UTC+8）
 */
export function getMerchantTradeDate(): string {
  const now = new Date()
  // 台灣為 UTC+8，手動偏移（不依賴系統時區）
  const tw  = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${tw.getUTCFullYear()}/` +
    `${pad(tw.getUTCMonth() + 1)}/` +
    `${pad(tw.getUTCDate())} ` +
    `${pad(tw.getUTCHours())}:` +
    `${pad(tw.getUTCMinutes())}:` +
    `${pad(tw.getUTCSeconds())}`
  )
}

// ── 輔助：產生唯一 MerchantTradeNo ───────────────────────────────────────────
/**
 * generateMerchantTradeNo
 *
 * 規則：orderId（UUID 去除連字號）前 14 碼（大寫） + 時間戳 base36 後 6 碼（大寫）
 * 總長：20 碼（英數字，符合綠界規範）
 *
 * 每次呼叫均產生不同結尾（毫秒時間戳），
 * 確保同一訂單重試付款時不重複使用相同 MerchantTradeNo。
 *
 * @example
 * generateMerchantTradeNo('550e8400-e29b-41d4-a716-446655440000')
 * // => '550E8400E29B41QS5S2G'
 */
export function generateMerchantTradeNo(orderId: string): string {
  const uuidPart      = orderId.replace(/-/g, '').slice(0, 14).toUpperCase()
  const timestampPart = Date.now().toString(36).slice(-6).toUpperCase()
  return `${uuidPart}${timestampPart}`
}
