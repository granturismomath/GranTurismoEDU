'use server'

import { createClient } from '@/utils/supabase/server'

// ── 型別定義 ──────────────────────────────────────────────────────────────────

/** 金流供應商白名單 */
const VALID_PROVIDERS = ['ecpay', 'newebpay'] as const
type PaymentProvider = typeof VALID_PROVIDERS[number]

/** createCheckoutSession 回傳型別（Discriminated Union） */
export type CheckoutResult =
  | {
      success: true
      orderId:  string
      status:   'pending'
      amount:   number
      /** 下一步：前端持此資訊向 /api/payment/init 發起 MAC 雜湊簽章請求 */
    }
  | {
      success: false
      error:    string
      code?:    CheckoutErrorCode
    }

/** 錯誤代碼（供前端分支處理，如顯示不同對話框） */
export type CheckoutErrorCode =
  | 'UNAUTHENTICATED'   // 未登入
  | 'INVALID_INPUT'     // 輸入驗證失敗
  | 'COURSE_NOT_FOUND'  // 課程不存在或未上架
  | 'FREE_COURSE'       // 免費課程，改走 enrollment 流程
  | 'ALREADY_ENROLLED'  // 已擁有課程（enrollments）
  | 'ALREADY_PAID'      // 訂單已付款（orders）
  | 'PENDING_EXISTS'    // 已有進行中訂單（可直接繼續付款）
  | 'DB_ERROR'          // 資料庫操作失敗
  | 'UNKNOWN'           // 未預期錯誤

/** DB 查詢用：orders 資料列片段 */
type OrderRow = {
  id:     string
  status: string
  amount: number
}

/** DB 查詢用：courses 資料列片段 */
type CourseRow = {
  id:    string
  title: string
  price: number
}

