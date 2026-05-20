# Global Civic Tech Watch — 專案計畫與狀態

## 專案簡介

Claire 的個人公民科技知識庫工具，同時作為公開網站。
每日自動從全球來源抓取公民科技文章，以 DeepL 翻譯、Claude API 生成繁中摘要、OpenAI 生成語音版，供 Claire 閱讀後手動挑選素材整理電子報（電子報發送由另外系統處理）。

**公開內容**：網站（繁中 / English 雙語）+ Source code on GitHub
**保護內容**：API keys 存 GitHub Secrets，Supabase RLS 限制公眾只能讀取

---

## 技術架構

| 層級 | 工具 | 說明 |
|------|------|------|
| 框架 | Next.js 16.2.2 + TypeScript + Tailwind | App Router，`src/proxy.ts` 取代舊版 `middleware.ts` |
| 國際化 | next-intl 4.x | 雙語路由 `/zh/...` 和 `/en/...`，預設 `/zh` |
| 資料庫 | Supabase（PostgreSQL + Storage） | 公眾 read-only，寫入只有 service role；`audio` bucket 存語音檔 |
| 翻譯 | DeepL API | 免費 50 萬字/月，key 結尾 `:fx` 為免費版 |
| 摘要 | Anthropic Claude API (claude-haiku-4-5-20251001) | 翻譯後再摘要，月費約 $1–3 |
| 語音 | OpenAI TTS (tts-1) | 每日摘要分段轉語音 mp3 |
| 地圖 | Leaflet.js + OpenStreetMap | 完全免費，client-side dynamic import |
| 自動化 | GitHub Actions | 每日 UTC 00:00（台灣 08:00）；實際因排程延遲多在 03:00–05:00 UTC 執行 |
| 部署 | Vercel（前端）+ Supabase（DB） | 自訂網域 `civictech.claire-cheng.com` |

---

## 專案結構

