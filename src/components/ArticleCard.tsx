import { type Article } from "@/lib/supabase";
import { useTranslations } from "next-intl";

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
  const isZh = locale === "zh";
  const title = isZh ? (article.title_zh ?? article.title_original) : (article.title_en ?? article.title_original);
  const summary = isZh ? article.summary_zh : article.summary_en;
  const flag = article.country_code ? FLAG_EMOJI[article.country_code] ?? "🌐" : "🌐";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString(isZh ? "zh-TW" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-lg leading-none">{flag}</span>
        <span className="text-xs text-zinc-400 whitespace-nowrap">{article.source}</span>
      </div>

      <div>
        <h3 className="font-medium text-zinc-900 text-sm leading-snug line-clamp-2">
          {title}
        </h3>
        {summary && (
          <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed line-clamp-3">
            {summary}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        {date && <span className="text-xs text-zinc-400">{date}</span>}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors ml-auto"
        >
          {isZh ? "閱讀原文 →" : "Read →"}
        </a>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
