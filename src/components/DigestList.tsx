"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { supabase, isRelevant, type DailyDigest, type Article } from "@/lib/supabase";
import { tagZh } from "@/lib/tags";
import AudioPlayer from "./AudioPlayer";
import ArticleCard from "./ArticleCard";
import DigestContent from "./DigestContent";

type Tab = "digest" | "search";

const DIGESTS_PAGE_SIZE = 30;

export default function DigestList({
  digests: initialDigests,
  locale,
}: {
  digests: DailyDigest[];
  locale: string;
}) {
  const t = useTranslations("digest");
  const isZh = locale === "zh";

  const [tab, setTab] = useState<Tab>("digest");

  // Digest tab state
  const [digests, setDigests] = useState<DailyDigest[]>(initialDigests);
  const [hasMoreDigests, setHasMoreDigests] = useState(initialDigests.length >= DIGESTS_PAGE_SIZE);
  const [loadingMoreDigests, setLoadingMoreDigests] = useState(false);
  const loadingMoreDigestsRef = useRef(false);
  const [selected, setSelected] = useState<string | null>(digests[0]?.date ?? null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Search tab state
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [tag, setTag] = useState("all");

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
        setArticles((data ?? []).filter(isRelevant));
        setLoadingArticles(false);
      });
  }, [selected]);

  useEffect(() => {
    if (tab !== "search" || allArticles.length > 0) return;
    setLoadingAll(true);
    supabase
      .from("articles")
      .select("*")
      .eq("processed", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setAllArticles((data ?? []).filter(isRelevant));
        setLoadingAll(false);
      });
  }, [tab, allArticles.length]);

  const loadMoreDigests = async () => {
    if (loadingMoreDigestsRef.current || !hasMoreDigests || digests.length === 0) return;
    loadingMoreDigestsRef.current = true;
    setLoadingMoreDigests(true);
    const oldestDate = digests[digests.length - 1].date;
    const { data } = await supabase
      .from("daily_digests")
      .select("*")
      .lt("date", oldestDate)
      .order("date", { ascending: false })
      .limit(DIGESTS_PAGE_SIZE);
    if (data && data.length > 0) {
      setDigests((prev) => [...prev, ...data]);
    }
    if (!data || data.length < DIGESTS_PAGE_SIZE) setHasMoreDigests(false);
    setLoadingMoreDigests(false);
    loadingMoreDigestsRef.current = false;
  };

  const handleDateScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth - el.scrollLeft - el.clientWidth < 200) {
      loadMoreDigests();
    }
  };

  const countries = useMemo(
    () => [...new Set(allArticles.map((a) => a.country).filter(Boolean))].sort() as string[],
    [allArticles]
  );
  const tags = useMemo(
    () => [...new Set(allArticles.flatMap((a) => a.tags))].sort(),
    [allArticles]
  );

  const filtered = useMemo(
    () =>
      allArticles.filter((a) => {
        if (type !== "all") {
          const isProject = a.source === "GitHub";
          if (type === "project" ? !isProject : isProject) return false;
        }
        if (country !== "all" && a.country !== country) return false;
        if (tag !== "all" && !a.tags.includes(tag)) return false;
        if (query) {
          const q = query.toLowerCase();
          const title = isZh ? a.title_zh : a.title_en;
          const summary = isZh ? a.summary_zh : a.summary_en;
          if (
            !title?.toLowerCase().includes(q) &&
            !summary?.toLowerCase().includes(q) &&
            !a.source.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [allArticles, type, country, tag, query, isZh]
  );

  if (digests.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
        {isZh ? "尚無歷史報告" : "No archive yet"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("digest")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            tab === "digest"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {isZh ? "📅 按日期瀏覽" : "📅 By Date"}
        </button>
        <button
          onClick={() => setTab("search")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            tab === "search"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {isZh ? "🔍 搜尋全部報導" : "🔍 Search All"}
        </button>
      </div>

      {/* Tab A: by date */}
      {tab === "digest" && (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
            onScroll={handleDateScroll}
          >
            {digests.map((d) => (
              <button
                key={d.date}
                onClick={() => setSelected(d.date)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  d.date === selected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300"
                }`}
              >
                {d.date}
              </button>
            ))}
            {loadingMoreDigests && (
              <div className="flex-shrink-0 px-4 py-2.5 text-sm text-zinc-400">
                {isZh ? "載入中…" : "Loading…"}
              </div>
            )}
          </div>

          {current ? (
            current.article_count === 0 ? (
              <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center space-y-2">
                <p className="text-zinc-600 text-sm font-medium">
                  {isZh ? "當日無新文章" : "No new articles"}
                </p>
                <p className="text-zinc-400 text-xs">
                  {isZh
                    ? "RSS 來源當天未發布新內容，系統已正常執行"
                    : "RSS sources published no new content that day"}
                </p>
              </div>
            ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              {current.audio_url && (
                <AudioPlayer
                  src={current.audio_url}
                  title={t("audioDigest")}
                  hint={t("audioHint")}
                />
              )}

              <div className="px-6 py-5">
                {!loadingArticles && articles.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-y-2 mb-5 pb-4 border-b border-zinc-100">
                    {[
                      { v: current.article_count, k: isZh ? "則入日報" : "in digest" },
                      { v: articles.length,        k: isZh ? "則收錄" : "collected" },
                      { v: new Set(articles.map((a) => a.country_code).filter(Boolean)).size, k: isZh ? "國家・地區" : "countries" },
                      { v: new Set(articles.flatMap((a) => a.tags)).size, k: isZh ? "主題標籤" : "topics" },
                    ].map((s, i) => (
                      <div key={s.k} className="flex items-center gap-x-4 whitespace-nowrap">
                        {i > 0 && <span className="text-xs text-zinc-200 select-none">·</span>}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold text-zinc-900 tabular-nums tech-mono leading-none">{s.v}</span>
                          <span className="text-xs text-zinc-400">{s.k}</span>
                        </div>
                      </div>
                    ))}
                    <span className="ml-auto text-xs text-zinc-300 tech-mono tracking-wide whitespace-nowrap">{current.date}</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 mb-4">
                    {current.date} · {current.article_count} {isZh ? "則入日報" : "in digest"}
                  </p>
                )}
                <DigestContent text={isZh ? current.content_zh : (current.content_en ?? current.content_zh)} />
              </div>

              <div className="border-t border-zinc-100 px-6 py-5">
                <h3 className="text-sm font-semibold text-zinc-700 mb-4">
                  {isZh ? "收錄報導" : "Articles in this digest"}
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
                    {isZh ? "無對應報導資料" : "No article data available"}
                  </p>
                )}
              </div>
            </div>
            )
          ) : (
            <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
              {isZh ? "請選擇日期" : "Select a date"}
            </div>
          )}
        </>
      )}

      {/* Tab B: search all */}
      {tab === "search" && (
        <div className="space-y-5">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={isZh ? "搜尋標題、摘要…" : "Search title, summary…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>

          {loadingAll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  {isZh ? "類型" : "Type"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "all", label: isZh ? "全部" : "All" },
                    { key: "project", label: isZh ? "專案" : "Project" },
                    { key: "article", label: isZh ? "報導" : "Article" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setType(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                        type === opt.key
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  {isZh ? "國家 / 地區" : "Country / Region"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["all", ...countries].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCountry(c)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                        country === c
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {c === "all" ? (isZh ? "全部" : "All") : c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  {isZh ? "主題" : "Topic"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["all", ...tags].map((tg) => (
                    <button
                      key={tg}
                      onClick={() => setTag(tg)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                        tag === tg
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-white border border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {tg === "all" ? (isZh ? "全部" : "All") : (isZh ? tagZh(tg) : tg)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  {filtered.length} {isZh ? "則結果" : "results"}
                </span>
                {(type !== "all" || country !== "all" || tag !== "all" || query) && (
                  <button
                    onClick={() => { setType("all"); setCountry("all"); setTag("all"); setQuery(""); }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {isZh ? "清除篩選" : "Clear filters"}
                  </button>
                )}
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((article) => (
                    <ArticleCard key={article.id} article={article} locale={locale} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
                  {isZh ? "無符合條件的報導" : "No matching articles"}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
