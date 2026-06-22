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
  {
    name: "OECD-OPSI",
    url: "https://oecd-opsi.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["public-service", "civic-tech", "open-source"],
  },
  {
    name: "Open Government Partnership",
    url: "https://opengovpart.medium.com/feed",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["transparency", "e-participation", "open-data"],
  },
  {
    name: "Decidim",
    url: "https://decidim.org/blog/feed.xml",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["e-participation", "open-source", "civic-tech"],
  },
  {
    name: "Open Contracting Partnership",
    url: "https://www.open-contracting.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["transparency", "anti-corruption", "open-data"],
  },
  {
    name: "PublicTechnology",
    url: "https://www.publictechnology.net/feed/",
    country: "United Kingdom",
    country_code: "GB",
    language: "en",
    tags: ["public-service", "govtech", "civic-tech"],
  },
  {
    name: "Smart Cities Dive",
    url: "https://www.smartcitiesdive.com/feeds/news/",
    country: "United States",
    country_code: "US",
    language: "en",
    tags: ["public-service", "open-data", "civic-tech"],
  },
  {
    name: "Code for Africa",
    url: "https://medium.com/feed/code-for-africa",
    country: "Africa",
    country_code: null,
    language: "en",
    tags: ["civic-tech", "africa", "data-journalism"],
  },
  {
    name: "Code for Japan",
    url: "https://medium.com/feed/code-for-japan",
    country: "Japan",
    country_code: "JP",
    language: "en",
    tags: ["civic-tech", "japan", "open-data"],
  },
  {
    name: "CivicDataLab",
    url: "https://medium.com/feed/civicdatalab",
    country: "India",
    country_code: "IN",
    language: "en",
    tags: ["civic-tech", "india", "open-data"],
  },
  {
    name: "GovTech Singapore",
    url: "https://medium.com/feed/singapore-gds",
    country: "Singapore",
    country_code: "SG",
    language: "en",
    tags: ["govtech", "singapore", "public-service"],
  },
  {
    name: "Open Knowledge Foundation",
    url: "https://blog.okfn.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["open-data", "open-knowledge", "transparency"],
  },
  {
    name: "Global Voices Advox",
    url: "https://advox.globalvoices.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["digital-rights", "civic-tech", "press-freedom"],
  },
  {
    name: "Open Culture Foundation",
    url: "https://ocf.tw/feed.xml",
    country: "Taiwan",
    country_code: "TW",
    language: "zh",
    tags: ["open-data", "open-source", "civic-tech", "transparency"],
  },
  {
    name: "Open Source Society PH",
    url: "https://blog.ossph.org/feed",
    country: "Philippines",
    country_code: "PH",
    language: "en",
    tags: ["civic-tech", "open-source", "philippines"],
  },
  {
    name: "Mozilla Foundation",
    url: "https://blog.mozilla.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["digital-rights", "open-source", "civic-tech"],
  },
  {
    name: "e-Estonia",
    url: "https://e-estonia.com/feed/",
    country: "Estonia",
    country_code: "EE",
    language: "en",
    tags: ["govtech", "public-service", "e-participation"],
  },
  {
    name: "Access Now",
    url: "https://www.accessnow.org/feed/",
    country: "International",
    country_code: null,
    language: "en",
    tags: ["digital-rights", "civic-tech", "transparency"],
  },
  {
    name: "Codeando México",
    url: "https://medium.com/feed/codeandomexico",
    country: "Mexico",
    country_code: "MX",
    language: "es",
    tags: ["civic-tech", "open-source", "e-participation"],
  },
];

/**
 * 把 README 的 markdown 清成純文字摘錄，去掉 badge／圖片／連結／程式碼框等雜訊，
 * 讓後續翻譯與摘要拿到的是「這工具在做什麼」，而不是一堆標記符號。
 */
export function cleanReadme(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")          // 圍欄程式碼區塊
    .replace(/`([^`]+)`/g, "$1")               // 行內程式碼
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // 圖片（含 badge）
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // 連結 → 只留文字
    .replace(/<!--[\s\S]*?-->/g, " ")          // HTML 註解
    .replace(/<[^>]+>/g, " ")                   // HTML 標籤
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")        // 標題符號
    .replace(/^\s{0,3}>\s?/gm, "")              // 引言
    .replace(/^\s{0,3}[-*+]\s+/gm, "")         // 無序清單
    .replace(/^\s{0,3}\d+\.\s+/gm, "")         // 有序清單
    .replace(/^[\s:|-]{3,}$/gm, " ")           // 表格分隔列
    .replace(/\|/g, " ")                        // 表格直線
    .replace(/[*_~]{1,3}/g, "")                // 粗體／斜體／刪除線標記
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** 抓單一 repo 的 README 原文（raw），失敗回 null（無 README 或被限流）。 */
async function fetchReadme(
  fullName: string,
  headers: Record<string, string>
): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
    });
    if (!res.ok) return null;
    const raw = await res.text();
    const cleaned = cleanReadme(raw).slice(0, 800);
    return cleaned.length >= 40 ? cleaned : null; // 太短的不值得當摘錄
  } catch {
    return null;
  }
}

// GitHub Topics API for civic-tech / govtech / open-data repos updated recently
async function fetchGitHubRepos() {
  // 正式排程用 GITHUB_TOKEN，本機 .env.local 用 GH_TOKEN，兩種名字都接受
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 收緊查詢：要求星數 ≥10 且近期有更新，過濾掉大量低品質/無關 repo
  const res = await fetch(
    "https://api.github.com/search/repositories?q=topic:civic-tech+OR+topic:govtech+OR+topic:open-data+stars:>=10+pushed:>2024-01-01&sort=updated&per_page=20",
    { headers }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const repos = (data.items ?? [])
    // 沒有描述的 repo 多半是雜訊（例：「無描述」「{build}」），略過
    .filter((repo: Record<string, unknown>) => !!(repo.description as string | null)?.trim());

  const inserts: Record<string, unknown>[] = [];
  for (const repo of repos) {
    // 抓 README 當內文摘錄：讓摘要從「一行描述」升級成「這工具在做什麼」
    const readme = await fetchReadme(repo.full_name as string, headers);
    inserts.push({
      title_original: (repo.description as string | null) || (repo.name as string),
      url: repo.html_url as string,
      source: "GitHub",
      country: null,
      country_code: null,
      tags: ["civic-tech", "open-source", "github"],
      language_original: "en",
      published_at: repo.pushed_at as string,
      content_snippet: readme,
      processed: false,
    });
  }
  return inserts;
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
