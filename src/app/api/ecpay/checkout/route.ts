/**
 * POST /api/ecpay/checkout
 *
 * 綠界付款初始化 Route Handler
 * ────────────────────────────────────────────────────────────
 * 接收前端的 orderId，組裝綠界 AIO 全方位金流必填參數、
 * 計算 CheckMacValue 簽章，回傳給前端動態建立隱藏表單並送出。
 *
 * 安全流程：
 *   S1  驗證 Auth（auth.getUser，不可偽造）
 *   S2  解析並驗證請求 Body（orderId）
 *   S3  從 DB 讀取訂單（join courses 取得課程名稱）
 *   S4  驗證訂單歸屬（user_id 必須等於登入者）
 *   S5  驗證訂單狀態（必須為 pending）
 *   S6  產生唯一 MerchantTradeNo，更新 DB
 *   S7  組裝 ECPay 參數，計算 CheckMacValue
 *   S8  回傳 { apiUrl, params }
 *
 * 前端收到後：動態建立隱藏 form → POST 至 apiUrl → 導向綠界付款頁
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  ECPAY_MERCHANT_ID,
  ECPAY_API_URL,
  generateCheckMacValue,
  generateMerchantTradeNo,
  getMerchantTradeDate,
  type EcpayCheckoutPayload,
} from '@/lib/ecpay'

// ── 型別定義 ──────────────────────────────────────────────────────────────────

/** 前端 POST 請求的 Body 格式 */
type RequestBody = {
  orderId: string
}

/** Supabase join 查詢結果型別 */
type OrderWithCourse = {
  id:         string
  amount:     number
  status:     string
  user_id:    string
  courses:    { title: string } | null
}

/** 路由回傳的成功 JSON 格式 */
type CheckoutResponse = EcpayCheckoutPayload

/** 路由回傳的錯誤 JSON 格式 */
type ErrorResponse = {
  error:  string
  code?:  string
}

// ── 環境變數 ──────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// 金流通知 Webhook（後端非同步接收）：必須為公開 HTTPS URL
// 測試環境可用 ngrok / Vercel Preview URL
const RETURN_URL      = `${SITE_URL}/api/ecpay/callback`