// ──────────────────────────────────────────────────────────────────────────────
// createCheckoutSession — Server Action
//
// 安全流程：
//   L1  驗證呼叫者身份（auth.getUser，來自 Supabase Auth，不可偽造）
//   L2  輸入驗證（courseId / provider 白名單）
//   L3  從 DB 讀取課程正式售價（防止前端竄改金額）
//   L4a 重複購買防護：查詢 enrollments（已完成交付）
//   L4b 重複購買防護：查詢 orders（paid / pending）
//   L5  INSERT 新的 pending 訂單至 orders 資料表
//   L6  回傳 orderId + amount，供下一步產生 ECPay / Newebpay MAC 雜湊
// ──────────────────────────────────────────────────────────────────────────────
export async function createCheckoutSession(
  courseId:         string,
  paymentProvider:  PaymentProvider = 'ecpay',
): Promise<CheckoutResult> {
  try {
    const supabase = await createClient()

    // ── L1：驗證 Auth 身份 ──────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error:   '身份驗證失敗，請重新登入。',
        code:    'UNAUTHENTICATED',
      }
    }

    // ── L2：輸入驗證 ─────────────────────────────────────────────────────────
    if (!courseId?.trim()) {
      return {
        success: false,
        error:   '課程 ID 無效，請重新操作。',
        code:    'INVALID_INPUT',
      }
    }

    if (!VALID_PROVIDERS.includes(paymentProvider)) {
      return {
        success: false,
        error:   `不支援的金流供應商：${paymentProvider}。`,
        code:    'INVALID_INPUT',
      }
    }

    // ── L3：從 DB 讀取課程（取得正式售價，防止前端竄改）───────────────────────
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('id', courseId)
      .eq('status', 'published')
      .single<CourseRow>()

    if (courseError || !course) {
      return {
        success: false,
        error:   '找不到該課程，或課程尚未上架。',
        code:    'COURSE_NOT_FOUND',
      }
    }

    // 免費課程不走金流，改走 enrollment 直接開通流程
    if (course.price === 0 || course.price == null) {
      return {
        success: false,
        error:   '此為免費課程，請直接點擊「加入學習」即可開通。',
        code:    'FREE_COURSE',
      }
    }

    // ── L4a：已在 enrollments（課程已交付）──────────────────────────────────
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id',   user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (enrollment) {
      return {
        success: false,
        error:   '您已擁有此課程，請前往「我的課程」直接開始學習。',
        code:    'ALREADY_ENROLLED',
      }
    }

    // ── L4b：已有 paid / pending 訂單 ───────────────────────────────────────
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, amount')
      .eq('user_id',   user.id)
      .eq('course_id', courseId)
      .in('status', ['pending', 'paid'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<OrderRow>()

    if (existingOrder?.status === 'paid') {
      return {
        success: false,
        error:   '此課程的付款已完成，請前往「我的課程」。',
        code:    'ALREADY_PAID',
      }
    }

    if (existingOrder?.status === 'pending') {
      // 回傳現有 pending 訂單，讓前端繼續未完成的付款流程
      return {
        success: true,
        orderId: existingOrder.id,
        status:  'pending',
        amount:  existingOrder.amount,
      }
    }

    // ── L5：建立新的 pending 訂單 ──────────────────────────────────────────
    //    amount 取自 DB（course.price），非任何前端傳入值
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id:          user.id,
        course_id:        courseId,
        amount:           course.price,    // ← 金額永遠來自 DB，非前端
        status:           'pending',
        payment_provider: paymentProvider,
        // merchant_trade_no: 於下一步金流 init API 中設定
      })
      .select('id, status, amount')
      .single<OrderRow>()

    if (insertError || !newOrder) {
      console.error('[createCheckoutSession] insert error:', insertError?.message)
      return {
        success: false,
        error:   '訂單建立失敗，請稍後再試。',
        code:    'DB_ERROR',
      }
    }

    // ── L6：回傳訂單資訊 ─────────────────────────────────────────────────────
    // 下一步：前端持 orderId + amount 呼叫 /api/payment/init，
    //         後端組裝 ECPay / Newebpay 參數並計算 MAC 雜湊，
    //         同步更新 orders.merchant_trade_no，
    //         最後重導至金流付款頁。
    return {
      success: true,
      orderId: newOrder.id,
      status:  'pending',
      amount:  newOrder.amount,
    }

  } catch (err: unknown) {
    console.error('[createCheckoutSession] unexpected error:', err)
    return {
      success: false,
      error:   '系統發生未知錯誤，請稍後再試。',
      code:    'UNKNOWN',
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// updateOrderStatus — 供金流 Webhook Route Handler 呼叫
//
// ⚠️  此函式需搭配 service_role Supabase Client 才能繞過 RLS 更新訂單，
//     應僅在 /app/api/payment/callback/route.ts 中呼叫，
//     且必須先驗證金流 MAC 雜湊簽章後才可執行。
//
// 型別：不使用 'use server' 標記的 async function，
//       由 Route Handler 直接 import 使用。
// ──────────────────────────────────────────────────────────────────────────────
export type UpdateOrderResult =
  | { success: true }
  | { success: false; error: string }

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export async function updateOrderStatus(
  orderId:           string,
  status:            OrderStatus,
  merchantTradeNo?:  string,
): Promise<UpdateOrderResult> {
  try {
    const supabase = await createClient()

    const updatePayload: Record<string, string> = { status }
    if (merchantTradeNo) updatePayload.merchant_trade_no = merchantTradeNo

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) {
      console.error('[updateOrderStatus] update error:', error.message)
      return { success: false, error: error.message }
    }

    // 付款成功時，同步寫入 enrollments 開通課程存取權
    if (status === 'paid') {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, course_id')
        .eq('id', orderId)
        .single()

      if (order) {
        const { error: enrollError } = await supabase
          .from('enrollments')
          .upsert(
            { user_id: order.user_id, course_id: order.course_id },
            { onConflict: 'user_id,course_id', ignoreDuplicates: true },
          )

        if (enrollError) {
          console.error('[updateOrderStatus] enrollment upsert error:', enrollError.message)
          // 記錄錯誤但不中斷回傳，訂單狀態已更新成功，enrollment 可由人工補救
        }
      }
    }

    return { success: true }

  } catch (err: unknown) {
    console.error('[updateOrderStatus] unexpected error:', err)
    return { success: false, error: '系統發生未知錯誤。' }
  }
}
