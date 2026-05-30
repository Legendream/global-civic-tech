/**
 * 重新處理歷史文章：重生「真摘要」+ 重貼 15 類主題標籤
 * （修復先前 JSON 解析 bug 造成的「摘要=標題、標籤=civic-tech」）
 *
 * 注意：本腳本不寫入 relevance，現有歷史文章維持 NULL（前端照常顯示）。
 *
 * 試跑（不寫入）：DRY_RUN=true LIMIT=10 npx tsx scripts/reprocess.ts
 * 正式執行：      npx tsx scripts/reprocess.ts
 * 分批執行：      LIMIT=100 npx tsx scripts/reprocess.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { ALLOWED_TAGS, TAG_ZH } from "../src/lib/tags";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const DRY_RUN = process.env.DRY_RUN === "true";
const LIMIT = parseInt(process.env.LIMIT ?? "9999", 10);

type Row = {
  id: string;
  title_zh: string | null;
  summary_zh: string | null;
  tags: string[] | null;
  content_snippet_zh: string | null;
};

async function reprocess(
  titleZh: string,
  snippetZh: string | null
): Promise<{ summary_zh: string; tags: string[]; raw: string }> {
  const hasContent = !!snippetZh && snippetZh.trim() !== titleZh.trim();

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `你是公民科技研究助理。請根據以下文章，生成：
1. 繁體中文摘要 summary_zh（100至150字，說明這是什麼專案或政策、解決什麼問題、在哪個國家/地區、有何重要意義）。${
          hasContent
            ? ""
            : "若僅有標題、資訊不足以擴寫，summary_zh 請直接回傳標題原文即可。"
        }
2. 從以下清單選 1-4 個最符合的標籤 tags（寧缺勿濫：只貼真正切合的，內容單薄就只給 1 個，不要硬湊；只能從清單選，不可自創）：
   ${ALLOWED_TAGS.join(", ")}

標題：${titleZh}
${hasContent ? `內容摘錄：${snippetZh!.slice(0, 600)}` : ""}

請用以下 JSON 格式回覆（不要有其他文字）：
{"summary_zh": "...", "tags": ["tag1", "tag2"]}`,
      },
    ],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const match = raw.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`無法解析回覆：${raw.slice(0, 120)}`);

  const parsed = JSON.parse(match[0]) as { summary_zh?: string; tags?: string[] };
  // 空標籤不視為錯誤：代表模型判斷此文非公民科技（呼叫端會略過）
  const tags = (parsed.tags ?? []).filter((t) => ALLOWED_TAGS.includes(t));

  return {
    summary_zh: parsed.summary_zh?.trim() || titleZh,
    tags,
    raw,
  };
}

function needsReprocess(a: Row): boolean {
  const tags = a.tags ?? [];
  const tagsBroken = tags.length === 0 || (tags.length === 1 && tags[0] === "civic-tech");
  // 只有「有內文可摘要、但摘要卻等於標題」才算摘要壞掉；
  // 沒內文的文章摘要本就只能是標題，不重複處理（避免重跑時浪費 token）
  const snippet = (a.content_snippet_zh ?? "").trim();
  const hasContent = snippet !== "" && snippet !== (a.title_zh ?? "").trim();
  const summaryBroken = hasContent && (a.summary_zh ?? "").trim() === (a.title_zh ?? "").trim();
  return tagsBroken || summaryBroken;
}

async function main() {
  const { data: all, error } = await supabase
    .from("articles")
    .select("id, title_zh, summary_zh, tags, content_snippet_zh")
    .eq("processed", true)
    .order("created_at", { ascending: false });

  if (error) { console.error("Supabase error:", error); process.exit(1); }
  if (!all?.length) { console.log("No processed articles."); return; }

  const rows = all as Row[];
  const todo = rows.filter(needsReprocess);
  const batch = todo.slice(0, LIMIT);

  console.log(`共 ${rows.length} 篇已處理文章，其中 ${todo.length} 篇需重新處理`);
  console.log(`本次處理：${batch.length} 篇${DRY_RUN ? "（DRY RUN，不寫入）" : ""}\n`);

  let ok = 0, fail = 0, withSummary = 0, skipped = 0;

  for (const a of batch) {
    try {
      const title = a.title_zh ?? "";
      const { summary_zh, tags, raw } = await reprocess(title, a.content_snippet_zh);

      // 模型判斷無任何切合的公民科技標籤 → 視為非公民科技，略過不寫（維持原樣）
      if (tags.length === 0) {
        console.log(`  ⤷ 略過（非公民科技，無切合標籤）：${title.slice(0, 40)}`);
        skipped++;
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }

      const zhLabels = tags.map((t) => TAG_ZH[t] ?? t).join("、");
      const gotRealSummary = summary_zh.trim() !== title.trim();
      if (gotRealSummary) withSummary++;

      if (DRY_RUN) {
        console.log(`[預覽] ${title.slice(0, 46)}`);
        console.log(`       摘要：${summary_zh.slice(0, 70)}${summary_zh.length > 70 ? "…" : ""}`);
        console.log(`       主題：${zhLabels}${gotRealSummary ? "" : "（無內文，僅重貼標籤）"}\n`);
      } else {
        await supabase
          .from("articles")
          .update({ summary_zh, tags })
          .eq("id", a.id);
        console.log(`  ✓ ${title.slice(0, 46)} → ${zhLabels}`);
      }
      ok++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ ${a.id}:`, err instanceof Error ? err.message : err);
      fail++;
    }
  }

  console.log(
    `\n完成：${ok} 篇${DRY_RUN ? "預覽" : "已更新"}（其中 ${withSummary} 篇有真摘要）` +
    `，${skipped} 篇略過（非公民科技），${fail} 篇失敗`
  );
}

main();