```
global-civic-tech/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout（只 render children）
│   │   ├── page.tsx                ← redirect → /zh
│   │   ├── globals.css
│   │   └── [locale]/
│   │       ├── layout.tsx          ← HTML shell + Navbar + Footer + Provider；generateMetadata（含 metadataBase）
│   │       ├── page.tsx            ← 首頁：今日摘要（+語音）+ 最新 12 則案例
│   │       ├── digest/page.tsx     ← 歷史摘要報告列表（最近 30 天）
│   │       ├── cases/page.tsx      ← 全部案例（篩選：類型/國家/標籤/搜尋）
│   │       ├── map/page.tsx        ← 全球地圖
│   │       └── bookmarks/page.tsx  ← 靈感庫（localStorage 收藏）
│   │
│   ├── components/
│   │   ├── Navbar.tsx              ← 導覽列 + 語言切換（client）
│   │   ├── Footer.tsx              ← Footer
│   │   ├── ArticleCard.tsx         ← 單篇文章卡片 + 收藏按鈕 + 類型標籤（client）
│   │   ├── AudioPlayer.tsx         ← 語音播放器，修正 mp3 duration 顯示（client）
│   │   ├── DigestList.tsx          ← 日期側欄 + 報告內容（client）
│   │   ├── CasesClient.tsx         ← 搜尋 + 類型/國家/標籤篩選（client）
│   │   ├── MapClient.tsx           ← Leaflet 地圖，點擊顯示各國案例（client）
│   │   └── BookmarksClient.tsx     ← 靈感庫清單（client）
│   │
│   ├── i18n/
│   │   ├── routing.ts              ← locales: ["zh", "en"], defaultLocale: "zh"
│   │   └── request.ts              ← getRequestConfig，載入 messages
│   │
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client + Article / DailyDigest 型別
│   │   └── bookmarks.tsx           ← BookmarkProvider（localStorage 收藏 context）
│   │
│   └── proxy.ts                    ← Next.js 16 的 middleware（next-intl routing）
│
├── scripts/                        ← 資料管道，用 `npx tsx` 執行
│   ├── fetch.ts                    ← 抓 RSS feeds + GitHub API → Supabase
│   ├── process.ts                  ← DeepL 翻譯 + Claude 摘要 → 更新 articles
│   ├── digest.ts                   ← 彙整當日文章 → 生成 daily_digests
│   └── audio.ts                    ← 當日摘要分段轉語音 → Supabase Storage
│
├── supabase/
│   └── schema.sql                  ← 建立 articles、daily_digests 兩張表 + RLS
│
├── messages/
│   ├── zh.json                     ← 繁體中文 UI 字串
│   └── en.json                     ← English UI 字串
│
├── .github/workflows/
│   └── daily-update.yml            ← 每日排程：fetch → process → digest → audio
│
├── .env.example                    ← 所有需要的 env var 範本
├── next.config.ts                  ← withNextIntl 包裝
└── PLAN.md                         ← 本文件
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
| summary_zh | TEXT | 繁中摘要（Claude，100–150 字） |
| summary_en | TEXT | 英文摘要（Claude，80–120 字） |
| url | TEXT UNIQUE | 原文網址（去重用） |
| source | TEXT | 來源名稱（`GitHub` 代表專案，其餘為報導） |
| country | TEXT | 國家/地區名稱（顯示用） |
| country_code | CHAR(2) | ISO 3166-1（地圖用，e.g. TW） |
| tags | TEXT[] | 標籤陣列（取自固定分類法） |
| language_original | TEXT | 原文語言 |
| published_at | TIMESTAMPTZ | 原文發布時間 |
| content_snippet | TEXT | RSS 原文片段 |
| content_snippet_zh | TEXT | 片段繁中翻譯（DeepL） |
| processed | BOOLEAN | false = 尚未翻譯/摘要 |
| created_at | TIMESTAMPTZ | 寫入時間 |

### `daily_digests`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | PK |
| date | DATE UNIQUE | 報告日期 |
| content_zh | TEXT | 繁中每日摘要（純文字） |
| content_en | TEXT | 英文每日摘要 |
| article_count | INTEGER | 當日案例數 |
| audio_url | TEXT | 當日語音檔網址（帶 `?v=` 版本參數破快取） |
| created_at | TIMESTAMPTZ | 建立時間 |

---

## 資料流

```
GitHub Actions（每日 08:00 台灣時間）
  ↓
scripts/fetch.ts
  從 RSS 來源 + GitHub Topics API 抓文章
  upsert 進 articles（processed = false，依 url 去重）
  ↓
scripts/process.ts
  取出 processed = false 的文章（批次 BATCH_SIZE，預設 20、CI 設 150）
  DeepL API → title_zh / title_en / content_snippet_zh
  Claude API → summary_zh / summary_en / tags
  更新 processed = true
  ↓
scripts/digest.ts
  取出今日 processed = true 的文章
  Claude API → 繁中 + 英文每日摘要報告（max_tokens 8000）
  upsert 進 daily_digests
  ↓
scripts/audio.ts
  當日摘要分段（≤3800 字/段）轉語音（OpenAI TTS）→ 合併 mp3
  上傳 Supabase Storage → 更新 daily_digests.audio_url