// 付款完成後使用者在綠界側點「返回商店」的前端頁面
const CLIENT_BACK_URL = `${SITE_URL}/dashboard/my-courses`

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
): Promise<NextResponse<CheckoutResponse | ErrorResponse>> {
  try {
    const supabase = await createClient()

    // ── S1：驗證 Auth 身份 ────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '身份驗證失敗，請重新登入。', code: 'UNAUTHENTICATED' },
        { status: 401 },
      )
    }

    // ── S2：解析並驗證請求 Body ───────────────────────────────────────────────
    let body: Partial<RequestBody>
    try {
      body = await request.json() as Partial<RequestBody>
    } catch {
      return NextResponse.json(
        { error: '請求格式錯誤，Body 必須為 JSON。', code: 'INVALID_BODY' },
        { status: 400 },
      )
    }

    const orderId = body.orderId?.trim()
    if (!orderId) {
      return NextResponse.json(
        { error: '缺少必填欄位：orderId。', code: 'MISSING_ORDER_ID' },
        { status: 400 },
      )
    }

    // ── S3：從 DB 讀取訂單（JOIN courses 取課程名稱）─────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        status,
        user_id,
        courses ( title )
      `)
      .eq('id', orderId)
      .single<OrderWithCourse>()

    if (orderError || !order) {
      return NextResponse.json(
        { error: '訂單不存在，請重新操作。', code: 'ORDER_NOT_FOUND' },
        { status: 404 },
      )
    }

    // ── S4：驗證訂單歸屬（防止越權讀取他人訂單）─────────────────────────────
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: '無權存取此訂單。', code: 'FORBIDDEN' },
        { status: 403 },
      )
    }

    // ── S5：驗證訂單狀態（只有 pending 可初始化付款）─────────────────────────
    if (order.status === 'paid') {
      return NextResponse.json(
        { error: '此訂單已完成付款，請前往「我的課程」。', code: 'ALREADY_PAID' },
        { status: 409 },
      )
    }
    if (order.status === 'failed' || order.status === 'refunded') {
      return NextResponse.json(
        {
          error: `訂單狀態為 ${order.status}，無法進行付款。請重新建立訂單。`,
          code:  'INVALID_ORDER_STATUS',
        },
        { status: 409 },
      )
    }
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: '訂單狀態異常，請聯絡客服。', code: 'INVALID_ORDER_STATUS' },
        { status: 409 },
      )
    }

    // ── S6：產生唯一 MerchantTradeNo，並回寫至 DB ────────────────────────────
    //
    // 每次初始化付款均產生新的 MerchantTradeNo（含毫秒時間戳），
    // 確保使用者重試付款時不重複使用舊的交易編號（ECPay 不允許重複）。
    //
    const merchantTradeNo = generateMerchantTradeNo(order.id)
    const merchantTradeDate = getMerchantTradeDate()

    const { error: updateError } = await supabase
      .from('orders')
      .update({ merchant_trade_no: merchantTradeNo })
      .eq('id', order.id)

    if (updateError) {
      console.error('[ecpay/checkout] update merchant_trade_no error:', updateError.message)
      return NextResponse.json(
        { error: '訂單更新失敗，請稍後再試。', code: 'DB_ERROR' },
        { status: 500 },
      )
    }

    // ── S7：組裝綠界 AIO 必填參數 + 計算 CheckMacValue ───────────────────────

    const courseTitle = order.courses?.title ?? '超跑教育課程'

    // 商品名稱：長度限 400 byte；超出時截斷並加省略號
    const itemName = courseTitle.length > 50
      ? `${courseTitle.slice(0, 48)}…`
      : courseTitle

    // 交易描述：限 200 byte，不含特殊字元（綠界規範）
    const tradeDesc = encodeURIComponent('超跑教育線上課程')

    // 必填參數（值均為字串）
    const ecpayParams: Record<string, string> = {
      MerchantID:        ECPAY_MERCHANT_ID,
      MerchantTradeNo:   merchantTradeNo,
      MerchantTradeDate: merchantTradeDate,
      PaymentType:       'aio',
      TotalAmount:       String(order.amount),
      TradeDesc:         tradeDesc,
      ItemName:          itemName,
      ReturnURL:         RETURN_URL,
      ChoosePayment:     'Credit',   // 信用卡；改為 'ALL' 開放全付款方式
      EncryptType:       '1',        // SHA256（必填）
      ClientBackURL:     CLIENT_BACK_URL,
    }

    // 計算 CheckMacValue（使用環境變數中的 HashKey / HashIV）
    const checkMacValue = generateCheckMacValue(ecpayParams)

    // 將 CheckMacValue 加入參數（送出時包含）
    const finalParams: Record<string, string> = {
      ...ecpayParams,
      CheckMacValue: checkMacValue,
    }

    // ── S8：回傳結果 ──────────────────────────────────────────────────────────
    //
    // 前端收到後，建立一個隱藏的 <form method="POST"> 指向 apiUrl，
    // 將 params 中每個 key/value 寫入 <input type="hidden">，
    // 再觸發 form.submit() 即可導向綠界付款頁。
    //
    // 範例（前端）：
    //   const form = document.createElement('form')
    //   form.method = 'POST'
    //   form.action = data.apiUrl
    //   Object.entries(data.params).forEach(([k, v]) => {
    //     const input = document.createElement('input')
    //     input.type = 'hidden'
    //     input.name = k
    //     input.value = v
    //     form.appendChild(input)
    //   })
    //   document.body.appendChild(form)
    //   form.submit()
    //
    return NextResponse.json(
      {
        apiUrl: ECPAY_API_URL,
        params: finalParams,
      } satisfies CheckoutResponse,
      { status: 200 },
    )

  } catch (err: unknown) {
    console.error('[ecpay/checkout] unexpected error:', err)
    return NextResponse.json(
      { error: '系統發生未知錯誤，請稍後再試。', code: 'UNKNOWN' },
      { status: 500 },
    )
  }
}
