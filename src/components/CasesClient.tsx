"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { type Article } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";

export default function CasesClient({
  articles,
  countries,
  tags,
  locale,
}: {
  articles: Article[];
  countries: string[];
  tags: string[];
  locale: string;
}) {
  const t = useTranslations("cases");
  const isZh = locale === "zh";
  const [type, setType] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
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
    [articles, type, country, tag, query, isZh]
  );

  const hasActiveFilter = type !== "all" || country !== "all" || tag !== "all" || query !== "";

  return (
    <div className="space-y-6">
      {/* Search */}
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
          placeholder={t("searchPlaceholder")}
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

      {/* Type chips */}
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">{t("filterType")}</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: t("filterAll") },
            { key: "project", label: t("typeProject") },
            { key: "article", label: t("typeArticle") },
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

      {/* Country chips */}
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">{t("filterCountry")}</p>
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
              {c === "all" ? t("filterAll") : c}
            </button>
          ))}
        </div>
      </div>

      {/* Tag chips */}
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">{t("filterTag")}</p>
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
              {tg === "all" ? t("filterAll") : tg}
            </button>
          ))}
        </div>
      </div>

      {/* Result count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {filtered.length} {isZh ? t("results") : t("results")}
        </span>
        {hasActiveFilter && (
          <button
            onClick={() => { setType("all"); setCountry("all"); setTag("all"); setQuery(""); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            {isZh ? "清除篩選" : "Clear filters"}
          </button>
        )}
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
          {t("noResults")}
        </div>
      )}
    </div>
  );
}
