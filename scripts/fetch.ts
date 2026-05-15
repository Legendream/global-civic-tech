/**
 * 從 RSS feeds 抓取公民科技文章，存入 Supabase（未處理狀態）
 * 執行：npx tsx scripts/fetch.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import RSSParser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type FeedSource = {
  name: string;
  url: string;
  country: string;
  country_code: string | null;
  language: string;
  tags: string[];
};

const SOURCES: FeedSource[] = [
  {
    name: "Code for All",
    url: "https://codeforall.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["civic-tech", "international"],
  },
  {
    name: "mySociety",
    url: "https://www.mysociety.org/feed/",
    country: "United Kingdom",
    country_code: "GB",
    language: "en",
    tags: ["civic-tech", "uk", "democracy"],
  },
  {
    name: "Beeck Center",
    url: "https://beeckcenter.georgetown.edu/feed/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["civic-tech", "us", "government"],
  },
  {
    name: "Nesta",
    url: "https://www.nesta.org.uk/feed/",
    country: "United Kingdom",
    country_code: "GB",
    language: "en",
    tags: ["civic-tech", "innovation", "uk"],
  },
];

// GitHub Topics API for civic-tech repos updated recently
async function fetchGitHubRepos() {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    "https://api.github.com/search/repositories?q=topic:civic-tech+pushed:>2020-01-01&sort=updated&per_page=20",
    { headers }
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((repo: Record<string, unknown>) => ({
    title_original: (repo.description as string | null) || (repo.name as string),
    url: repo.html_url as string,
    source: "GitHub",
    country: null,
    country_code: null,
    tags: ["civic-tech", "open-source", "github"],
    language_original: "en",
    published_at: repo.pushed_at as string,
    processed: false,
  }));
}

async function main() {
  const parser = new RSSParser({ timeout: 10000 });
  const inserts: Record<string, unknown>[] = [];

  for (const source of SOURCES) {
    try {
      console.log(`Fetching ${source.name}...`);
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items.slice(0, 20)) {
        if (!item.link || !item.title) continue;
        inserts.push({
          title_original: item.title,
          url: item.link,
          source: source.name,
          country: source.country,
          country_code: source.country_code,
          tags: source.tags,
          language_original: source.language,
          published_at: item.pubDate ?? item.isoDate ?? null,
          processed: false,
        });
      }
      console.log(`  → ${feed.items.length} items`);
    } catch (err) {
      console.error(`  ✗ Failed to fetch ${source.name}:`, err);
    }
  }

  // GitHub repos
  try {
    console.log("Fetching GitHub repos...");
    const repos = await fetchGitHubRepos();
    inserts.push(...repos);
    console.log(`  → ${repos.length} repos`);
  } catch (err) {
    console.error("  ✗ Failed to fetch GitHub:", err);
  }

  if (inserts.length === 0) {
    console.log("No articles to insert.");
    return;
  }

  // Upsert by URL to avoid duplicates
  const { error, count } = await supabase
    .from("articles")
    .upsert(inserts, { onConflict: "url", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("Supabase insert error:", error);
    process.exit(1);
  }

  console.log(`\nDone. Inserted/upserted ${count ?? inserts.length} articles.`);
}

main();
