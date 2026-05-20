# Global Civic Tech Watch — 專案計畫與狀態

## 專案簡介

Claire 的個人公民科技知識庫工具，同時作為公開網站。  
每日自動從全球來源抓取公民科技文章，以 DeepL 翻譯、Claude API 生成繁中摘要，再以 OpenAI TTS 產生當日語音報告，供 Claire 閱讀後手動挑選素材整理電子報（電子報發送由另外系統處理）。

**公開內容**：網站（繁體中文）+ Source code on GitHub  
**保護內容**：API keys 存 GitHub Secrets，Supabase RLS 限制公眾只能讀取

---

## 技術架構

| 層級 | 工具 | 說明 |
|------|------|------|
| 框架 | Next.js 16.2.2 + TypeScript + Tailwind | App Router，`src/proxy.ts` 取代舊版 `middleware.ts` |
| 國際化 | next-intl 4.x | 路由 `/zh/...`，目前僅啟用繁體中文（英文已停用） |
| 資料庫 | Supabase（PostgreSQL） | 公眾 read-only，寫入只有 service role |
| 翻譯 | DeepL API | 免費 50 萬字/月，key 結尾 `:fx` 為免費版 |
| 摘要 | Anthropic Claude API (claude-haiku-4-5-20251001) | 翻譯後再摘要，月費約 $1–3 |
| 語音 | OpenAI TTS API (tts-1, voice: nova) | 將當日繁中摘要轉成 mp3 |
| 地圖 | Leaflet.js + OpenStreetMap | 完全免費，client-side dynamic import |
| 自動化 | GitHub Actions | 每日 UTC 00:00（台灣時間 08:00）執行 |
| 部署 | Vercel（前端）+ Supabase（DB） | 均有免費方案 |

---

## 專案結構

```
global-civic-tech/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout（只 render children）
│   │   ├── page.tsx                    ← redirect → /zh
│   │   ├── globals.css
│   │   └── [locale]/
│   │       ├── layout.tsx              ← HTML shell + Navbar + Footer + Provider；含 metadataBase
│   │       ├── page.tsx                ← 首頁：今日摘要（含語音）+ 最新報導
│   │       ├── digest/page.tsx         ← 報告頁：按日期瀏覽 / 搜尋全部 兩個分頁
│   │       ├── cases/page.tsx          ← 舊路由，redirect → /digest
│   │       ├── map/page.tsx            ← 全球地圖
│   │       ├── bookmarks/page.tsx      ← 靈感庫（收藏的報導）
│   │       └── about/page.tsx          ← 關於頁（JTBD 說明 + 資料來源）
│   │
│   ├── components/
│   │   ├── Navbar.tsx                  ← 導覽列 + 收藏數徽章（client）
│   │   ├── Footer.tsx                  ← Footer
│   │   ├── ArticleCard.tsx             ← 單篇報導卡片 + 收藏鈕 + 專案/報導類型標籤
│   │   ├── DigestList.tsx              ← 報告頁主元件：日期分頁 + 搜尋分頁（類型/國家/標籤/關鍵字篩選）
│   │   ├── AudioPlayer.tsx             ← 自製語音播放器（修正 OpenAI TTS duration=Infinity 問題）
│   │   ├── BookmarksClient.tsx         ← 靈感庫頁：清單 + 匯出/匯入（client）
│   │   └── MapClient.tsx               ← Leaflet 地圖，點擊顯示各國案例（client）
│   │
│   ├── i18n/
│   │   ├── routing.ts                  ← locales: ["zh"]（英文已停用，en.json 保留未啟用）
│   │   └── request.ts                  ← getRequestConfig，載入 messages
│   │
│   ├── lib/
│   │   ├── supabase.ts                 ← Supabase client + Article / DailyDigest 型別
│   │   └── bookmarks.tsx               ← BookmarkProvider，收藏狀態存 localStorage
│   │
│   └── proxy.ts                        ← Next.js 16 的 middleware（next-intl routing）
│
├── scripts/                            ← 資料管道，用 `npx tsx` 執行
│   ├── fetch.ts                        ← 抓 RSS feeds + GitHub API → Supabase
│   ├── process.ts                      ← DeepL 翻譯 + Claude 摘要 → 更新 articles
│   ├── digest.ts                       ← 彙整當日文章 → 生成 daily_digests
│   └── audio.ts                        ← 當日摘要 → OpenAI TTS → mp3 上傳 Supabase Storage
│
├── supabase/
│   └── schema.sql                      ← 建立 articles、daily_digests 兩張表 + RLS + GRANT
│
├── messages/
│   ├── zh.json                         ← 繁體中文 UI 字串
│   └── en.json                         ← English UI 字串（保留未啟用）
│
├── .github/
│   └── workflows/
│       └── daily-update.yml            ← 每日排程：fetch → process → digest → audio
│
├── .env.example                        ← 所有需要的 env var 範本
├── next.config.ts                      ← withNextIntl 包裝
└── PLAN.md                             ← 本文件
```

