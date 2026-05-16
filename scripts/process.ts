/**
 * 取出未處理的文章，用 DeepL 翻譯 + Claude API 生成繁中摘要
 * 執行：npx tsx scripts/process.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// DeepL free API (api-free.deepl.com) or paid (api.deepl.com)
async function translateWithDeepL(
  text: string,
  targetLang: "ZH-HANT" | "EN-US"
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY!;
  const host = apiKey.endsWith(":fx")
    ? "api-free.deepl.com"
    : "api.deepl.com";

  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepL error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.translations[0].text as string;
}

async function summarizeWithClaude(
  titleZh: string,
  contentHint: string,
  contentSnippet: string | null
): Promise<{ summary_zh: string; summary_en: string; tags: string[] }> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `你是公民科技研究助理。請根據以下資料，生成：
1. 繁體中文摘要（100至150字，必須使用繁體中文，說明這是什麼專案或政策、解決什麼問題、在哪個國家/地區、有何重要意義）
2. 英文摘要（80 to 120 words）
3. 從以下清單中選擇 2-4 個最符合的標籤（只能從清單中選，不可自創）：
   open-data, transparency, e-participation, ai-governance, election, environment, anti-corruption, accessibility, open-source, digital-rights, public-service, civic-tech

文章標題：${titleZh}
${contentSnippet ? `文章內容摘錄：${contentSnippet}` : ""}
${contentHint ? `補充：${contentHint}` : ""}

請用以下 JSON 格式回覆（不要有其他文字）：
{"summary_zh": "...", "summary_en": "...", "tags": ["tag1", "tag2"]}`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    // Fallback if JSON parse fails
    return {
      summary_zh: titleZh,
      summary_en: contentHint || titleZh,
      tags: ["civic-tech"],
    };
  }
}

async function main() {
  const batchSize = parseInt(process.env.BATCH_SIZE ?? "20", 10);

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title_original, language_original, source, country, content_snippet")
    .eq("processed", false)
    .order("created_at", { ascending: false })
    .limit(batchSize);

  if (error) {
    console.error("Supabase fetch error:", error);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("No unprocessed articles.");
    return;
  }

  console.log(`Processing ${articles.length} articles...`);

  for (const article of articles) {
    try {
      console.log(`  → ${article.title_original.slice(0, 60)}...`);

      // Always translate to ZH-HANT so DeepL converts Simplified → Traditional
      const titleZh = await translateWithDeepL(article.title_original, "ZH-HANT");

      const titleEn =
        article.language_original === "en"
          ? article.title_original
          : await translateWithDeepL(article.title_original, "EN-US");

      const contentSnippetZh = article.content_snippet
        ? await translateWithDeepL(article.content_snippet, "ZH-HANT")
        : null;

      // Summarize with Claude
      const { summary_zh, summary_en, tags } = await summarizeWithClaude(
        titleZh,
        `Source: ${article.source}, Country: ${article.country ?? "Unknown"}`,
        article.content_snippet ?? null
      );

      await supabase
        .from("articles")
        .update({
          title_zh: titleZh,
          title_en: titleEn,
          summary_zh,
          summary_en,
          tags,
          content_snippet_zh: contentSnippetZh,
          processed: true,
        })
        .eq("id", article.id);

      // Avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ Failed article ${article.id}:`, err);
    }
  }

  console.log("\nDone processing.");
}

main();
