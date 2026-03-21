-- ══════════════════════════════════════════════════════════════════════════════
-- GranTurismoEDU · v1.4.1
-- Migration : Create orders table
-- Date      : 2026-03-21
-- ══════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────────
-- 0. 前置：確認依賴資料表存在
--    orders 依賴 auth.users（由 Supabase Auth 管理）
--    以及 public.courses（需先建立）
-- ──────────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. 建立 orders 資料表
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (

  -- ── 主鍵 ──
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── 外鍵：使用者（Supabase Auth）──
  -- ON DELETE CASCADE：帳號刪除時一併清除訂單
  user_id             UUID        NOT NULL
                      REFERENCES  auth.users(id) ON DELETE CASCADE,

  -- ── 外鍵：課程 ──
  -- ON DELETE RESTRICT：防止有訂單的課程被誤刪
  course_id           UUID        NOT NULL
                      REFERENCES  public.courses(id) ON DELETE RESTRICT,

  -- ── 金額（新台幣整數，後端從 courses.price 寫入，不接受前端傳值）──
  amount              INTEGER     NOT NULL
                      CHECK (amount >= 0),

  -- ── 訂單狀態 ──
  -- pending  : 已建立，等待付款
  -- paid     : 金流回報付款成功
  -- failed   : 金流回報付款失敗 / 逾時
  -- refunded : 退款完成
  status              TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),

  -- ── 金流供應商 ──
  payment_provider    TEXT        NOT NULL
                      CHECK (payment_provider IN ('ecpay', 'newebpay', 'free')),

  -- ── 金流端交易編號（支付完成後由 Webhook 寫入，用於對帳與退款）──
  merchant_trade_no   TEXT        UNIQUE,  -- nullable，付款前為 NULL

  -- ── 時間戳記 ──
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()

);

COMMENT ON TABLE  public.orders                   IS '訂單主表；status 由金流 Webhook 更新';
COMMENT ON COLUMN public.orders.amount            IS '新台幣整數，從 courses.price 複製，防止事後課程調價影響歷史訂單';
COMMENT ON COLUMN public.orders.merchant_trade_no IS '傳給綠界/藍新的唯一交易編號，Webhook 驗證時使用';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. 查詢加速索引
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_course_id
  ON public.orders (course_id);

-- 複合索引：重複購買防護查詢用（user_id + course_id + status）
CREATE INDEX IF NOT EXISTS idx_orders_user_course_status
  ON public.orders (user_id, course_id, status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. 自動維護 updated_at 觸發器
--    （共用函式：若已存在則 REPLACE，不影響其他資料表）
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
--
-- 設計原則：
--   ┌─────────────────────┬────────────────────────────────┐
--   │ 操作                 │ 允許對象                        │
--   ├─────────────────────┼────────────────────────────────┤
--   │ SELECT              │ 已登入使用者，僅限自己的訂單       │
--   │ INSERT              │ 已登入使用者，僅限為自己建立訂單   │
--   │ UPDATE              │ service_role（金流 Webhook）      │
--   │ DELETE              │ 無（不允許刪除訂單）              │
--   └─────────────────────┴────────────────────────────────┘
--
-- UPDATE 說明：
--   金流 Webhook Route Handler (/api/payment/callback) 使用
--   SUPABASE_SERVICE_ROLE_KEY 初始化 Admin Client，
--   service_role 預設繞過 RLS，故無需另設 UPDATE Policy。
-- ══════════════════════════════════════════════════════════════════════════════

-- 4. 啟用 RLS（必須明確開啟，預設所有操作均被拒絕）
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. SELECT Policy：使用者只能查詢自己的訂單
CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. INSERT Policy：
--    使用者只能為自己建立訂單（user_id 必須等於當前登入者）
--    金額、status 等欄位的合法性由 Server Action 在應用層保證，
--    並由資料表 CHECK Constraint 做最後防線。
CREATE POLICY "orders_insert_own"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. 確認 RLS 已正確啟用（可在 Supabase Studio 驗證）
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'orders';

-- ══════════════════════════════════════════════════════════════════════════════
-- 回滾腳本（如需撤銷此 Migration，依序執行）
-- ══════════════════════════════════════════════════════════════════════════════
-- DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
-- DROP TABLE IF EXISTS public.orders;
-- -- 若 set_updated_at() 函式未被其他資料表使用，可一併移除：
-- -- DROP FUNCTION IF EXISTS public.set_updated_at();
