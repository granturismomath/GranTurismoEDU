# Changelog

所有版本的變更記錄皆會列在此檔案中。

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
