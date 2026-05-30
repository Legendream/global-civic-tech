export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, isRelevant, type Article, type DailyDigest } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import AudioPlayer from "@/components/AudioPlayer";
import DigestErrorCard from "@/components/DigestErrorCard";
import DigestContent from "@/components/DigestContent";
import Link from "next/link";

type DigestResult =
  | { status: "ready"; digest: DailyDigest }
  | { status: "pending" }
  | { status: "error" };

async function getTodayDigest(): Promise<DigestResult> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("daily_digests")
      .select("*")
      .eq("date", today)
      .single();
    if (error && error.code !== "PGRST116") return { status: "error" };
    if (!data) return { status: "pending" };
    return { status: "ready", digest: data };
  } catch {
    return { status: "error" };
  }
}

async function getTodayArticles(date: string): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lte("created_at", `${date}T23:59:59.999Z`)
    .order("published_at", { ascending: false });
  return (data ?? []).filter(isRelevant);
}

async function getRecentArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .neq("source", "GitHub")
    .order("published_at", { ascending: false })
    .limit(18);
  return (data ?? []).filter(isRelevant).slice(0, 12);
}

function DigestStatRow({ articles, date }: { articles: Article[]; date: string }) {
  const countries = new Set(articles.map((a) => a.country_code).filter(Boolean));
  const tags = new Set(articles.flatMap((a) => a.tags));
  const sources = new Set(articles.map((a) => a.source).filter(Boolean));

  const stats = [
    { v: articles.length, k: "則報導" },
    { v: countries.size, k: "國家・地區" },
    { v: tags.size, k: "主題標籤" },
    { v: sources.size, k: "資料來源" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5 pb-4 border-b border-zinc-100">
      {stats.map((s) => (
        <div key={s.k} className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-xl font-bold text-zinc-900 tabular-nums tech-mono leading-none">{s.v}</span>
          <span className="text-xs text-zinc-400">{s.k}</span>
        </div>
      ))}
      <span className="ml-auto text-xs text-zinc-300 tech-mono tracking-wide whitespace-nowrap">{date}</span>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const today = new Date().toISOString().split("T")[0];
  const result = await getTodayDigest();
  const articles =
    result.status === "ready"
      ? await getTodayArticles(today)
      : await getRecentArticles();
  const isZh = locale === "zh";

  // Taiwan time (UTC+8) for pending state messaging
  const nowUTC = new Date();
  const twHour = (nowUTC.getUTCHours() + 8) % 24;
  const twMinuteOfDay = twHour * 60 + nowUTC.getUTCMinutes();
  const pendingMsg =
    twMinuteOfDay < 8 * 60
      ? { title: "今日摘要尚未生成", body: "每日 08:00 自動彙整，今天的內容稍後就會出現。", sub: "下次更新 · 今日 08:00 (UTC+8)" }
      : twMinuteOfDay < 9 * 60 + 30
      ? { title: "今日摘要正在生成中", body: "排程已在 08:00 啟動，通常需要幾分鐘完成，稍後重新整理頁面即可看到。", sub: "GitHub Actions 排程執行中，預計數分鐘後出現" }
      : { title: "今日摘要尚未出現", body: "預計 08:00 的更新延遲了，系統可能暫時忙碌，請稍後再試。", sub: "若持續未更新，歡迎至 GitHub 回報問題" };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero masthead */}
      {(() => {
        const [yy, mm, dd] = (today || "----01-01").split("-");
        return (
          <section className="mh relative pt-2">
            <span className="mh-tick tl" aria-hidden="true"></span>
            <span className="mh-tick tr" aria-hidden="true"></span>
            <span className="mh-tick bl" aria-hidden="true"></span>
            <span className="mh-tick br" aria-hidden="true"></span>
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-7 sm:gap-9">
              <div className="flex-1 flex flex-col justify-center gap-3.5 min-w-0">
                <div className="mh-eyebrow">
                  <span className="mh-live" aria-hidden="true"></span>
                  GLOBAL CIVIC TECH · DAILY DISPATCH
                </div>
                <h1 className="mh-title text-zinc-900">全球公民科技動態</h1>
                <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
                  每日自動彙整全球公民科技最新消息，繁體中文呈現
                </p>
              </div>
              <div className="flex flex-row sm:flex-col justify-start sm:justify-center items-baseline sm:items-end gap-x-4 gap-y-1 sm:gap-1 sm:pl-9 sm:border-l border-zinc-200 shrink-0">
                <div className="mh-edition text-zinc-400 order-1 sm:order-none w-full text-left sm:text-right whitespace-nowrap">TODAY · 今日版</div>
                <div className="mh-day order-3 sm:order-none">{dd}</div>
                <div className="mh-ym text-zinc-600 order-2 sm:order-none">{yy} / {mm}</div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Today's digest */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-4">{t("todayDigest")}</h2>

        {result.status === "error" && <DigestErrorCard />}

        {result.status === "pending" && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-900 font-medium mb-1">{pendingMsg.title}</p>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
              {pendingMsg.body}
            </p>
            <p className="text-xs text-zinc-400 tech-mono mt-3">{pendingMsg.sub}</p>
          </div>
        )}

        {result.status === "ready" && (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            {result.digest.audio_url && (
              <AudioPlayer
                src={result.digest.audio_url}
                title={t("audioDigest")}
                hint={t("audioHint")}
              />
            )}
            <div className="px-6 py-5">
              <DigestStatRow articles={articles} date={result.digest.date} />
              <DigestContent text={isZh ? result.digest.content_zh : (result.digest.content_en ?? result.digest.content_zh)} />
            </div>
          </div>
        )}
      </section>

      {/* Today's / Recent cases */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">
            {result.status === "ready" ? t("todayCases") : t("recentCases")}
            {result.status === "ready" && articles.length > 0 && (
              <span className="ml-2 text-sm font-normal text-zinc-400">
                · {articles.length} {isZh ? "則" : "articles"}
              </span>
            )}
          </h2>
          <Link
            href={`/${locale}/digest`}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {t("viewAll")} →
          </Link>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400 text-sm">
            {isZh ? "尚無報導資料" : "No articles yet"}
          </div>
        )}
      </section>
    </div>
  );
}
