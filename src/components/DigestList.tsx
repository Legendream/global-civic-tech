"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { supabase, type DailyDigest, type Article } from "@/lib/supabase";
import AudioPlayer from "./AudioPlayer";
import ArticleCard from "./ArticleCard";

export default function DigestList({
  digests,
  locale,
}: {
  digests: DailyDigest[];
  locale: string;
}) {
  const t = useTranslations("digest");
  const isZh = locale === "zh";
  const [selected, setSelected] = useState<string | null>(digests[0]?.date ?? null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const current = digests.find((d) => d.date === selected);

  useEffect(() => {
    if (!selected) return;
    setLoadingArticles(true);
    supabase
      .from("articles")
      .select("*")
      .eq("processed", true)
      .gte("created_at", `${selected}T00:00:00.000Z`)
      .lte("created_at", `${selected}T23:59:59.999Z`)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setArticles(data ?? []);
        setLoadingArticles(false);
      });
  }, [selected]);

  if (digests.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
        {isZh ? "尚無歷史報告" : "No archive yet"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {digests.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelected(d.date)}
            className={`flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              d.date === selected
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300"
            }`}
          >
            <span className="font-medium">{d.date}</span>
            <span className={`text-xs mt-0.5 ${d.date === selected ? "text-indigo-200" : "text-zinc-400"}`}>
              {d.article_count} {isZh ? "則" : "cases"}
            </span>
          </button>
        ))}
      </div>

      {current ? (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Audio player */}
          {current.audio_url && (
            <AudioPlayer
              src={current.audio_url}
              title={t("audioDigest")}
              hint={t("audioHint")}
            />
          )}

          {/* Digest text */}
          <div className="px-6 py-5">
            <p className="text-xs text-zinc-400 mb-4">
              {current.date} · {current.article_count} {isZh ? "則案例" : "cases"}
            </p>
            <div className="prose prose-zinc prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-zinc-700">
              {isZh ? current.content_zh : current.content_en}
            </div>
          </div>

          {/* Corresponding articles */}
          <div className="border-t border-zinc-100 px-6 py-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">
              {isZh ? "今日收錄案例" : "Cases in this digest"}
              {!loadingArticles && articles.length > 0 && (
                <span className="ml-2 font-normal text-zinc-400">
                  · {articles.length} {isZh ? "則" : "items"}
                </span>
              )}
            </h3>

            {loadingArticles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                {isZh ? "無對應案例資料" : "No article data available"}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
          {isZh ? "請選擇日期" : "Select a date"}
        </div>
      )}
    </div>
  );
}
