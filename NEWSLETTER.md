# 主題探索報告（Newsletter）使用說明

## 這是什麼功能？

給定一個問題或主題，自動從資料庫裡的全球公民科技報導中挑選相關案例，由 Claude 整理成一份跨國趨勢分析草稿，存到 `output/` 資料夾，供你潤稿後用於電子報或文章。

這是 `scripts/` 工具箱裡的一支**手動腳本**（和 `reprocess.ts`、`export-corpus.ts` 同類）：
- **不在每日自動排程裡**，也**不會部署到網站上**（`src/` 不會 import 它）。
- 原始碼在 GitHub 上（備份＋版本控管），但產出的草稿（`output/*.md`）已被 `.gitignore`，只留在你本地。

---

## 怎麼啟動？

在**你自己的終端機**跑（不是在 Claude Code 的工具裡——它需要 `ANTHROPIC_API_KEY`，那把金鑰只在你的環境裡）：

```bash
TOPIC="開放資料如何提升選舉透明度" npm run newsletter
```

跑完草稿會存到 `output/newsletter-日期-主題.md`，終端機也會印出開頭預覽與這次的估算成本。

> 需要 `.env.local` 內有 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`ANTHROPIC_API_KEY`（與其他資料管道腳本共用同一份）。

---

## 可以調整哪些參數？

用環境變數帶在指令前面即可：

| 參數 | 預設 | 說明 | 範例 |
|------|------|------|------|
| `TOPIC` | （必填） | 主題方向，建議用**問題句** | `TOPIC="各國如何監管政府 AI 採購？"` |
| `DAYS` | 30 | 檢索近 N 天的報導 | `DAYS=60` |
| `COUNTRY` | （全部） | 逗號分隔，限定國家 | `COUNTRY=Japan,Singapore` |
| `TAGS` | （全部） | 逗號分隔，限定標籤（見 `src/lib/tags.ts`） | `TAGS=ai-governance,transparency` |
| `COUNT` | 8 | 精選案例的目標則數 | `COUNT=5` |
| `MODEL` | `claude-sonnet-4-6` | 想省錢可改 Haiku | `MODEL=claude-haiku-4-5-20251001` |

組合範例：

```bash
TOPIC="電子參與工具在亞洲為何推進緩慢？" COUNTRY=Japan,India,Singapore DAYS=60 COUNT=5 npm run newsletter

# 省錢模式（約 $0.03，預設約 $0.08–0.15）
TOPIC="開放資料與選舉透明度" MODEL=claude-haiku-4-5-20251001 npm run newsletter
```

---

## 為什麼不做成網頁介面？

考量過，但有兩個實際問題：

1. **Vercel 免費方案有 10 秒 timeout**，而 Claude 生成一篇完整報告通常需要 15–30 秒，網頁觸發必然超時失敗。
2. 要在網站上加密碼保護、處理串流輸出等，工程量大、維護成本高，對一個只有你在用的功能不划算。

所以維持成終端機手動腳本：成本完全相同（Claude API 費用一樣），但零部署、不多花 Vercel 資源。

---

## 主題怎麼寫效果最好？

用**問題句**比關鍵字效果好：

- ✅「各國如何監管政府 AI 採購？」
- ✅「電子參與工具在亞洲為何推進緩慢？」
- 🟡「AI 治理」（可以，但比較廣）

腳本會先用關鍵字（中文以 2 字 bigram、標籤精確命中加權）把候選收斂到 `LIMIT` 篇，再交給 Claude 挑選與撰寫；若主題字面完全沒命中，會退而改用最新文章，由 Claude 判斷相關性。
