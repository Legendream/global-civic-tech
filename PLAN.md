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
| 地圖 | Leaflet.js（raw）+ CARTO Voyager nolabels | 無標籤淺色底圖，client-side dynamic import，不依賴 react-leaflet |
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
│   │       └── about/page.tsx          ← 關於頁（masthead hero + 收錄標準 + 「該怎麼開始使用」導覽連結 + 來源表格，數量由 SOURCES.length 動態帶入文案）
│   │
│   ├── components/
│   │   ├── Navbar.tsx                  ← 導覽列 + accent 品牌點 + gradient 底線 + 收藏數徽章（client）
│   │   ├── Footer.tsx                  ← Footer
│   │   ├── ArticleCard.tsx             ← 單篇報導卡片 + 收藏鈕 + 專案/報導類型標籤
│   │   ├── DigestList.tsx              ← 報告頁主元件：日期分頁（含每日 DigestStatRow）+ 搜尋分頁（類型/國家/標籤/關鍵字篩選）
│   │   ├── DigestContent.tsx           ← 摘要純文字解析器：【Section】→ H3（accent 左邊線＋底色）/ 短詞 → H4（左邊線）/ 段落
│   │   ├── DigestErrorCard.tsx         ← 摘要載入失敗狀態（紅色警示＋重新載入鈕，client）
│   │   ├── AudioPlayer.tsx             ← 自製語音播放器（修正 OpenAI TTS duration=Infinity 問題）
│   │   ├── BookmarksClient.tsx         ← 靈感庫頁：清單 + 匯出/匯入（空狀態只顯示提示，有收藏才顯示備份警告）（client）
│   │   └── MapClient.tsx               ← raw Leaflet 地圖：CARTO 底圖、divIcon 資料節點（案例數＋大小縮放）、排行側欄＋國家明細面板（client）
│   │
│   ├── i18n/
│   │   ├── routing.ts                  ← locales: ["zh"]（英文已停用，en.json 保留未啟用）
│   │   └── request.ts                  ← getRequestConfig，載入 messages
│   │
│   ├── lib/
│   │   ├── supabase.ts                 ← Supabase client + Article / DailyDigest 型別 + isRelevant() 雜訊過濾
│   │   ├── tags.ts                     ← 主題分類單一來源：ALLOWED_TAGS(15類) + TAG_ZH 對照
│   │   └── bookmarks.tsx               ← BookmarkProvider，收藏狀態存 localStorage
│   │
│   └── proxy.ts                        ← Next.js 16 的 middleware（next-intl routing）
│
├── scripts/                            ← 資料管道，用 `npx tsx` 執行
│   ├── fetch.ts                        ← 抓 RSS feeds + GitHub API → Supabase
│   ├── process.ts                      ← 翻譯前相關性預檢 → DeepL 翻譯 + Claude 摘要/標籤/相關性評分 → 更新 articles
│   ├── reprocess.ts                    ← 一次性：重生歷史文章的真摘要 + 15 類標籤（修舊 bug）
│   ├── export-corpus.ts                ← 把語料匯出 output/corpus.json 供主題分析（不花 API）
│   ├── digest.ts                       ← 彙整當日文章 → 生成 daily_digests
│   └── audio.ts                        ← 當日摘要 → OpenAI TTS → mp3 上傳 Supabase Storage
│
├── supabase/
│   ├── schema.sql                      ← 建立 articles、daily_digests 兩張表 + RLS + GRANT（含 relevance 欄位）
│   └── migration_2026-05_relevance.sql ← 既有專案加 relevance 欄位（已執行）
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
| relevance | SMALLINT | 公民科技相關性 2/1/0；NULL=未評分（舊資料，前端照常顯示）。前端只濾掉 0（雜訊） |
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
  GitHub 查詢已收緊：stars>=10、pushed>2024、且過濾無描述 repo
  upsert 進 articles（processed = false）
  ↓
scripts/process.ts
  取出 processed = false 的文章（批次 BATCH_SIZE=150）
  ① 翻譯前相關性預檢（Claude，僅英文標題）：明顯雜訊 → relevance=0、跳過翻譯與摘要（省 DeepL/Claude）
  ② 其餘：DeepL → title_zh / content_snippet_zh；Claude → summary_zh / tags / relevance（0–2）
  更新 processed = true（relevance=0 的雜訊文章前端會隱藏）
  ↓
scripts/digest.ts
  取出今日 processed = true 且 relevance≠0 的文章
  Claude API → 繁中每日摘要報告
  upsert 進 daily_digests
  ↓
