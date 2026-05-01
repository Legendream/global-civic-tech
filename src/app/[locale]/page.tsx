export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, type Article, type DailyDigest } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";

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
  const [digest, articles] = await Promise.all([
    getTodayDigest(),
    getRecentArticles(),
  ]);

  const isZh = locale === "zh";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <section>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">{t("title")}</h1>
        <p className="text-zinc-500">{t("subtitle")}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">
          {t("todayDigest")}
        </h2>
        {digest ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-zinc-400">
              <span>{digest.date}</span>
              <span>·</span>
              <span>
                {digest.article_count}{" "}
                {isZh ? "則案例" : "cases"}
              </span>
            </div>
            <div className="prose prose-zinc prose-sm max-w-none whitespace-pre-wrap">
              {isZh ? digest.content_zh : digest.content_en}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
            {t("noDigest")}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-800">
            {t("recentCases")}
          </h2>
          <a
            href={`/${locale}/cases`}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {t("viewAll")} →
          </a>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
            {isZh ? "尚無案例資料" : "No cases yet"}
          </div>
        )}
      </section>
    </div>
  );
}