---

## 資料庫 Schema（Supabase）

### `articles`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | PK |
| title_original | TEXT | 原文標題 |
| title_zh | TEXT | 繁中標題（DeepL） |
| title_en | TEXT | 英文標題 |
| summary_zh | TEXT | 繁中摘要（Claude） |
| summary_en | TEXT | 英文摘要（英文已停用，新文章不再生成） |
| url | TEXT UNIQUE | 原文網址（去重用） |
| source | TEXT | 來源名稱（e.g. mySociety；`GitHub` 視為「專案」） |
| country | TEXT | 國家名稱（顯示用） |
| country_code | CHAR(2) | ISO 3166-1（地圖用，e.g. TW） |
| tags | TEXT[] | 英文標籤陣列 |
| language_original | TEXT | 原文語言 |
| published_at | TIMESTAMPTZ | 原文發布時間 |
| content_snippet | TEXT | RSS 原文片段 |
| content_snippet_zh | TEXT | RSS 原文片段繁中翻譯 |
| processed | BOOLEAN | false = 尚未翻譯/摘要 |
| created_at | TIMESTAMPTZ | 寫入時間 |

### `daily_digests`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | PK |
| date | DATE UNIQUE | 報告日期 |
| content_zh | TEXT | 繁中每日摘要（純文字） |
| content_en | TEXT | 英文每日摘要（英文已停用，現寫入空字串） |
| article_count | INTEGER | 當日案例數 |
| audio_url | TEXT | 語音 mp3 公開網址（含 `?v=` 版本參數） |
| created_at | TIMESTAMPTZ | 建立時間 |

---

## 資料流

```
GitHub Actions（每日 08:00 台灣時間）
  ↓
scripts/fetch.ts
  從 23 個 RSS 來源 + GitHub Topics API 抓文章
  upsert 進 articles（processed = false）
  ↓
scripts/process.ts
  取出 processed = false 的文章（批次 BATCH_SIZE=150）
  DeepL API → title_zh / content_snippet_zh（title_en 直接沿用英文原標題）
  Claude API → summary_zh / tags
  更新 processed = true
  ↓
scripts/digest.ts
  取出今日 processed = true 的文章
  Claude API → 繁中每日摘要報告
  upsert 進 daily_digests
  ↓
scripts/audio.ts
  取出當日繁中摘要，依段落/句子切成 ≤3800 字多段
  逐段呼叫 OpenAI TTS 後串接成單一 mp3
  上傳 Supabase Storage，寫回 audio_url（附 ?v= 破除快取）
```

---

## RSS 資料來源（scripts/fetch.ts）

共 23 個 feed，加上 GitHub Topics API（`civic-tech` / `govtech` / `open-data`）。

**美國 / 英國 / 澳洲**：mySociety、Beeck Center、GovTech Review、GDS Blog、Nextgov、Federal News Network、Government Technology、StateScoop、FedScoop、PublicTechnology、Smart Cities Dive

**國際組織**：The GovLab、Endstate、OECD-OPSI、Open Government Partnership、Decidim、Open Contracting Partnership、Open Knowledge Foundation、Global Voices Advox

**區域型（亞洲 / 非洲）**：Code for Africa、Code for Japan、CivicDataLab（India）、GovTech Singapore

> **注意**：RSS URL 可能會過期或改版，需定期確認是否仍有效。

---

## 環境變數