scripts/audio.ts
  取出當日繁中摘要，依段落/句子切成 ≤3800 字多段
  逐段呼叫 OpenAI TTS 後串接成單一 mp3（每段最多重試 3 次，間隔 10s/20s）
  3 次仍失敗 → exit 1（GitHub Actions 標記失敗並寄 email 通知）
  成功則上傳 Supabase Storage，寫回 audio_url（附 ?v= 破除快取）
```

---

## 主題分類與降噪機制（2026-05 重構）

> 背景：早期所有文章標籤都被貼成單一 `civic-tech`、摘要全部等於標題，且大量非公民科技雜訊（美國聯邦人事、國防、政治八卦）混入。本次重構徹底解決。**改任何分類/抓取/過濾邏輯前務必先讀懂以下機制，以免改壞。**

### 1. 為什麼會有雜訊（根因，避免日後忘記）
- **來源太廣**：Federal News Network（曾佔語料 22%）等「綜合政府新聞」媒體的 RSS 把所有報導全倒進來（退休金、工會、國防、人事），多數非公民科技。Nextgov / GovTech / FedScoop / StateScoop 等政府 IT 綜合媒體範圍也比公民科技廣。
- **無條件抓取**：`fetch.ts` 對每個來源 `slice(0, 20)` 抓最新 20 篇，不判斷內容。
- **GitHub topic 誤抓**：`govtech` / `open-data` 等 topic 會抓到無關 repo（測試工具、行銷產品、無描述專案）。
- **過去沒有相關性把關**，照單全收。
- 真正專注的來源（mySociety、Decidim、OKFN、Code for Africa/Japan、CivicDataLab、OGP…）雜訊極低，但發文量小，易被綜合媒體淹沒。

### 2. 主題分類（15 類，單一來源）
- **唯一來源：`src/lib/tags.ts`**（`ALLOWED_TAGS` 可指派清單 + `TAG_ZH` 顯示對照 + `isRelevant()`）。`process.ts` / `reprocess.ts` 皆 import 它，**不要再各自維護清單**。
- 15 類：open-data 開放資料、transparency 政府透明、e-participation 數位參與、ai-governance AI 治理、election 選舉科技、environment 環境永續、anti-corruption 反腐倡廉、accessibility 數位平權、open-source 開放原始碼、digital-rights 數位人權、public-service 公共服務、cybersecurity 資訊安全、procurement 政府採購、smart-city 智慧城市、digital-health 數位健康。
- `civic-tech` **已退役**：不再指派（不在 ALLOWED_TAGS），僅 `TAG_ZH` 保留以顯示殘留舊資料。
- 由來：資料驅動分析 588 篇語料歸納（`scripts/export-corpus.ts` 匯出 → 人工檢視）。原 11 類缺口補上 cybersecurity / procurement / smart-city / digital-health 四類。
- 提示詞要求「選 **1–4 個，寧缺勿濫**」：不硬湊，內容單薄可只給 1 個；完全不切合則回 0 個（reprocess 視為非公民科技而略過）。

### 3. 相關性評分 relevance（0 / 1 / 2）
- 含義：**2** = 明確公民科技；**1** = 政府/公共事務相關但非典型（政府 IT、採購、人事）或不確定；**0** = 明確無關（純國防、個人理財、運動、名人、軟體庫、職稱）。
- **NULL** = 未評分。`reprocess.ts` 不寫 relevance，故歷史文章維持 NULL → 照常顯示（當初的編輯決定：保留既有邊緣文章可見）。
- **前端不在查詢層依賴此欄位**，而是抓回後用 `isRelevant(a)`（`a.relevance == null || a.relevance >= 1`，見 `supabase.ts`）在 JS 端過濾。欄位未建立時 `undefined` 也算顯示 → **遷移/部署先後順序不會搞砸網站**。
- **套用過濾處**：`page.tsx`（今日/最新）、`DigestList.tsx`（按日期＋搜尋全部）、`digest/page.tsx`（統計）、`digest.ts`（每日報告與 article_count）。**未來新增任何「列文章」查詢都要記得套 `isRelevant`**（地圖 `MapClient` 目前尚未套，待優化）。
- 欄位遷移：`supabase/migration_2026-05_relevance.sql`。

### 4. 多層降噪策略（由源頭到輸出）
1. **來源層（`fetch.ts`）**：GitHub 查詢收緊為 `stars:>=10` + `pushed:>2024-01-01`，並在程式碼過濾掉「無描述」repo。Federal News Network 經評估**保留**（偶有好文如 CISA），交由後面把關處理。
2. **翻譯前預檢（`process.ts` `quickRelevanceCheck`）**：每篇先用**英文原標題**做一次極省（`max_tokens=5`）的 Claude 判斷。回 **0**（明確雜訊）→ 直接寫 `processed=true, relevance=0`、**跳過 DeepL 翻譯與整篇摘要**，省下整篇 API 花費。設計**偏保守**：不確定一律回 1（保留），避免誤殺好文章。
3. **完整評分（`process.ts` `summarizeWithClaude`）**：通過預檢者才翻譯，由含內文的完整呼叫回 summary_zh / tags / relevance（更準）。
4. **輸出層過濾（兩段門檻）**：
   - **瀏覽從寬**：前端文章列表/地圖用 `isRelevant`（`relevance == null || >= 1`）排除 relevance=0，保留邊緣案例（1）可供瀏覽。
   - **摘要從嚴**：`digest.ts` 只收 `relevance === 2`（明確公民科技），邊緣案例（1）不進每日報告與語音，讓 Claire 挑電子報素材的摘要保持高訊噪比。
- 效果：每日約 2–3 成雜訊在花錢前被攔；資料也更乾淨；每日摘要只剩明確公民科技。

> **2026-06-18 調整（摘要從嚴、瀏覽從寬）**：背景是 6/18 摘要 30 則中約 26 則來自美國綜合性政府 IT/新聞媒體（Federal News Network 單一來源就 10 則），多為政治、國防、人事等「政府相關但非公民科技」內容。修法：① `digest.ts` 過濾改為 `relevance === 2`；② `process.ts` 評分提示詞嵌入公民科技定義，明示政府 IT/採購/人事/國防/政治一律 1 或 0、不給 2；③ 關於頁新增「收錄標準」段落（`about.criteria*`），與評分提示詞共用同一份定義。後續可再做來源層配額（限制單一綜合媒體每日則數）。
>
> **2026-06-18 關於頁改版**：① Hero 改用全站 masthead 語彙（`.mh-*`：四角 tick、live 點 eyebrow、大字標題、accent 左邊線效益句），取代原本平淡的標題＋兩段灰字；② 新增「收錄標準」卡（定義＋收錄/不收錄對照＋AI 評分說明）；③「該怎麼開始使用」卡片改為真連結（`<Link>`）、導覽列名稱對齊（當日摘要/歷史報告/全球地圖/靈感庫）；④ 來源表補齊為 25 個（原僅列 17），文案數量改由 `SOURCES.length` 動態插值（`t("sourcesDesc"/"step1", { count })`），永不再與表格脫鉤。**配色注意**：`globals.css` 只覆寫特定 indigo 色階為 accent（如 `indigo-600/50/900`、`border-indigo-100/200`、`text-indigo-400~700`）；用到清單外的色階（`bg-indigo-500`、`border-indigo-300`、`text-indigo-900/75` 等透明度變體）會 fallback 成 Tailwind 原生靛色，與 cyan 主視覺不符——務必只用被覆寫的色階。

### 5. 一次性歷史修復（已執行，2026-05-30）
- `scripts/reprocess.ts`：對 588 篇歷史文章重生真摘要 + 重貼 15 類標籤（**不寫 relevance**，故歷史照常顯示）。結果：575 篇成功（其中無內文者僅重貼標籤、摘要維持標題）、13 篇被模型判定零標籤＝非公民科技。
- 那 13 篇確認雜訊以一次性 Supabase 更新設 `relevance=0` 隱藏（鎖定條件：reprocess 後仍掛著 `civic-tech` 標籤者）。
- `needsReprocess` 條件：tags 為空或僅 civic-tech、或（有內文卻）摘要等於標題 才重處理 → **可安全重跑**，不會反覆動已修好的。
- 空標籤在 reprocess 視為「非公民科技，略過」（不寫入、不算失敗）；只有解析/連線錯誤才算 fail，重跑時重試。

---

## RSS 資料來源（scripts/fetch.ts）

共 25 個 feed，加上 GitHub Topics API（`civic-tech` / `govtech` / `open-data`）。

**美國 / 英國 / 澳洲**：mySociety、Beeck Center、GovTech Review、GDS Blog、Nextgov、Federal News Network、Government Technology、StateScoop、FedScoop、PublicTechnology、Smart Cities Dive

**國際組織**：The GovLab、Endstate、OECD-OPSI、Open Government Partnership、Decidim、Open Contracting Partnership、Open Knowledge Foundation、Global Voices Advox

**區域型（亞洲 / 非洲）**：Code for Africa、Code for Japan、CivicDataLab（India）、GovTech Singapore、Open Culture Foundation（Taiwan）、Open Source Society PH（Philippines）

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

## 目前狀態（2026-06-15）

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
- [x] **全站視覺系統對齊設計稿**（2026-05-29，PR #8）
  - CSS token 系統：`--accent`（cyan `#0891b2`）及衍生 vars，所有 `indigo-*` class 映射到 accent vars，一處換色全站生效
  - 移除 `@media (prefers-color-scheme: dark)` 殘留，網站不論 OS 設定一律維持淺色
  - Navbar：accent 品牌方塊（`box-shadow` 光暈）+ 底部 gradient 細線
  - 首頁 masthead hero：兩欄，左側 live 點 eyebrow + 大標題 + 副標；右側超大 mono 日期數字 + `YYYY/MM` + `TODAY · 今日版`；四角十字 tick；手機單欄
  - 首頁摘要三態：pending（平靜時鐘卡）/ error（`DigestErrorCard` 紅色警示 + 重載鈕）/ ready
  - 首頁 `DigestStatRow`：mono 讀數列（則報導 / 國家・地區 / 主題標籤 / 資料來源）
  - 地圖頁全面重寫：CARTO Voyager 底圖、`divIcon` `.cmark` 資料節點（圓內案例數、依數量縮放、hover 放大、選中實心）、三格統計條、四角 tick + 左下座標讀數膠囊、排行側欄（序號 + 國旗 + accent 進度條）+ 國家明細面板（flyTo 動畫）
  - 報告頁 StatStrip 升為 4 格（報告天數 / 累計報導 / 涵蓋國家 / 主題標籤），每日摘要卡內含 DigestStatRow
  - 關於頁：移除 JTBD 卡片，改為「該怎麼開始使用？」導覽卡 + 更新來源說明（23 個）
  - 靈感庫空狀態：有收藏才顯示備份警告與匯出/匯入按鈕
  - `DigestContent.tsx`：摘要純文字三層排版（`【Section】` H3 / 短詞 H4 / 段落），修正 H3 `text-xs`（12px）< 正文 `text-sm`（14px）的階層 bug
  - 導覽列「每日摘要」與首頁區塊標題「今日摘要」均改為「當日摘要」
