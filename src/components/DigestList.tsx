"use client";

import { useState } from "react";
import { type DailyDigest } from "@/lib/supabase";

export default function DigestList({
  digests,
  locale,
}: {
  digests: DailyDigest[];
  locale: string;
}) {
  const [selected, setSelected] = useState<string | null>(
    digests[0]?.date ?? null
  );
  const isZh = locale === "zh";

  const current = digests.find((d) => d.date === selected);

  if (digests.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
        {isZh ? "尚無歷史報告" : "No archive yet"}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-48 flex-shrink-0">
        <ul className="space-y-1">
          {digests.map((d) => (
            <li key={d.date}>
              <button
                onClick={() => setSelected(d.date)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  d.date === selected
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <div>{d.date}</div>
                <div className={`text-xs mt-0.5 ${d.date === selected ? "text-zinc-300" : "text-zinc-400"}`}>
                  {d.article_count} {isZh ? "則" : "cases"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1">
        {current ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-4">
              {current.date} · {current.article_count} {isZh ? "則案例" : "cases"}
            </div>
            <div className="prose prose-zinc prose-sm max-w-none whitespace-pre-wrap">
              {isZh ? current.content_zh : current.content_en}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400">
            {isZh ? "請選擇日期" : "Select a date"}
          </div>
        )}
      </div>
    </div>
  );
}
