"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type DailyDigest } from "@/lib/supabase";
import AudioPlayer from "@/components/AudioPlayer";

export default function DigestList({
  digests,
  locale,
}: {
  digests: DailyDigest[];
  locale: string;
}) {
  const t = useTranslations("digest");
  const [selected, setSelected] = useState<string | null>(digests[0]?.date ?? null);
  const isZh = locale === "zh";
  const current = digests.find((d) => d.date === selected);

  if (digests.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
        {isZh ? "尚無歷史報告" : "No archive yet"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date chips — horizontal scroll */}
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

      {/* Content */}
      {current ? (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Audio player */}
          {current.audio_url && (
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
              <AudioPlayer src={current.audio_url} />
            </div>
          )}

          {/* Text content */}
          <div className="px-6 py-5">
            <p className="text-xs text-zinc-400 mb-4">
              {current.date} · {current.article_count} {isZh ? "則案例" : "cases"}
            </p>
            <div className="prose prose-zinc prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-zinc-700">
              {isZh ? current.content_zh : current.content_en}
            </div>
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
