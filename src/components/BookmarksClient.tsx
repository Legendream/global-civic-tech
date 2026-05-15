"use client";

import { useBookmarks } from "@/lib/bookmarks";
import ArticleCard from "./ArticleCard";

export default function BookmarksClient({ locale }: { locale: string }) {
  const { bookmarks, count } = useBookmarks();
  const isZh = locale === "zh";

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </div>
        <p className="text-zinc-900 font-medium mb-1">
          {isZh ? "靈感庫是空的" : "No bookmarks yet"}
        </p>
        <p className="text-sm text-zinc-400 max-w-xs">
          {isZh
            ? "在案例列表中點擊書籤圖示，將感興趣的文章加入靈感庫"
            : "Click the bookmark icon on any article card to save it here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        {isZh ? `已收藏 ${count} 篇` : `${count} saved`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </div>
  );
}
