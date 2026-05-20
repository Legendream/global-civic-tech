# Global Civic Tech Watch 全球公民科技動態

每日自動彙整全球公民科技最新發展，翻譯成繁體中文呈現。

## 功能

- 每日自動從 23 個全球公民科技來源 + GitHub 抓取文章
- DeepL API 翻譯，Claude API 生成繁體中文摘要
- 每日繁體中文摘要報告，並以 OpenAI TTS 產生語音版
- 報告頁可按日期瀏覽，或搜尋全部報導（依類型、國家、標籤、關鍵字篩選）
- 全球地圖標示各國案例
- 靈感庫：收藏感興趣的報導，支援匯出 / 匯入

## 技術架構

- **前端**：Next.js 16 + Tailwind CSS + next-intl
- **資料庫**：Supabase（PostgreSQL）+ Supabase Storage（語音檔）
- **翻譯**：DeepL API
- **摘要**：Anthropic Claude API (Haiku)
- **語音**：OpenAI TTS API
- **地圖**：Leaflet.js + OpenStreetMap
- **自動化**：GitHub Actions（每日 08:00 台灣時間）

## 資料來源

23 個 RSS feed，涵蓋美 / 英 / 澳的政府科技媒體、國際公民科技組織，以及非洲、日本、印度、新加坡等區域型來源（mySociety、GovTech Singapore、Code for Africa、Code for Japan、CivicDataLab、Open Knowledge Foundation 等），另加 GitHub Topics（`civic-tech` / `govtech` / `open-data`）。完整清單見 `scripts/fetch.ts` 與 `PLAN.md`。

## 本地開發

```bash
git clone https://github.com/Legendream/global-civic-tech.git
cd global-civic-tech
npm install
cp .env.example .env.local
# 填入你自己的 API keys
npm run dev
```

## 執行資料管道（手動）

```bash
npx tsx scripts/fetch.ts      # Step 1：抓取文章
npx tsx scripts/process.ts    # Step 2：翻譯 + 摘要
npx tsx scripts/digest.ts     # Step 3：生成今日摘要
npx tsx scripts/audio.ts      # Step 4：生成今日語音

# 或指定日期
DIGEST_DATE=2026-04-30 npx tsx scripts/digest.ts
```

## 部署 Supabase

1. 在 [supabase.com](https://supabase.com) 建立新專案
2. Dashboard > SQL Editor，執行 `supabase/schema.sql`
3. 建立名為 `audio` 的 Storage bucket（公開讀取），供語音檔存放
4. 複製 Project URL 和 anon key 填入 `.env.local`

## GitHub Actions Secrets

在 GitHub repo > Settings > Secrets 設定：

| Secret | 說明 |
|--------|------|
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_SERVICE_KEY` | service_role key（有寫入權限） |
| `DEEPL_API_KEY` | DeepL API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key（語音合成） |
| `GH_TOKEN` | GitHub Token（選填，提高 rate limit） |

## Open Source

原始碼公開於 GitHub，任何人可 fork 並自行部署（需填入自己的 API keys）。資料庫由作者維護，他人無法寫入。