- [x] **audio.ts 防錯機制**（2026-06-15）：TTS 呼叫失敗時自動重試最多 3 次（間隔 10s / 20s），3 次仍失敗則以 exit 1 結束，讓 GitHub Actions 標記步驟失敗並自動寄通知信；2026-06-12/13 發生過 TTS `fetch failed` 網路錯誤（靜默跳過），本次修復確保日後同樣情況會主動通知
- [x] **主題分類重構 + 雜訊治理**（2026-05-30~31，詳見〈主題分類與降噪機制〉專章）
  - 修復 Claude JSON 程式碼框解析 bug（曾致 587 篇摘要＝標題、標籤全 `civic-tech`）
  - 分類擴為 15 類、集中到 `src/lib/tags.ts` 單一來源；歷史報告篩選「標籤」改稱「主題」、顯示改繁中
  - 新增 `relevance` 欄位 + `isRelevant()` 過濾（前端列表、報告統計、`digest.ts` 全部套用）
  - 多層降噪：`fetch.ts` 收緊 GitHub 查詢；`process.ts` 翻譯前相關性預檢（雜訊不花 DeepL/Claude）；`digest.ts` 排除 relevance=0
  - `scripts/reprocess.ts` 一次性重生 575 篇真摘要＋15 類標籤；13 篇確認雜訊設 `relevance=0` 隱藏
  - `ArticleCard`：預覽文字與標題相同時不顯示重複列（無內文文章不再標題重複兩次）
  - 首頁「當日摘要」pending 卡補上「每日約 08:00 更新」時間提示，減少使用者困惑
  - `supabase/migration_2026-05_relevance.sql` 已在正式 DB 執行

