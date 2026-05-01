"use client";

import { useState, useMemo } from "react";
import { type Article } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";

const FLAG_EMOJI: Record<string, string> = {
  TW: "🇹🇼", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷",
  JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", BR: "🇧🇷", AU: "🇦🇺",
  CA: "🇨🇦", SG: "🇸🇬", KE: "🇰🇪", NG: "🇳🇬", ZA: "🇿🇦",
};

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
  const isZh = locale === "zh";
  const [country, setCountry] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
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
    [articles, country, tag, query, isZh]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={isZh ? "搜尋..." : "Search..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <option value="all">{isZh ? "全部國家" : "All Countries"}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <option value="all">{isZh ? "全部標籤" : "All Tags"}</option>
          {tags.map((tg) => (
            <option key={tg} value={tg}>
              {tg}
            </option>
          ))}
        </select>

        <span className="text-sm text-zinc-400 flex items-center">
          {filtered.length} {isZh ? "則" : "results"}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
          {isZh ? "無符合條件的案例" : "No matching cases"}
        </div>
      )}
    </div>
  );
}
