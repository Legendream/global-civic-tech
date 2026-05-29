"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useBookmarks } from "@/lib/bookmarks";
import { type Article } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";

export default function BookmarksClient({ locale }: { locale: string }) {
  const { bookmarks, count, toggleBookmark } = useBookmarks();
  const t = useTranslations("bookmarks");
  const isZh = locale === "zh";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleExport = () => {
    const json = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civic-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("not array");
        const valid = parsed.filter(
          (item): item is Article =>
            typeof item === "object" && item !== null && typeof item.id === "string"
        );
        if (valid.length === 0) throw new Error("empty");

        // Merge: add imported items not already in bookmarks
        const existingIds = new Set(bookmarks.map((b) => b.id));
        const toAdd = valid.filter((a) => !existingIds.has(a.id));
        toAdd.forEach((a) => toggleBookmark(a));

        setImportMsg({
          ok: true,
          text: isZh
            ? `成功匯入 ${toAdd.length} 篇（已有 ${valid.length - toAdd.length} 篇重複略過）`
            : `Imported ${toAdd.length} item(s) (${valid.length - toAdd.length} duplicate(s) skipped)`,
        });
      } catch {
        setImportMsg({
          ok: false,
          text: isZh ? "檔案格式不正確，請確認是由本站匯出的 JSON 檔" : "Invalid file format — please use a JSON exported from this site",
        });
      }
      // Reset so same file can be re-imported if needed
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const StorageNotice = () => (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
      <div className="flex gap-2 items-start">
        <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
        <div className="space-y-1">
          <p className="font-medium text-amber-800">{t("noticeTitle")}</p>
          <p className="text-amber-700 leading-relaxed">{t("noticeBody")}</p>
        </div>
      </div>
      <div className="flex gap-2 items-start pl-6">
        <span className="text-amber-400">→</span>
        <p className="text-amber-700">{t("noticeTip")}</p>
      </div>
    </div>
  );

  const ActionBar = () => (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleExport}
        disabled={count === 0}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
        {t("exportBtn")}
      </button>

      <button
        onClick={() => { setImportMsg(null); fileInputRef.current?.click(); }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-300 hover:border-indigo-400 hover:text-indigo-700 text-zinc-600 text-sm font-medium transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
        {t("importBtn")}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
      />

      {importMsg && (
        <p className={`text-sm ${importMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
          {importMsg.ok ? "✓ " : "✗ "}{importMsg.text}
        </p>
      )}
    </div>
  );

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </div>
        <p className="text-zinc-900 font-medium mb-1">{t("empty")}</p>
        <p className="text-sm text-zinc-400 max-w-xs">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StorageNotice />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-zinc-400">
          {isZh ? `已收藏 ${count} 篇` : `${count} saved`}
        </p>
        <ActionBar />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </div>
  );
}