- [x] **新增亞洲來源**（2026-06-15，待 PR）
  - 新增 Open Culture Foundation（台灣，`ocf.tw/feed.xml`）：開放資料、開源、數位治理，直接對應本專案主題，feed 驗證有效且持續更新
  - 新增 Open Source Society PH（菲律賓，`blog.ossph.org/feed`）：偶有公民科技報導（BetterGov.ph 透明平台、Balota 選票工具），其餘文章交 AI 過濾，年費 < $0.01
  - 研究過並排除：g0v blog（已停站）、沃草（內容為政治新聞非 govtech）、Code for Korea（無 RSS）、Safecast（輻射監測偏環境科學）、Newstapa / Civic Tech Japan / Code for Kanazawa（feed 無效或已停更）
  - 來源總數：23 → 25

### 待完成
- [ ] 確認 GitHub Actions 排程穩定執行（每日 UTC 00:00）
- [ ] 定期驗證各 RSS feed URL 仍有效
- [ ] 下次每日排程後，驗證翻譯前預檢與降噪在實務上的攔截效果（觀察 relevance=0 比例是否合理、有無誤殺）
- [x] 上傳 2026-06-15 來源擴充變更至 GitHub（OCF + OSSPH）——2026-06-18 隨「摘要從嚴＋關於頁改版」一併提交

