# Global Civic Tech Watch 全球公民科技動態

每日自動彙整全球公民科技最新發展，翻譯成繁體中文，並以雙語（繁中 / English）呈現。

## 功能

- 每日自動從全球公民科技來源抓取文章
- DeepL API 翻譯，Claude API 生成繁體中文摘要
- 每日摘要報告（繁中 / 英文）
- 全球地圖標示各國案例
- 案例列表（依國家、標籤、關鍵字篩選）
- 繁體中文 / English 雙語介面

## 技術架構

- **前端**：Next.js 16 + Tailwind CSS + next-intl
- **資料庫**：Supabase（PostgreSQL）
- **翻譯**：DeepL API
- **摘要**：Anthropic Claude API (Haiku)
- **地圖**：Leaflet.js + OpenStreetMap
- **自動化**：GitHub Actions（每日 08:00 台灣時間）

## 資料來源

- [Code for All](https://codeforall.org)
- [mySociety](https://www.mysociety.org)
- [g0v.news](https://g0v.news)
- [Beeck Center](https://beeckcenter.georgetown.edu)
- [Nesta](https://www.nesta.org.uk)
- GitHub Topics: `civic-tech`

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

# 或指定日期
DIGEST_DATE=2026-04-30 npx tsx scripts/digest.ts
```

## 部署 Supabase

1. 在 [supabase.com](https://supabase.com) 建立新專案
2. Dashboard > SQL Editor，執行 `supabase/schema.sql`
3. 複製 Project URL 和 anon key 填入 `.env.local`

## GitHub Actions Secrets

在 GitHub repo > Settings > Secrets 設定：

| Secret | 說明 |
|--------|------|
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_SERVICE_KEY` | service_role key（有寫入權限） |
| `DEEPL_API_KEY` | DeepL API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GH_TOKEN` | GitHub Token（選填，提高 rate limit） |

## Open Source

原始碼公開於 GitHub，任何人可 fork 並自行部署（需填入自己的 API keys）。資料庫由作者維護，他人無法寫入。
