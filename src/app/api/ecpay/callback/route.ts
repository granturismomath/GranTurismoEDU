/**
 * POST /api/ecpay/callback
 *
 * 綠界付款結果 Webhook 接收站（商業閉環）
 * ────────────────────────────────────────────────────────────
 * 此端點由綠界伺服器主動 POST，Content-Type: application/x-www-form-urlencoded。
 * 絕對不會有 User Session，所有 DB 操作使用 Service Role 繞過 RLS。
 *
 * 安全與業務流程：
 *   W1  解析 URL-encoded Payload
 *   W2  提取並移除 CheckMacValue，進行 MAC 驗簽
 *   W3  驗簽失敗 → 記錄錯誤 + 回傳 0|Err（綠界將重試）
 *   W4  判斷 RtnCode 是否為 '1'（付款成功）
 *   W5  以 MerchantTradeNo 查詢 orders（含 user_id / course_id）
 *   W6  冪等保護：若訂單已是 paid，直接回傳 1|OK 不重複處理
 *   W7  付款成功：UPDATE orders.status → 'paid'
 *   W8  付款成功：UPSERT enrollments（正式開通課程存取權）
 *   W9  付款失敗：UPDATE orders.status → 'failed'
 *   W10 所有業務邏輯完成後，統一回傳純文字 1|OK
 *
 * ⚠️  綠界規範：
 *   · 回傳 1|OK  → 綠界視為處理完成，不再重試
 *   · 回傳 0|Err → 綠界視為異常，將排程重試（最多 5 次）
 *   · 因此只有驗簽失敗才回傳 0|Err；業務邏輯錯誤記 log 但仍回 1|OK
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { verifyCheckMacValue }       from '@/lib/ecpay'

// ── 綠界 Webhook Payload 型別 ─────────────────────────────────────────────────
//
// 只列出業務邏輯所需欄位；完整欄位清單見綠界技術文件 §2.4.2
//
type EcpayCallbackPayload = {
  MerchantID:        string   // 特店編號
  MerchantTradeNo:   string   // 我方訂單編號（orders.merchant_trade_no）
  TradeNo:           string   // 綠界端交易編號（用於對帳 / 退款）
  RtnCode:           string   // '1' = 付款成功；其他值 = 失敗或待確認
  RtnMsg:            string   // 付款結果訊息（如 'Succeeded'）
  TradeAmt:          string   // 交易金額（字串數字）
  PaymentType:       string   // 付款方式（如 'Credit_CreditCard'）
  PaymentDate:       string   // 付款時間（yyyy/MM/dd HH:mm:ss）
  SimulatePaid:      string   // 是否為模擬付款 '0'=正式 '1'=測試
  CheckMacValue:     string   // 驗簽碼（需從參數中移除後重新計算）
  [key: string]:     string   // 其他綠界欄位（CustomField1-4 等）
}

// ── Supabase DB 型別 ──────────────────────────────────────────────────────────

type OrderRow = {
  id:         string
  status:     string
  user_id:    string
  course_id:  string
  amount:     number
}

// ── 回傳格式輔助函式 ───────────────────────────────────────────────────────────

/** 綠界要求的成功回應 */
const OK  = () => new NextResponse('1|OK',  { status: 200, headers: { 'Content-Type': 'text/plain' } })

/** 綠界要求的錯誤回應（會觸發重試，僅用於驗簽失敗） */
const ERR = () => new NextResponse('0|Err', { status: 200, headers: { 'Content-Type': 'text/plain' } })
// 注意：HTTP status 仍為 200（綠界依 Body 判斷，而非 HTTP status）

