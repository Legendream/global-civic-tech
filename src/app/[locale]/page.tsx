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
  const [digest, articles] = await Promise.all([getTodayDigest(), getRecentArticles()]);
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
              <div className="px-6 pt-5 pb-4 border-b border-zinc-100 bg-indigo-50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4 ml-0.5">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">{t("audioDigest")}</p>
                    <p className="text-xs text-indigo-500">{t("audioHint")}</p>
                  </div>
                </div>
                <AudioPlayer src={digest.audio_url} />
              </div>
            )}

            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4 text-xs text-zinc-400">
                <span>{digest.date}</span>
                <span>·</span>
                <span>{digest.article_count} {isZh ? "則案例" : "cases"}</span>
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

      {/* Recent cases */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-800">{t("recentCases")}</h2>
          <Link
            href={`/${locale}/cases`}
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
            {isZh ? "尚無案例資料" : "No cases yet"}
          </div>
        )}
      </section>
    </div>
  );
}
