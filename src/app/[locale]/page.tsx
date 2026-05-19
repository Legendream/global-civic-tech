export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, type Article, type DailyDigest } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import AudioPlayer from "@/components/AudioPlayer";
import Link from "next/link";

async function getTodayDigest(): Promise<DailyDigest | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_digests")
    .select("*")
    .eq("date", today)
    .single();
  return data;
}

async function getTodayArticles(date: string): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lte("created_at", `${date}T23:59:59.999Z`)
    .order("published_at", { ascending: false });
  return data ?? [];
}

async function getRecentArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .neq("source", "GitHub")
    .order("published_at", { ascending: false })
    .limit(12);
  return data ?? [];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const today = new Date().toISOString().split("T")[0];
  const digest = await getTodayDigest();
  const articles = digest
    ? await getTodayArticles(today)
    : await getRecentArticles();
  const isZh = locale === "zh";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <section>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">{t("title")}</h1>
        <p className="text-zinc-500 text-sm">{t("subtitle")}</p>
      </section>

      {/* Today's digest */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-4">{t("todayDigest")}</h2>
        {digest ? (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            {/* Audio player */}
            {digest.audio_url && (
              <AudioPlayer
                src={digest.audio_url}
                title={t("audioDigest")}
                hint={t("audioHint")}
              />
            )}

            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4 text-xs text-zinc-400">
                <span>{digest.date}</span>
                <span>·</span>
                <span>{digest.article_count} {isZh ? "則報導" : "articles"}</span>
              </div>
              <div className="prose prose-zinc prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-zinc-700">
                {isZh ? digest.content_zh : digest.content_en}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400 text-sm">
            {t("noDigest")}
          </div>
        )}
      </section>

      {/* Today's / Recent cases */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">
            {digest ? t("todayCases") : t("recentCases")}
            {digest && articles.length > 0 && (
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
