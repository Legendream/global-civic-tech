/**
 * 主題式電子報草稿生成器（隨需執行，非每日 cron）
 *
 * 給一個主題方向，從 articles 撈出相關報導，請 Claude 挑選案例並寫成電子報草稿。
 * 產出 Markdown 檔到 output/，供 Claire 潤稿後交給發送系統。
 *
 * 用法：
 *   TOPIC="開放資料如何提升選舉透明度" npm run newsletter
 *
 * 可選環境變數：
 *   DAYS     檢索範圍：近 N 天（預設 30）
 *   TAGS     逗號分隔標籤過濾，限收錄分類（見 src/lib/tags.ts 的 ALLOWED_TAGS）
 *   COUNTRY  逗號分隔國家名過濾（如 Japan,Singapore）
 *   LIMIT    送進 Claude 的候選文章數上限（預設 60）
 *   COUNT    電子報精選案例的目標則數（預設 8）
 *   MODEL    Claude 模型（預設 claude-sonnet-4-6；想省錢可改 claude-haiku-4-5-20251001）
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALLOWED_TAGS } from "../src/lib/tags";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// 標籤分類沿用 src/lib/tags.ts 的單一來源（ALLOWED_TAGS），不再各自維護清單

// 公開單價（USD / 百萬 token），僅供成本估算參考
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
};

type Candidate = {
  title_zh: string | null;
  summary_zh: string | null;
  content_snippet_zh: string | null;
  tags: string[] | null;
  country: string | null;
  source: string;
  url: string;
  published_at: string | null;
};

/** 把主題切成可比對的詞彙：英文以空白斷詞，中文以 2 字元 bigram */
function buildTerms(topic: string): string[] {
  const terms = new Set<string>();
  for (const w of topic.toLowerCase().split(/[\s、，,/]+/)) {
    if (w.length >= 2) terms.add(w);
  }
  const cleaned = topic.replace(/[\s的與和及之在對為以、，。,.!?！？「」【】（）()]/g, "");
  for (let i = 0; i < cleaned.length - 1; i++) {
    terms.add(cleaned.slice(i, i + 2).toLowerCase());
  }
  return [...terms];
}

/** 輕量相關性分數：標題／摘要／標籤命中詞彙數，標籤精確命中加權 */
function scoreArticle(a: Candidate, terms: string[]): number {
  const tags = (a.tags ?? []).map((t) => t.toLowerCase());
  const hay = `${a.title_zh ?? ""} ${a.summary_zh ?? ""} ${tags.join(" ")}`.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (hay.includes(t)) score++;
    if (tags.includes(t)) score += 3;
  }
  return score;
}

function buildPrompt(topic: string, count: number, candidates: Candidate[]): string {
  const list = candidates
    .map((a, i) => {
      const parts = [
        `[${i + 1}] ${a.title_zh ?? "(無標題)"}`,
        `國家：${a.country ?? "不明"}　來源：${a.source}　標籤：${(a.tags ?? []).join(", ") || "無"}`,
        `日期：${a.published_at ? a.published_at.slice(0, 10) : "不明"}`,
        `摘要：${a.summary_zh ?? "（無摘要）"}`,
      ];
      if (a.content_snippet_zh) parts.push(`原文摘錄：${a.content_snippet_zh}`);
      parts.push(`連結：${a.url}`);
      return parts.join("\n");
    })
    .join("\n\n");

  return `你是公民科技電子報編輯。以下是 ${candidates.length} 則候選報導，主題方向是：「${topic}」。

請完成兩件事：
1. 從候選中挑出最貼合主題的約 ${count} 則（可多可少；與主題無關的不要硬塞）。
2. 用繁體中文寫一份電子報草稿，結構如下：
   - 建議標題：一行吸引人的電子報標題
   - 主題引言：2-4 句，點出這個主題，以及為什麼此刻值得關注
   - 精選案例：逐則呈現，每則寫：小標題、發生了什麼、解決什麼問題或有何意義、原文連結
   - 觀點總結：3-5 句，串起這些案例，提出一個具體的觀察角度

嚴格規則：
- 只能使用候選資料中明確出現的事實，不可自行杜撰數據、細節或不存在的內容。
- 每則精選案例都必須附上候選資料中對應的「連結」網址。
- 若候選資料不足以支撐某個論點，寧可不寫，也不要編造。
- 全文使用繁體中文，輸出 Markdown 格式。

候選報導：
${list}`;
}

