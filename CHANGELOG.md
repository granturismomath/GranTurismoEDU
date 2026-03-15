# Changelog

所有版本的變更記錄皆會列在此檔案中。

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
