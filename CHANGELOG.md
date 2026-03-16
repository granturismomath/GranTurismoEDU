# Changelog

所有版本的變更記錄皆會列在此檔案中。

---

## [v1.2.1] - 2026-03-17

### Admin 車隊總部、Onboarding 引擎重構、全站暗黑模式 & 底盤優化

#### 🛡️ Admin 車隊總部 — 防彈級 3-Tier RBAC 權限架構

- 新增 `/dashboard/admin` 路由（Server Component 角色門禁：`admin` / `owner` 限定）
- 實作 `owner → admin → user` 三層權限體系，`updateUserRole` Server Action 配備 7 層安全驗證：
  - L1 `getUser()` JWT 驗證、L2 DB 二次確認呼叫者為 owner、L3 禁止降級 owner、L4 禁止自改身分、L5 Audit Log 寫入、L6 UPDATE 主表、L7 `revalidatePath`
- 建立 `AdminConsole.tsx`（Client Component）三分頁儀表板：
  - **車手名冊**：可排序用戶表格，動態 RoleSelect 下拉切換 + LockCell（admin 無法改 owner），per-row 讀取中動畫
  - **系統稽核**：`profile_history` Audit Log 瀑布流，顯示 old_data / new_data diff
  - **系統日誌**：4 個子分頁 — 更新版本時間軸（VERSION_LOG）、課程管理（即將上線）、學員註冊日誌（真實資料）、課程購買（即將上線）
- Dashboard Sidebar 新增「車隊總部」Shield 圖示入口，僅 `admin` / `owner` 可見
- Toast 通知堆疊（成功 / 失敗），`router.refresh()` 更新 Server Component 資料

#### 🏎️ Onboarding 引擎 — 全面重構表單體驗

- **徹底消滅原生 `<input type="date">`**，重構「出生年月日」為三欄並排 `<select>`（年 / 月 / 日）
  - 年份：今年 -5 ~ 今年 -30（符合學齡範圍）
  - 日期：根據選取年月動態計算天數（完整閏年 / 大小月處理）
  - 提交時自動組合為 `YYYY-MM-DD` 寫入 DB
- **台灣全域縣市行政區連動選單**：內建 22 縣市完整資料庫，行政區依縣市即時解鎖
  - 提交時合併為 `台北市大安區` 格式寫入 `district` 欄位
- 新增**性別欄位**（男 / 女），完整貫穿：`OnboardingData` 型別 → `completeOnboarding()` → `users.gender` 欄位
- `Row 3` 改為三欄格線（縣市 / 行政區 / 學校），版面更緊湊
- 修復 `handleSubmit` 中遺留的 `gender` 型別錯誤（PGRST204 root cause）

#### 🌙 全站暗黑模式 — GT 午夜賽道質感

- 建立完整 CSS 變數系統：`--background`、`--card-bg`、`--border-subtle`、`--text-primary/secondary/tertiary`、`--brand`、`--nav-active-bg`、`--nav-hover-bg`、`--dot-color`
- **GT Midnight Blue 深色調色盤**：底層 `#131C25`、卡片 `#1C2A38`、邊框 `#2A3C50`、品牌藍 `#7FAED2`
- 升級 `ThemeToggleMini`，新增 **`pill` 膠囊變體**：左 ☀️ 右 🌙 雙按鈕 Capsule，active 側亮底 + 陰影 highlight（亮色: amber `#F59E0B`，暗色: GT Blue `#7FAED2`）
- `/onboarding` 頁面改用 `variant="pill"` 主題切換器

#### 🏗️ 帳號資料頁面 — Onboarding 資料全線同步

- `ProfileForm.tsx` 完整重構：出生年月日 / 學區連動選單與 Onboarding 100% 同構
- 初始值智慧解析：`birthday "2000-01-15"` → `year/month/day` 分欄；`district "台北市大安區"` → `city/area` 分欄
- 性別選單同步讀取 DB `gender` 欄位並預填，支援修改後儲存
- `account/page.tsx` SELECT 語句加入 `gender` 欄位，props 完整透傳 `ProfileInitialData`
- `updateUserProfile()` Audit Log 同步記錄 `gender` 在 `old_data` / `new_data` 中

#### 🔧 底盤優化 — Hydration 查殺 & 路由精煉

- `Navbar.tsx` 優化隱藏邏輯：`HIDDEN_ON = ['/dashboard', '/onboarding', '/login']` 陣列驅動，徹底移除 Onboarding 頁面干擾性頂部導覽列
- 全站零 TypeScript 錯誤（`next build` 17 頁面完全通過）
- 清除所有 `colorScheme` 原生 date input 殘留依賴
- `next-themes` `mounted` guard 全面覆蓋，根除 SSR Hydration Mismatch

#### 🗄️ DB Schema 擴充（需於 Supabase 執行）

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name                 TEXT,
  ADD COLUMN IF NOT EXISTS grade                TEXT,
  ADD COLUMN IF NOT EXISTS gender               TEXT,
  ADD COLUMN IF NOT EXISTS birthday             DATE,
  ADD COLUMN IF NOT EXISTS district             TEXT,
  ADD COLUMN IF NOT EXISTS school               TEXT,
  ADD COLUMN IF NOT EXISTS parent_name          TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone         TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT NOW();
