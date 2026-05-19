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
    name: "GovTech Review",
    url: "https://www.govtechreview.com.au/feed.rss",
    country: "Australia",
    country_code: "AU",
    language: "en",
    tags: ["public-service", "open-data", "civic-tech"],
  },
  {
    name: "GDS Blog",
    url: "https://gds.blog.gov.uk/feed/",
    country: "United Kingdom",
    country_code: "GB",
    language: "en",
    tags: ["public-service", "open-source", "transparency"],
  },
  {
    name: "Nextgov",
    url: "https://www.nextgov.com/rss/all/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["public-service", "ai-governance", "civic-tech"],
  },
  {
    name: "Federal News Network",
    url: "https://federalnewsnetwork.com/feed/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["public-service", "transparency", "civic-tech"],
  },
  {
    name: "Government Technology",
    url: "https://www.govtech.com/rss.rss",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["govtech", "public-service", "civic-tech"],
  },
  {
    name: "StateScoop",
    url: "https://statescoop.com/feed/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["govtech", "public-service", "open-data"],
  },
  {
    name: "FedScoop",
    url: "https://fedscoop.com/feed/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["govtech", "public-service", "ai-governance"],
  },
  {
    name: "The GovLab",
    url: "https://blog.thegovlab.org/feed",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["civic-tech", "open-data", "e-participation"],
  },
  {
    name: "Endstate",
    url: "https://endstate.substack.com/feed",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["civic-tech", "public-service", "digital-rights"],
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
    "https://api.github.com/search/repositories?q=topic:civic-tech+OR+topic:govtech+pushed:>2020-01-01&sort=updated&per_page=20",
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
        const snippet = (item.contentSnippet ?? item.content ?? "").slice(0, 800) || null;
        inserts.push({
          title_original: item.title,
          url: item.link,
          source: source.name,
          country: source.country,
          country_code: source.country_code,
          tags: source.tags,
          language_original: source.language,
          published_at: item.pubDate ?? item.isoDate ?? null,
          content_snippet: snippet,
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

  // Upsert by URL to avoid duplicates; ignoreDuplicates=true skips existing rows
  const { data: inserted, error } = await supabase
    .from("articles")
    .upsert(inserts, { onConflict: "url", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("Supabase insert error:", error);
    process.exit(1);
  }

  const newCount = inserted?.length ?? 0;
  console.log(`\nDone. ${newCount} new articles inserted (${inserts.length} fetched, ${inserts.length - newCount} already existed).`);
}

main();
