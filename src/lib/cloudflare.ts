/**
 * src/lib/cloudflare.ts
 *
 * Cloudflare Stream 防盜簽章引擎
 *
 * 使用 `jose` 套件（而非 `jsonwebtoken`）產生 RS256 JWT，
 * 完全相容於 Next.js Edge Runtime，無需 Node.js crypto 模組。
 *
 * 環境變數：
 *   CLOUDFLARE_STREAM_KEY_ID  — 在 Cloudflare Dashboard 取得的 Key ID
 *   CLOUDFLARE_STREAM_PEM     — RSA 私鑰（見下方 .env.local 設定指南）
 */

// `server-only` 套件確保此模組不會被意外 import 到 Client Component，
// 一旦誤用，Next.js 會在 build 時直接拋出錯誤。
import 'server-only'

import { SignJWT, importPKCS8 } from 'jose'

// ── 常數 ─────────────────────────────────────────────────────
const ALGORITHM      = 'RS256' as const
const EXPIRY         = '6h'            // Token 有效期限（6 小時）
const ENV_KEY_ID     = 'CLOUDFLARE_STREAM_KEY_ID'
const ENV_PEM        = 'CLOUDFLARE_STREAM_PEM'

// ─────────────────────────────────────────────────────────────
// parsePem — 將環境變數中的 PEM 字串還原為標準格式
//
// 支援兩種 .env.local 儲存格式（詳見檔案底部說明）：
//   格式 A：Base64 整行編碼（推薦）
//   格式 B：以 \n 字面量代替換行符（適合偵錯用）
// ─────────────────────────────────────────────────────────────
function parsePem(raw: string): string {
  // 格式 A：整串不含 PEM 標頭 → 視為 Base64，decode 後取得原始 PEM
  if (!raw.includes('BEGIN')) {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    if (!decoded.includes('BEGIN')) {
      throw new Error(
        `[${ENV_PEM}] Base64 decode 後仍無法識別 PEM 標頭，請確認編碼是否正確。`
      )
    }
    return decoded
  }

  // 格式 B：含 PEM 標頭但換行符為 \n 字面量 → 替換為真實換行
  return raw.replace(/\\n/g, '\n')
}

// ─────────────────────────────────────────────────────────────
// generateStreamToken — Cloudflare Stream 簽章 Token 產生器
//
// @param videoId  Cloudflare Stream 上的影片 UID（即 video_url 欄位儲存的 ID）
// @returns        已簽署的 JWT（可直接拼入 Cloudflare 播放器 src URL）
//
// 使用範例：
//   const token = await generateStreamToken('abc123videoUID')
//   const playerSrc = `https://iframe.videodelivery.net/${token}`
// ─────────────────────────────────────────────────────────────
export async function generateStreamToken(videoId: string): Promise<string> {

  // ── 1. 讀取並驗證環境變數 ──
  const keyId    = process.env[ENV_KEY_ID]
  const pemInput = process.env[ENV_PEM]

  if (!keyId) {
    throw new Error(
      `[generateStreamToken] 缺少環境變數 ${ENV_KEY_ID}，` +
      `請至 Cloudflare Dashboard → Stream → Signing Keys 取得。`
    )
  }
  if (!pemInput) {
    throw new Error(
      `[generateStreamToken] 缺少環境變數 ${ENV_PEM}，` +
      `請確認已依照 .env.local 格式指南完成設定。`
    )
  }
  if (!videoId?.trim()) {
    throw new Error('[generateStreamToken] videoId 不可為空字串。')
  }

  // ── 2. 解析 PEM 字串 ──
  let pem: string
  try {
    pem = parsePem(pemInput)
  } catch (err) {
    throw new Error(
      `[generateStreamToken] PEM 解析失敗：` +
      `${err instanceof Error ? err.message : String(err)}`
    )
  }

  // ── 3. 匯入 RSA 私鑰（jose 使用 Web Crypto API，Edge 相容）──
  let privateKey: CryptoKey
  try {
    privateKey = await importPKCS8(pem, ALGORITHM)
  } catch (err) {
    throw new Error(
      `[generateStreamToken] 私鑰匯入失敗。` +
      `請確認 PEM 格式為 PKCS#8（標頭應為 -----BEGIN PRIVATE KEY-----）。` +
      `若您的私鑰為傳統 RSA 格式（-----BEGIN RSA PRIVATE KEY-----），` +
      `請使用 openssl pkcs8 -topk8 -nocrypt 轉換後再使用。` +
      `\n詳細錯誤：${err instanceof Error ? err.message : String(err)}`
    )
  }

  // ── 4. 簽署 JWT ──
  try {
    const token = await new SignJWT({
      // sub：Cloudflare 用來對應影片的核心欄位（必填）
      sub: videoId,

      // kid：部分 Cloudflare 版本要求同時出現在 payload
      kid: keyId,

      // downloadable：設為 false 禁止使用者下載影片原檔
      downloadable: false,
    })
      .setProtectedHeader({
        alg: ALGORITHM,
        kid: keyId,      // kid 放在 header 供 Cloudflare 查找對應公鑰
      })
      .setExpirationTime(EXPIRY) // 6 小時後自動失效
      .setIssuedAt()             // 記錄簽發時間（iat），方便稽核
      .sign(privateKey)

    return token

  } catch (err) {
    throw new Error(
      `[generateStreamToken] JWT 簽署失敗：` +
      `${err instanceof Error ? err.message : String(err)}`
    )
  }
}
