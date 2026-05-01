/**
 * 彙整當日處理完成的文章，用 Claude API 生成每日摘要報告
 * 執行：npx tsx scripts/digest.ts
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type Article = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  summary_zh: string | null;
  summary_en: string | null;
  source: string;
  country: string | null;
  country_code: string | null;
  url: string;
  published_at: string | null;
};

async function generateDigest(
  articles: Article[],
  lang: "zh" | "en"
): Promise<string> {
  const isZh = lang === "zh";

  const articleList = articles
    .map((a, i) => {
      const title = isZh ? a.title_zh : a.title_en;
      const summary = isZh ? a.summary_zh : a.summary_en;
      const country = a.country ?? (isZh ? "不明" : "Unknown");
      return `${i + 1}. [${country}] ${title}\n   ${summary ?? ""}`;
    })
    .join("\n\n");

  const prompt = isZh
    ? `你是公民科技研究員。以下是今天的 ${articles.length} 則全球公民科技新聞，請生成一份精簡的每日摘要報告（繁體中文），包含：
1. 開頭一句話總結今日亮點
2. 依地區分組呈現各則新聞（標題 + 一行摘要）
3. 結尾一句趨勢觀察

文章列表：
${articleList}

報告請使用純文字，不要 Markdown 標記。`
    : `You are a civic tech researcher. Here are today's ${articles.length} global civic tech news items. Please generate a concise daily digest in English including:
1. A one-sentence highlight of today's key developments
2. News grouped by region (title + one-line summary each)
3. A closing trend observation

Articles:
${articleList}

Use plain text, no Markdown.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  return (message.content[0] as { text: string }).text.trim();
}

async function main() {
  const targetDate = process.env.DIGEST_DATE ?? new Date().toISOString().split("T")[0];
  console.log(`Generating digest for ${targetDate}...`);

  // Get articles published today (or created today if no published_at)
  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, title_zh, title_en, summary_zh, summary_en, source, country, country_code, url, published_at"
    )
    .eq("processed", true)
    .gte("created_at", `${targetDate}T00:00:00.000Z`)
    .lte("created_at", `${targetDate}T23:59:59.999Z`);

  if (error) {
    console.error("Supabase fetch error:", error);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("No processed articles today.");
    return;
  }

  console.log(`Found ${articles.length} articles. Generating digests...`);

  const [content_zh, content_en] = await Promise.all([
    generateDigest(articles, "zh"),
    generateDigest(articles, "en"),
  ]);

  const { error: upsertError } = await supabase
    .from("daily_digests")
    .upsert(
      {
        date: targetDate,
        content_zh,
        content_en,
        article_count: articles.length,
      },
      { onConflict: "date" }
    );

  if (upsertError) {
    console.error("Supabase upsert error:", upsertError);
    process.exit(1);
  }

  console.log(`\nDigest saved for ${targetDate} (${articles.length} articles).`);
  console.log("\n--- 繁體中文摘要預覽 ---");
  console.log(content_zh.slice(0, 300) + "...");
}

main();