// ── Service Role Supabase Admin Client ───────────────────────────────────────
//
// Webhook 沒有 User Session，必須使用 service_role key 繞過 RLS。
// 此 Client 僅在本模組內部使用，不對外 export。
//
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[ecpay/callback] 缺少環境變數 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createClient(url, key, {
    auth: {
      // Webhook 為純後端調用，不需要 Session 管理
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── W1：解析 application/x-www-form-urlencoded Payload ───────────────────
  let payload: EcpayCallbackPayload

  try {
    const text   = await request.text()
    const params = new URLSearchParams(text)

    // 將 URLSearchParams 轉換為 Record<string, string>
    const raw: Record<string, string> = {}
    params.forEach((value, key) => { raw[key] = value })

    // 最低限度驗證：確認關鍵欄位存在
    if (!raw.CheckMacValue || !raw.MerchantTradeNo || !raw.RtnCode) {
      console.error('[ecpay/callback] Payload 缺少必要欄位:', Object.keys(raw))
      return ERR()
    }

    payload = raw as EcpayCallbackPayload
  } catch (err) {
    console.error('[ecpay/callback] Payload 解析失敗:', err)
    return ERR()
  }

  // ── W2：提取 CheckMacValue，重建不含簽章的參數物件 ───────────────────────
  const { CheckMacValue: receivedMac, ...paramsWithoutMac } = payload

  // ── W3：MAC 驗簽（防偽核心）──────────────────────────────────────────────
  //
  // verifyCheckMacValue 使用 crypto.timingSafeEqual，防止 Timing Attack。
  // 驗簽失敗時回傳 0|Err，綠界將排程重試，方便排查設定錯誤。
  //
  const isValid = verifyCheckMacValue(paramsWithoutMac, receivedMac)

  if (!isValid) {
    console.error(
      '[ecpay/callback] ❌ CheckMacValue 驗簽失敗 —',
      `MerchantTradeNo=${payload.MerchantTradeNo}`,
      `RtnCode=${payload.RtnCode}`,
      `ReceivedMAC=${receivedMac}`,
    )
    return ERR()
  }

  // ── 驗簽通過，以下業務邏輯失敗仍回傳 1|OK（避免綠界無限重試）───────────────

  try {
    const adminClient = createAdminClient()

    // ── W4：判斷付款結果 ──────────────────────────────────────────────────
    const isPaid = payload.RtnCode === '1'

    // 記錄 Webhook 收到（方便除錯與稽核）
    console.info(
      `[ecpay/callback] ${isPaid ? '✅ 付款成功' : '❌ 付款失敗'}`,
      `| MerchantTradeNo=${payload.MerchantTradeNo}`,
      `| TradeNo=${payload.TradeNo}`,
      `| RtnCode=${payload.RtnCode}`,
      `| RtnMsg=${payload.RtnMsg}`,
      `| TradeAmt=${payload.TradeAmt}`,
      `| SimulatePaid=${payload.SimulatePaid}`,
    )

    // ── W5：以 MerchantTradeNo 查詢對應的 orders 紀錄 ────────────────────
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, status, user_id, course_id, amount')
      .eq('merchant_trade_no', payload.MerchantTradeNo)
      .single<OrderRow>()

    if (orderError || !order) {
      console.error(
        '[ecpay/callback] 找不到對應訂單:',
        `MerchantTradeNo=${payload.MerchantTradeNo}`,
        orderError?.message,
      )
      // 找不到訂單屬於業務異常，仍回 1|OK 避免重試
      return OK()
    }

    // ── W6：冪等保護（防止重複處理同一筆付款回調）───────────────────────
    if (order.status === 'paid') {
      console.info(
        '[ecpay/callback] 訂單已是 paid 狀態，略過重複處理:',
        `orderId=${order.id}`,
      )
      return OK()
    }

    // ── 付款成功分支 ──────────────────────────────────────────────────────
    if (isPaid) {

      // ── W7：更新 orders.status → 'paid' ─────────────────────────────
      const { error: orderUpdateError } = await adminClient
        .from('orders')
        .update({
          status:     'paid',
          // 同步記錄綠界端交易編號（供日後對帳 / 退款使用）
          // 若 orders 資料表有 ecpay_trade_no 欄位可解除下方註解：
          // ecpay_trade_no: payload.TradeNo,
        })
        .eq('id', order.id)

      if (orderUpdateError) {
        console.error(
          '[ecpay/callback] UPDATE orders 失敗:',
          `orderId=${order.id}`,
          orderUpdateError.message,
        )
        // DB 寫入失敗仍回 1|OK（避免重試），需人工介入修正
        return OK()
      }

      // ── W8：UPSERT enrollments → 正式開通課程存取權 ──────────────────
      //
      // 使用 upsert + ignoreDuplicates = true：
      //   · 第一次收到 → INSERT 新紀錄
      //   · 重複收到（冪等）→ 不更新，靜默成功
      //
      const { error: enrollError } = await adminClient
        .from('enrollments')
        .upsert(
          {
            user_id:   order.user_id,
            course_id: order.course_id,
          },
          {
            onConflict:       'user_id,course_id',
            ignoreDuplicates: true,
          },
        )

      if (enrollError) {
        console.error(
          '[ecpay/callback] UPSERT enrollments 失敗:',
          `userId=${order.user_id}`,
          `courseId=${order.course_id}`,
          enrollError.message,
        )
        // enrollments 寫入失敗屬於嚴重錯誤，但仍回 1|OK
        // 建議在此觸發告警（如 Slack / Email），以便人工補開通
      } else {
        console.info(
          '[ecpay/callback] ✅ 課程存取權已開通:',
          `userId=${order.user_id}`,
          `courseId=${order.course_id}`,
        )
      }

    } else {
      // ── W9：付款失敗 → UPDATE orders.status → 'failed' ──────────────
      const { error: failError } = await adminClient
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id)

      if (failError) {
        console.error(
          '[ecpay/callback] UPDATE orders to failed 失敗:',
          `orderId=${order.id}`,
          failError.message,
        )
      } else {
        console.info(
          '[ecpay/callback] 訂單已標記為 failed:',
          `orderId=${order.id}`,
          `RtnMsg=${payload.RtnMsg}`,
        )
      }
    }

  } catch (err: unknown) {
    // 未預期錯誤：記錄完整 stack，仍回 1|OK 避免綠界重試
    console.error('[ecpay/callback] 未預期錯誤:', err)
  }

  // ── W10：統一回傳 1|OK（綠界確認機制）─────────────────────────────────────
  return OK()
}
