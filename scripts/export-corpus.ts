/**
 * 把已處理文章的標題+摘要匯出到 output/corpus.json
 * 供主題分析使用（不呼叫任何付費 API）
 * 執行：npx tsx scripts/export-corpus.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from("articles")
    .select("title_zh, summary_zh, source, country")
    .eq("processed", true)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); process.exit(1); }

  mkdirSync("output", { recursive: true });
  const rows = (data ?? []).map((a) => ({
    t: a.title_zh,
    s: (a.summary_zh ?? "").slice(0, 200),
    src: a.source,
    c: a.country,
  }));
  writeFileSync("output/corpus.json", JSON.stringify(rows, null, 1));
  console.log(`已匯出 ${rows.length} 篇到 output/corpus.json`);
}

main();
