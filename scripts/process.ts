/**
 * 取出未處理的文章，用 DeepL 翻譯 + Claude API 生成繁中摘要
 * 執行：npx tsx scripts/process.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { ALLOWED_TAGS } from "../src/lib/tags";

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
): Promise<{ summary_zh: string; tags: string[]; relevance: number }> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `你是公民科技研究助理。請根據以下資料，生成：
1. 繁體中文摘要（100至150字，必須使用繁體中文，說明這是什麼專案或政策、解決什麼問題、在哪個國家/地區、有何重要意義）
2. 從以下清單中選擇 1-4 個最符合的標籤（寧缺勿濫：只貼真正切合的，內容單薄就只給 1 個，不要硬湊；只能從清單中選，不可自創）：
   ${ALLOWED_TAGS.join(", ")}
3. 公民科技相關性評分 relevance（整數）。公民科技的定義：運用科技、數位工具或開放資料，讓公民社會變得更好——讓人更容易參與公共事務、更好用公共服務，或串聯社群、推動討論以改善政策與民主品質。依此評分：
   2 = 明確的公民科技：用科技／開放資料賦能公民社會（例：預算視覺化、參與式預算或線上審議平台、假訊息查證工具、開放資料應用、公民監督或陳情工具）。
   1 = 與政府或公共事務相關，但不是上述公民科技（例：政府 IT 系統／採購、人事任免、機關內部事務、一般政策或政治新聞、政府自身導入 AI）。
   0 = 與公民科技無關（純國防軍事、個人理財、政治人物八卦、體育、名人、與科技／治理無關的時事）。
   重要：只有真正「用科技／資料賦能公民社會」才給 2。單純的政府新聞、IT 採購、人事異動、國防、政治攻防，即使與政府有關，也一律給 1 或 0，不要給 2。

文章標題：${titleZh}
${contentSnippet ? `文章內容摘錄：${contentSnippet}` : ""}
${contentHint ? `補充：${contentHint}` : ""}

請用以下 JSON 格式回覆（不要有其他文字）：
{"summary_zh": "...", "tags": ["tag1", "tag2"], "relevance": 2}`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim();

  // Claude 常把 JSON 包在 ```json ... ``` 程式碼框裡，先剝除再抓出物件
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn(`    ⚠ 無法解析摘要回覆，退回標題：${raw.slice(0, 80)}`);
    return { summary_zh: titleZh, tags: [], relevance: 1 };
  }

  try {
    const parsed = JSON.parse(match[0]) as {
      summary_zh?: string;
      tags?: string[];
      relevance?: number;
    };
    const tags = (parsed.tags ?? []).filter((t) => ALLOWED_TAGS.includes(t));
    // 解析不到分數時給 1（保守保留，不誤殺）
    const relevance = [0, 1, 2].includes(parsed.relevance as number)
      ? (parsed.relevance as number)
      : 1;
    return {
      summary_zh: parsed.summary_zh?.trim() || titleZh,
      tags,
      relevance,
    };
  } catch {
    console.warn(`    ⚠ JSON 解析失敗，退回標題：${raw.slice(0, 80)}`);
    return { summary_zh: titleZh, tags: [], relevance: 1 };
  }
}

// 翻譯前的便宜預檢：只用英文原標題快速判斷。保守起見只有「明確無關」才回 0，
// 不確定一律回 1（交給後續含內文的完整評分）。攔下明顯雜訊以省 DeepL + 摘要花費。
async function quickRelevanceCheck(titleOriginal: string): Promise<number> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 5,
    messages: [
      {
        role: "user",
        content: `Rate how related this headline is to "civic tech" — using technology to improve public governance, government transparency, open data, digital public services, or civic participation.
Reply with ONE digit only:
2 = clearly civic tech
1 = government / public-affairs related, or unsure
0 = clearly unrelated (pure military/defense, personal finance, retirement, sports, celebrity, obituary, generic software library, a person's job title)

Headline: ${titleOriginal}

Digit:`,
      },
    ],
  });
  const raw = (msg.content[0] as { text: string }).text;
  const m = raw.match(/[012]/);
  return m ? parseInt(m[0], 10) : 1; // 解析不到就保守保留
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

      // 翻譯前預檢：明顯非公民科技就直接跳過，省下 DeepL + 摘要的花費
      const pre = await quickRelevanceCheck(article.title_original);
      if (pre === 0) {
        await supabase
          .from("articles")
          .update({ processed: true, relevance: 0 })
          .eq("id", article.id);
        console.log(`    ⤷ 預檢判定非公民科技，跳過翻譯與摘要（省 API）`);
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }

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
      const { summary_zh, tags, relevance } = await summarizeWithClaude(
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
          tags,
          relevance,
          content_snippet_zh: contentSnippetZh,
          processed: true,
        })
        .eq("id", article.id);

      if (relevance === 0) {
        console.log(`    ⤷ 相關性 0（雜訊，前端將隱藏）`);
      }

      // Avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ Failed article ${article.id}:`, err);
    }
  }

  console.log("\nDone processing.");
}

main();
