# Global Civic Tech Watch — 專案計畫與狀態

## 專案簡介

Claire 的個人公民科技知識庫工具，同時作為公開網站。  
每日自動從全球來源抓取公民科技文章，以 DeepL 翻譯、Claude API 生成繁中摘要，供 Claire 閱讀後手動挑選素材整理電子報（電子報發送由另外系統處理）。

**公開內容**：網站（繁中 / English 雙語）+ Source code on GitHub  
**保護內容**：API keys 存 GitHub Secrets，Supabase RLS 限制公眾只能讀取

---

## 技術架構

| 層級 | 工具 | 說明 |
|------|------|------|
| 框架 | Next.js 16.2.2 + TypeScript + Tailwind | App Router，`src/proxy.ts` 取代舊版 `middleware.ts` |
| 國際化 | next-intl 4.x | 雙語路由 `/zh/...` 和 `/en/...`，預設 `/zh` |
| 資料庫 | Supabase（PostgreSQL） | 公眾 read-only，寫入只有 service role |
| 翻譯 | DeepL API | 免費 50 萬字/月，key 結尾 `:fx` 為免費版 |
| 摘要 | Anthropic Claude API (claude-haiku-4-5-20251001) | 翻譯後再摘要，月費約 $1–3 |
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
│   │       ├── layout.tsx              ← HTML shell + Navbar + Footer + NextIntlClientProvider
│   │       ├── page.tsx                ← 首頁：今日摘要 + 最新 12 則案例
│   │       ├── digest/page.tsx         ← 歷史摘要報告列表（最近 30 天）
│   │       ├── cases/page.tsx          ← 全部案例（帶篩選）
│   │       └── map/page.tsx            ← 全球地圖
│   │
│   ├── components/
│   │   ├── Navbar.tsx                  ← 導覽列 + 語言切換（client）
│   │   ├── Footer.tsx                  ← Footer
│   │   ├── ArticleCard.tsx             ← 單篇文章卡片（server-compatible）
│   │   ├── DigestList.tsx              ← 日期側欄 + 報告內容（client）
│   │   ├── CasesClient.tsx             ← 搜尋 + 國家/標籤篩選（client）
│   │   └── MapClient.tsx               ← Leaflet 地圖，點擊顯示各國案例（client）
│   │
│   ├── i18n/
│   │   ├── routing.ts                  ← locales: ["zh", "en"], defaultLocale: "zh"
│   │   └── request.ts                  ← getRequestConfig，載入 messages
│   │
│   ├── lib/
│   │   └── supabase.ts                 ← Supabase client + Article / DailyDigest 型別
│   │
│   └── proxy.ts                        ← Next.js 16 的 middleware（next-intl routing）
│
├── scripts/                            ← 資料管道，用 `npx tsx` 執行
│   ├── fetch.ts                        ← 抓 RSS feeds + GitHub API → Supabase
│   ├── process.ts                      ← DeepL 翻譯 + Claude 摘要 → 更新 articles
│   └── digest.ts                       ← 彙整當日文章 → 生成 daily_digests
│
├── supabase/
│   └── schema.sql                      ← 建立 articles、daily_digests 兩張表 + RLS
│
├── messages/
│   ├── zh.json                         ← 繁體中文 UI 字串
│   └── en.json                         ← English UI 字串
│
├── .github/
│   └── workflows/
│       └── daily-update.yml            ← 每日排程：fetch → process → digest
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
| summary_zh | TEXT | 繁中摘要（Claude，100 字內） |
| summary_en | TEXT | 英文摘要（Claude，80 字內） |
| url | TEXT UNIQUE | 原文網址（去重用） |
| source | TEXT | 來源名稱（e.g. mySociety） |
| country | TEXT | 國家名稱（顯示用） |
| country_code | CHAR(2) | ISO 3166-1（地圖用，e.g. TW） |
| tags | TEXT[] | 英文標籤陣列 |
| language_original | TEXT | 原文語言 |
| published_at | TIMESTAMPTZ | 原文發布時間 |
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
| created_at | TIMESTAMPTZ | 建立時間 |

---

## 資料流

```
GitHub Actions（每日 08:00 台灣時間）
  ↓
scripts/fetch.ts
  從 5 個 RSS 來源 + GitHub Topics API 抓文章
  upsert 進 articles（processed = false）
  ↓
scripts/process.ts
  取出 processed = false 的文章（批次 30 篇）
  DeepL API → title_zh / title_en
  Claude API → summary_zh / summary_en / tags
  更新 processed = true
  ↓
scripts/digest.ts
  取出今日 processed = true 的文章
  Claude API → 繁中 + 英文每日摘要報告
  upsert 進 daily_digests
```

---

## RSS 資料來源（scripts/fetch.ts）

| 來源 | 國家/地區 | country_code |
|------|----------|--------------|
| Code for All | International | null |
| mySociety | United Kingdom | GB |
| g0v.news | Taiwan | TW |
| Beeck Center | United States | US |
| Nesta | United Kingdom | GB |
| GitHub Topics API | 各國 | null |

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
| `GH_TOKEN` | GitHub API rate limit（選填） | GitHub Secrets |

---

## 目前狀態（2026-04-30）

### 已完成
- [x] Next.js 16 專案初始化（TypeScript、Tailwind、next-intl 雙語）
- [x] Supabase schema（articles + daily_digests + RLS）
- [x] `scripts/fetch.ts`：RSS + GitHub API 抓取
- [x] `scripts/process.ts`：DeepL 翻譯 + Claude 摘要
- [x] `scripts/digest.ts`：每日摘要生成
- [x] 前端四頁面：首頁、/digest、/cases、/map
- [x] 元件：ArticleCard、DigestList、CasesClient、MapClient（Leaflet）
- [x] GitHub Actions 每日排程（`.github/workflows/daily-update.yml`）
- [x] `.env.example`、`README.md`
- [x] `npm run build` 通過

### 待完成（部署前）
- [ ] 在 Supabase 建立新專案，執行 `supabase/schema.sql`
- [ ] 取得 API keys（DeepL、Anthropic、Supabase）填入 `.env.local`
- [ ] 手動執行 scripts 一次，確認資料能正確抓取、翻譯、摘要
- [ ] 推上 GitHub，設定 GitHub Secrets
- [ ] Vercel 部署，設定 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 確認 GitHub Actions 第一次排程成功執行

### 後續優化（可選）
- [ ] 驗證各 RSS feed URL 仍有效，補充更多來源
- [ ] `MapClient.tsx` 的 `COUNTRY_COORDS` 可補充更多國家座標
- [ ] 加入 Email 推送（每日摘要寄給自己）
- [ ] 加入更多篩選條件（日期範圍）
- [ ] SEO：`generateMetadata` 補充 Open Graph

---

## 快速指令

```bash
# 本地開發
npm run dev

# 手動執行資料管道
npx tsx scripts/fetch.ts
npx tsx scripts/process.ts
npx tsx scripts/digest.ts

# 指定日期生成摘要
DIGEST_DATE=2026-04-30 npx tsx scripts/digest.ts

# Build 檢查
npm run build
```

---

## 重要注意事項

- **Next.js 16 breaking change**：middleware 改為 `src/proxy.ts`，export 為 `proxy`（非 `default`）
- **Leaflet**：需 client-side dynamic import（`MapClient.tsx` 用 `useEffect` + `Promise.all`）
- **Supabase**：`supabase.ts` 用 fallback placeholder 讓 build 不因缺 env 而失敗；runtime 需真實 keys
- **`force-dynamic`**：四個資料頁面均加 `export const dynamic = "force-dynamic"`，避免 build 時靜態化
