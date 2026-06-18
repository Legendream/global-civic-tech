/**
 * 彙整當日處理完成的文章，用 Claude API 生成每日摘要報告
 * 執行：npx tsx scripts/digest.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
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
  relevance: number | null;
};

async function generateDigest(
  articles: Article[],
  lang: "zh" | "en",
  date: string
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
    ? `你是公民科技研究員。今日日期：${date}。以下是今天的 ${articles.length} 則全球公民科技新聞，請用繁體中文生成一份每日摘要報告，包含：
1. 開頭段落（2-3句）總結今日整體亮點與趨勢
2. 依地區分組呈現各則新聞，每則新聞寫：標題、2-3句說明（這是什麼專案或政策、解決什麼問題、有何意義）
3. 結尾段落（2-3句）觀察今日全球公民科技發展方向

文章列表：
${articleList}

報告請使用純文字，不要 Markdown 標記，必須使用繁體中文。`
    : `You are a civic tech researcher. Today's date: ${date}. Here are today's ${articles.length} global civic tech news items. Generate a daily digest in English including:
1. An opening paragraph (2-3 sentences) summarizing today's highlights and trends
2. News grouped by region; for each item write the title and 2-3 sentences explaining what the project or policy is, what problem it solves, and why it matters
3. A closing paragraph (2-3 sentences) on today's broader civic tech directions

Articles:
${articleList}

Use plain text, no Markdown.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  return (message.content[0] as { text: string }).text.trim();
}

async function main() {
  const targetDate = process.env.DIGEST_DATE ?? new Date().toISOString().split("T")[0];
  console.log(`Generating digest for ${targetDate}...`);

  // Get articles published today (or created today if no published_at)
  const { data: rawArticles, error } = await supabase
    .from("articles")
    .select(
      "id, title_zh, title_en, summary_zh, summary_en, source, country, country_code, url, published_at, relevance"
    )
    .eq("processed", true)
    .gte("created_at", `${targetDate}T00:00:00.000Z`)
    .lte("created_at", `${targetDate}T23:59:59.999Z`);

  if (error) {
    console.error("Supabase fetch error:", error);
    process.exit(1);
  }

  // 每日摘要「從嚴」：只收 relevance=2（明確公民科技），不收 1（政府 IT/人事/採購等
  // 邊緣案例）與 0（雜訊）。邊緣案例仍會在網站文章列表/地圖顯示（前端用 isRelevant >=1），
  // 只是不進每日報告與語音，讓 Claire 挑電子報素材的這份摘要保持高訊噪比。
  // 註：新文章一律經 process.ts 評分（0/1/2，不會是 null）；歷史 null 資料不在當日範圍內。
  const articles = (rawArticles ?? []).filter((a) => a.relevance === 2);

  if (articles.length === 0) {
    console.log("No relevant processed articles today. Saving empty record.");
    const { error: emptyUpsertError } = await supabase
      .from("daily_digests")
      .upsert(
        { date: targetDate, content_zh: "", content_en: "", article_count: 0 },
        { onConflict: "date" }
      );
    if (emptyUpsertError) {
      console.error("Supabase upsert error:", emptyUpsertError);
      process.exit(1);
    }
    console.log(`Empty digest record saved for ${targetDate}.`);
    return;
  }

  console.log(`Found ${articles.length} relevant articles. Generating digests...`);

  const content_zh = await generateDigest(articles, "zh", targetDate);

  const { error: upsertError } = await supabase
    .from("daily_digests")
    .upsert(
      {
        date: targetDate,
        content_zh,
        // 網站已停用英文版，不再生成英文摘要。content_en 欄位為 NOT NULL，寫入空字串即可
        content_en: "",
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
