"use client";

import { useTranslations } from "next-intl";
import { type Article } from "@/lib/supabase";
import { useBookmarks } from "@/lib/bookmarks";

const FLAG_EMOJI: Record<string, string> = {
  TW: "🇹🇼", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷",
  JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", BR: "🇧🇷", AU: "🇦🇺",
  CA: "🇨🇦", SG: "🇸🇬", KE: "🇰🇪", NG: "🇳🇬", ZA: "🇿🇦",
};

export default function ArticleCard({
  article,
  locale,
}: {
  article: Article;
  locale: string;
}) {
  const t = useTranslations("home");
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.id);
  const isZh = locale === "zh";

  const title = isZh ? (article.title_zh ?? article.title_original) : (article.title_en ?? article.title_original);
  const summary = isZh ? article.summary_zh : article.summary_en;
  const preview = article.content_snippet ?? summary;
  const flag = article.country_code ? FLAG_EMOJI[article.country_code] ?? "🌐" : "🌐";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString(isZh ? "zh-TW" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  return (
    <div className="group bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none shrink-0">{flag}</span>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full truncate">
            {article.source}
          </span>
        </div>
        <button
          onClick={() => toggleBookmark(article)}
          aria-label={bookmarked ? (isZh ? "取消收藏" : "Remove bookmark") : (isZh ? "加入靈感庫" : "Save to bookmarks")}
          className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
            bookmarked
              ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              : "text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          {bookmarked ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2 mb-1.5">
          {title}
        </h3>
        {preview && (
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-4">
            {preview}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50">
        {date && <span className="text-xs text-zinc-400">{date}</span>}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors ml-auto cursor-pointer"
        >
          {t("readMore")} →
        </a>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-zinc-50 text-zinc-400 text-xs rounded border border-zinc-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