| 變數 | 用途 | 存放位置 |
|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 前端讀取 DB | `.env.local` + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 前端讀取 DB（read-only） | `.env.local` + Vercel |
| `SUPABASE_URL` | scripts 寫入 DB | GitHub Secrets |
| `SUPABASE_SERVICE_KEY` | scripts 寫入 DB（service role） | GitHub Secrets |
| `DEEPL_API_KEY` | 翻譯 | GitHub Secrets |
| `ANTHROPIC_API_KEY` | Claude 摘要 | GitHub Secrets |
| `OPENAI_API_KEY` | OpenAI TTS 語音合成 | GitHub Secrets |
| `GH_TOKEN` | GitHub API rate limit（選填） | GitHub Secrets |

設定範本見 `.env.example`，複製為 `.env.local` 後填入實際金鑰。

---

## 目前狀態（2026-05-20）

### 已完成
- [x] Next.js 16 專案、Supabase schema、繁中前端、四階段資料管道（fetch / process / digest / audio）
- [x] 前端頁面：首頁、報告頁（按日期 / 搜尋全部雙分頁）、地圖、靈感庫、關於頁
- [x] 報導卡片：收藏功能（localStorage）+ 專案/報導類型標籤
- [x] 報告頁搜尋分頁：依類型、國家、標籤、關鍵字篩選
- [x] 語音報告：`scripts/audio.ts` 將當日摘要切段、逐段 TTS、串接成完整 mp3
- [x] `AudioPlayer.tsx`：自製播放器，修正 OpenAI TTS mp3 `duration=Infinity` 導致進度條卡住的問題
- [x] 音檔網址附 `?v=` 版本參數，避免重新生成後沿用瀏覽器/CDN 舊快取
- [x] RSS 來源擴充至 23 個（含非洲、日本、印度、新加坡等區域型來源）
- [x] GitHub 專案搜尋加入 `open-data` topic
- [x] `layout.tsx` 設定 `metadataBase` 指向自訂網域
- [x] 停用英文版：網站改為純繁體中文，`digest.ts` / `process.ts` 不再生成英文文字（省下 Claude token）
- [x] GitHub Actions 每日排程、GitHub Secrets、Vercel 部署、Supabase RLS + GRANT 均已設定
- [x] GitHub repo：https://github.com/Legendream/global-civic-tech
- [x] Vercel 部署：https://global-civic-tech.vercel.app（自訂網域 civictech.claire-cheng.com）

### 待完成
- [ ] 確認 GitHub Actions 排程穩定執行（每日 UTC 00:00）
- [ ] 定期驗證各 RSS feed URL 仍有效

### 後續優化（可選）
- [ ] `MapClient.tsx` 的 `COUNTRY_COORDS` 可補充更多國家座標
- [ ] 加入 Email 推送（每日摘要寄給自己）
- [ ] 加入日期範圍篩選
- [ ] 移除已停用的 `CasesClient.tsx`（/cases 已改為 redirect，此元件不再被引用）

---

## 快速指令

```bash
# 本地開發
npm run dev

# 手動執行資料管道
npx tsx scripts/fetch.ts
npx tsx scripts/process.ts
npx tsx scripts/digest.ts
npx tsx scripts/audio.ts

# 指定日期生成摘要 / 語音
DIGEST_DATE=2026-04-30 npx tsx scripts/digest.ts
DIGEST_DATE=2026-04-30 npx tsx scripts/audio.ts

# Build 檢查
npm run build
```

---

## 重要注意事項

- **Next.js 16 breaking change**：middleware 改為 `src/proxy.ts`，export 為 `proxy`（非 `default`）
- **Leaflet**：需 client-side dynamic import（`MapClient.tsx` 用 `useEffect` + `Promise.all`）
- **Supabase**：`supabase.ts` 用 fallback placeholder 讓 build 不因缺 env 而失敗；runtime 需真實 keys
- **`force-dynamic`**：資料頁面均加 `export const dynamic = "force-dynamic"`，避免 build 時靜態化
- **OpenAI TTS**：單次請求 input 上限 4096 字元，故 `audio.ts` 需切段；產生的 mp3 在瀏覽器中 `duration` 會回報為 `Infinity`，由 `AudioPlayer.tsx` 以 seek-to-end 技巧修正