async function main() {
  const topic = process.env.TOPIC?.trim();
  if (!topic) {
    console.log("缺少 TOPIC。用法範例：");
    console.log('  TOPIC="開放資料如何提升選舉透明度" npm run newsletter');
    console.log("\n可選參數：DAYS（預設30）TAGS COUNTRY LIMIT（預設60）COUNT（預設8）MODEL");
    console.log(`TAGS 可用值：${ALLOWED_TAGS.join(", ")}`);
    return;
  }

  const days = parseInt(process.env.DAYS ?? "30", 10);
  const limit = parseInt(process.env.LIMIT ?? "60", 10);
  const count = parseInt(process.env.COUNT ?? "8", 10);
  const model = process.env.MODEL ?? "claude-sonnet-4-6";
  const tagFilter = (process.env.TAGS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const countryFilter = (process.env.COUNTRY ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const since = new Date();
  since.setDate(since.getDate() - days);

  console.log(`主題：${topic}`);
  console.log(
    `檢索：近 ${days} 天` +
      (tagFilter.length ? `　標籤=${tagFilter.join(",")}` : "") +
      (countryFilter.length ? `　國家=${countryFilter.join(",")}` : "")
  );

  let query = supabase
    .from("articles")
    .select("title_zh, summary_zh, content_snippet_zh, tags, country, source, url, published_at")
    .eq("processed", true)
    // 排除雜訊（relevance=0）；保留 1/2 與歷史 null，與前端 isRelevant 一致
    .or("relevance.is.null,relevance.gte.1")
    .gte("created_at", since.toISOString())
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit * 4);

  if (tagFilter.length) query = query.overlaps("tags", tagFilter);
  if (countryFilter.length) query = query.in("country", countryFilter);

  const { data: articles, error } = await query;
  if (error) {
    console.error("Supabase fetch error:", error);
    process.exit(1);
  }
  if (!articles || articles.length === 0) {
    console.log("找不到符合條件的文章，請放寬 DAYS / TAGS / COUNTRY 再試。");
    return;
  }

  // 關鍵字排序，預先收斂到 LIMIT 篇
  const terms = buildTerms(topic);
  const scored = articles.map((a) => ({ a: a as Candidate, score: scoreArticle(a as Candidate, terms) }));
  const anyHit = scored.some((s) => s.score > 0);
  let candidates: Candidate[];
  if (anyHit) {
    candidates = [...scored].sort((x, y) => y.score - x.score).slice(0, limit).map((s) => s.a);
  } else {
    // 退化保護：主題字面無命中，改用最新文章，交給 Claude 判斷相關性
    console.log("（關鍵字無字面命中，改用最新文章，由 Claude 判斷相關性）");
    candidates = (articles as Candidate[]).slice(0, limit);
  }

  console.log(`候選文章：${candidates.length} 則（從 ${articles.length} 則篩出）`);
  console.log(`呼叫 ${model} 生成電子報草稿...`);

  const message = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt(topic, count, candidates) }],
  });
  const draft = (message.content[0] as { text: string }).text.trim();

  // 寫出 Markdown 檔
  const today = new Date().toISOString().slice(0, 10);
  const slug = topic.slice(0, 20).replace(/[\s/\\:*?"<>|]+/g, "-").replace(/^-+|-+$/g, "");
  const outDir = join(process.cwd(), "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `newsletter-${today}-${slug}.md`);

  const header =
    `<!--\n` +
    `主題：${topic}\n` +
    `產生時間：${new Date().toISOString()}\n` +
    `檢索範圍：近 ${days} 天` +
    (tagFilter.length ? `　標籤：${tagFilter.join(",")}` : "") +
    (countryFilter.length ? `　國家：${countryFilter.join(",")}` : "") +
    `\n候選文章數：${candidates.length}　模型：${model}\n` +
    `-->\n\n`;

  writeFileSync(outPath, header + draft + "\n", "utf-8");

  // 成本回報
  const usage = message.usage;
  const price = PRICING[model];
  console.log(`\n已輸出草稿：${outPath}`);
  console.log(`Token 用量：input ${usage.input_tokens} / output ${usage.output_tokens}`);
  if (price) {
    const cost = (usage.input_tokens * price.in + usage.output_tokens * price.out) / 1_000_000;
    console.log(`估算成本：約 US$${cost.toFixed(3)}（依公開單價估算，僅供參考）`);
  }
  console.log("\n--- 草稿開頭預覽 ---");
  console.log(draft.slice(0, 400) + "...");
}

main();