```

---

## RSS 資料來源（scripts/fetch.ts 的 `SOURCES`）

| 來源 | 國家/地區 | country_code |
|------|----------|--------------|
| Code for All | International | null |
| mySociety | United Kingdom | GB |
| Beeck Center | United States | US |
| Nesta | United Kingdom | GB |
| GovTech Review | Australia | AU |
| GDS Blog | United Kingdom | GB |
| Nextgov | United States | US |
| Federal News Network | United States | US |
| Code for Africa | Africa | null |
| Code for Japan | Japan | JP |
| CivicDataLab | India | IN |
| GovTech Singapore | Singapore | SG |
| Open Knowledge Foundation | International | null |
| Global Voices Advox | International | null |
| GitHub Topics API | 各國 | null |

> GitHub Topics 搜尋 `civic-tech` / `govtech` / `open-data`。
> **注意**：RSS URL 可能會過期或改版，需定期確認是否仍有效。

---

## 環境變數

| 變數 | 用途 | 存放位置 |
|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | 前端讀取 DB | `.env.local` + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 前端讀取 DB（read-only） | `.env.local` + Vercel |
| `SUPABASE_URL` | scripts 寫入 DB | GitHub Secrets + `.env.local` |
| `SUPABASE_SERVICE_KEY` | scripts 寫入 DB（service role） | GitHub Secrets + `.env.local` |
| `DEEPL_API_KEY` | 翻譯 | GitHub Secrets + `.env.local` |
| `ANTHROPIC_API_KEY` | Claude 摘要 / 每日報告 | GitHub Secrets + `.env.local` |
| `OPENAI_API_KEY` | audio.ts 語音合成（TTS） | GitHub Secrets + `.env.local` |
| `GH_TOKEN` | GitHub API rate limit（選填） | GitHub Secrets + `.env.local` |

> 範本見 `.env.example`。本地執行 scripts 需要 `.env.local`（scripts 用 `process.loadEnvFile` 載入）。

---

## 目前狀態（2026-05-20）

專案已上線運作，每日自動化穩定執行。

### 運作中
- 網站部署於 Vercel；自訂網域 `civictech.claire-cheng.com` 已生效
- Supabase DB + Storage（`audio` bucket）運作中，RLS + GRANT 已設定
- GitHub Actions 每日 fetch → process → digest → audio
- 14 個 RSS 來源 + GitHub Topics（civic-tech / govtech / open-data）
- 前端五頁面：首頁、/digest、/cases、/map、/bookmarks

### 後續優化（可選）
- [ ] `/cases`、`/map` 加分頁或 limit —— 目前 `select("*")` 無上限，文章累積後頁面會變慢、傳輸量變大
- [ ] `articles` 表舊資料保留策略（目前只有音檔有 180 天清理，資料列無清理）
- [ ] `fetch.ts` 本地執行的 GitHub token 名稱對齊（`.env.local` 用 `GH_TOKEN`，程式讀 `GITHUB_TOKEN`；CI 已對應，本地未認證會被限流）
- [ ] 拉丁美洲在地來源（主要組織多無 RSS，待評估是否寫爬蟲）
- [ ] 加入 Email 推送（每日摘要寄給自己）、日期範圍篩選
- [ ] SEO：補完整 Open Graph（`metadataBase` 已設）

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

# 一次處理較多文章
BATCH_SIZE=150 npx tsx scripts/process.ts

# Build 檢查
npm run build
```

---

## 重要注意事項

- **Next.js 16 breaking change**：middleware 改為 `src/proxy.ts`，export 為 `proxy`（非 `default`）
- **Leaflet**：需 client-side dynamic import（`MapClient.tsx` 用 `useEffect` + `Promise.all`）
- **Supabase**：`supabase.ts` 用 fallback placeholder 讓 build 不因缺 env 而失敗；runtime 需真實 keys
- **`force-dynamic`**：資料頁面均加 `export const dynamic = "force-dynamic"`，避免 build 時靜態化
- **音檔快取**：`audio.ts` 上傳沿用同檔名，故在存入 `audio_url` 時加 `?v=時間戳` 破除瀏覽器/CDN 舊快取
- **audio.ts skip**：偵測到 `audio_url` 已存在會跳過；要重生成同一天需先把該日 `audio_url` 設為 null
- **本地執行 scripts**：Claude Code 的 shell 會把 `ANTHROPIC_API_KEY` 設為空字串，而 `loadEnvFile` 不覆蓋既有環境變數；本地跑 process/digest 需用 `env -u ANTHROPIC_API_KEY npx tsx ...`