```

#### 📦 變更檔案清單

| 分類 | 檔案 |
|------|------|
| 新增 | `src/app/dashboard/admin/page.tsx` |
| 新增 | `src/app/dashboard/admin/AdminConsole.tsx` |
| 新增 | `src/app/dashboard/admin/actions.ts` |
| 新增 | `src/app/dashboard/account/page.tsx` |
| 新增 | `src/app/dashboard/account/ProfileForm.tsx` |
| 新增 | `src/app/dashboard/account/actions.ts` |
| 新增 | `src/app/onboarding/actions.ts` |
| 新增 | `src/components/ThemeToggleMini.tsx` |
| 新增 | `src/components/ThemeProvider.tsx` |
| 新增 | `src/components/Navbar.tsx` |
| 修改 | `src/app/onboarding/page.tsx` |
| 修改 | `src/app/dashboard/layout.tsx` |
| 修改 | `src/app/globals.css` |
| 修改 | `src/app/layout.tsx` |

---

## [v1.2.0] - 2026-03-15

### 商業閉環與史詩級展示大門 (Landing Page) 完工

#### ✅ Added / Completed

**1. 基礎設施 — 身份驗證與權限門禁**
- 整合 Supabase Auth 全站 RLS (Row Level Security) 權限系統
- 實作 `proxy.ts` 三層路由保護：未登入 → `/login`、Onboarding 未完成 → `/onboarding`、已完成 → `/dashboard`
- 完成角色分流架構，區分 `owner`、`admin`、`student`、`parent` 四種權限層級
- Dashboard Sidebar 依角色動態渲染專屬導覽選單

**2. 核心架構 — 動態路由影音教室**
- 建立 `src/app/dashboard/my-courses/[id]/page.tsx`：學員專屬線上教室
- 實作雙欄排版（Desktop 左右分割 / Mobile 上下堆疊）
- 整合 YouTube / Vimeo URL → Embed 自動轉換函數
- 右側章節目錄（Playlist）支援即時切換單元、選中狀態藍色高亮

**3. 內容管理 CMS — 課程與單元 CRUD**
- `src/app/dashboard/courses/page.tsx`：Owner 課程列表（狀態 Badge、價格千分位）
- `src/app/dashboard/courses/new/page.tsx`：新增課程表單（含封面上傳至 Supabase Storage）
- `src/app/dashboard/courses/[id]/page.tsx`：課程中控台（封面縮圖、單元列表）
- `src/app/dashboard/courses/[id]/edit/page.tsx`：編輯課程表單（舊資料預填、封面更換/移除）
- `src/app/dashboard/courses/[id]/lessons/new/page.tsx`：新增單元表單（含精美 Toggle 開關）
- 封面上傳支援本地 `blob:` URL 即時預覽，防止 Next.js Image 破圖問題
- `CoverThumbnail` 元件實作 `onError` 破圖 Fallback 機制

**4. 商業閉環 — 選課商城與購買門禁**
- `src/app/dashboard/explore/page.tsx`：課程探索商城（骨架屏、Grid 卡片）
- `src/app/dashboard/explore/[id]/page.tsx`：課程銷售落地頁（Hero、大綱預覽、結帳按鈕）
- 結帳邏輯：寫入 `enrollments` 資料表，成功後直送影音教室
- `src/app/dashboard/my-courses/page.tsx` 門禁修復：三步驟查詢（`enrollments` → `course_id[]` → `courses.in()`），杜絕白嫖漏洞
- 空狀態引導至探索商城

**5. 視覺與品牌 — 全站 UI 翻新**
- 全站 Apple 極簡美學：`bg-[#F5F5F7]`、`rounded-2xl/3xl`、`shadow-sm`、`backdrop-blur-md`
- Gran Turismo 賽車視覺 DNA：品牌藍 `#6D97B6`、深色文字 `#1D1D1F`、方格旗背景
- `src/app/page.tsx`：完成旗艦 Landing Page（毛玻璃 Navbar、Hero 漸層大標題、Features 三欄、CTA Banner、Footer）
- 統計數字展示區、SVG 發光光暈裝飾、脈衝動點徽章

#### 🔜 Todo / Next Steps

1. **影片防盜** — 串接 Cloudflare Stream，實作高強度影片存取控制與 Signed URLs，杜絕直連盜播
2. **真實金流** — 串接綠界 ECPay 或藍新 NewebPay，實作信用卡結帳、發票、退款完整流程
3. **虛實整合** — 開發 URL 轉 QR Code 模組，支援線下課程報到與行銷素材掃碼導流

---

## [v1.0.3] - 2026-03-12

### 權限門禁系統 (Middleware)

- 安裝 `@supabase/supabase-js` 與 `@supabase/ssr` 套件
- 建立 `src/utils/supabase/client.ts`：瀏覽器端 Supabase 客戶端工具
- 建立 `src/utils/supabase/server.ts`：伺服器端 Supabase 客戶端工具（支援 Cookie 管理）
- 建立 `src/middleware.ts`：實作 Session 自動更新機制
- 預留路由保護邏輯：未登入者訪問 `/dashboard`、`/admin` 自動重導向至 `/login`
- 預留反向保護邏輯：已登入者訪問 `/login` 自動重導向至 `/dashboard`

---

## [v1.0.2] - 2026-03-12

### 資料庫與後端服務

- 連結 Supabase 雲端 PostgreSQL 資料庫
- 設定 `.env.local` 環境變數並確保 `.gitignore` 安全性
- 建立 `users` 資料表（支援 `id`, `email`, `display_name`, `role` 欄位）
- 預留擴充性：設定 `role` 權限為 `owner`, `admin`, `student`, `parent`
- 啟用 RLS (Row Level Security) 資料安全防護
- 建立 Database Trigger：實現 Auth 註冊後自動同步寫入 `users` 資料表

---