### 後續優化（可選）
- [ ] **呈現「人＋AI 協作」的編輯流程（重點 insight）**：本站想傳達的核心理念之一，是一種新的「蒐集資料、產出知識」的流程——由人定方向與判斷、AI 協助查證與整理，且全程附可查證來源。需設計如何在網站上呈現這套編輯方式（例如專欄文章的幕後流程說明、協作標記、或一篇 meta 文章），讓讀者看見方法本身，而不只是成果。目前文章已先以「作者 + 與 AI 協作編輯」署名標記。
- [ ] `MapClient.tsx` 的 `COUNTRY_COORDS` 可補充更多國家座標
- [ ] `MapClient.tsx` 套用 `isRelevant` 過濾，使地圖也排除 relevance=0 雜訊（目前尚未套）
- [ ] 加入 Email 推送（每日摘要寄給自己）
- [ ] 加入日期範圍篩選
- [ ] 移除已停用的 `CasesClient.tsx`（/cases 已改為 redirect，此元件不再被引用）
- [ ] 第二層自由關鍵字（封閉 15 主類 + 每篇 1–2 個自由關鍵字）+ 季度重新聚類檢視，作為分類長期演進機制

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

# 維護用腳本
npx tsx scripts/export-corpus.ts                      # 匯出語料供主題分析（不花 API）
DRY_RUN=true LIMIT=12 npx tsx scripts/reprocess.ts    # 重生摘要+標籤 預覽（不寫入）
npx tsx scripts/reprocess.ts                          # 正式重生（只處理需重處理的文章，可重跑）

# Build / 型別檢查
npm run build
npx tsc --noEmit
```

> **注意（呼叫 Claude 的腳本）**：`process.ts` / `digest.ts` / `reprocess.ts` 需 `ANTHROPIC_API_KEY`，請在自己的終端機執行（部分代理環境會擋此變數）。`fetch.ts` / `export-corpus.ts` / `audio.ts` 不需 Claude 金鑰。

---

## 重要注意事項

- **Next.js 16 breaking change**：middleware 改為 `src/proxy.ts`，export 為 `proxy`（非 `default`）
- **Leaflet**：使用 raw Leaflet（非 react-leaflet），`MapClient.tsx` 以 `useEffect` + `Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])` 動態載入；`divIcon` 節點大小 `22 + min(count,8)*4` px；需 `setMapReady` state 觸發 marker 重繪 effect
- **Supabase**：`supabase.ts` 用 fallback placeholder 讓 build 不因缺 env 而失敗；runtime 需真實 keys
- **`force-dynamic`**：資料頁面均加 `export const dynamic = "force-dynamic"`，避免 build 時靜態化
- **OpenAI TTS**：單次請求 input 上限 4096 字元，故 `audio.ts` 需切段；產生的 mp3 在瀏覽器中 `duration` 會回報為 `Infinity`，由 `AudioPlayer.tsx` 以 seek-to-end 技巧修正。TTS 呼叫有 3 次自動重試（10s/20s 間隔），最終失敗以 exit 1 通知（GitHub Actions → email）；週末因無文章不會建立摘要（6/7、5/31 等），故歷史清單不會出現那幾天的日期
- **Claude JSON 回覆**：Haiku 常把 JSON 包在 ` ```json ... ``` ` 程式碼框裡，直接 `JSON.parse` 會失敗。`process.ts` / `reprocess.ts` 都先 `replace(/```json|```/g, "")` 再用 regex 抓 `{...}` / `[...]`。曾因此 bug 導致 587 篇摘要全變標題、標籤全變 civic-tech
- **`relevance` 欄位**：用 `supabase/migration_2026-05_relevance.sql` 加欄位。前端**不在查詢層依賴它**，而是抓回後用 `isRelevant()`（`supabase.ts`）在 JS 端過濾（`relevance == null || >= 1`）——欄位未建立時 `undefined` 也視為顯示，故遷移與部署先後順序不影響網站，只是遷移＋`process.ts` 跑過後才會真正開始隱藏 0 分雜訊
