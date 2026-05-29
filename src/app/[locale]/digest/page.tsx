export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, type DailyDigest } from "@/lib/supabase";
import DigestList from "@/components/DigestList";

async function getDigests(): Promise<DailyDigest[]> {
  const { data } = await supabase
    .from("daily_digests")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);
  return data ?? [];
}

async function getArchiveStats() {
  const { data } = await supabase
    .from("articles")
    .select("country_code, tags")
    .eq("processed", true);
  if (!data) return { countries: 0, tags: 0 };
  const countries = new Set(data.map((a) => a.country_code).filter(Boolean)).size;
  const tags = new Set(data.flatMap((a) => (a.tags as string[]) || [])).size;
  return { countries, tags };
}

export default async function DigestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("digest");
  const [digests, archiveStats] = await Promise.all([getDigests(), getArchiveStats()]);

  const totalArticles = digests.reduce((sum, d) => sum + (d.article_count ?? 0), 0);
  const stats = [
    { v: digests.length,        k: "報告天數" },
    { v: totalArticles,         k: "累計報導" },
    { v: archiveStats.countries, k: "涵蓋國家" },
    { v: archiveStats.tags,      k: "主題標籤" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
        {digests.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.k} className="bg-white border border-zinc-200 rounded-xl px-4 py-3">
                <div className="text-2xl font-bold text-zinc-900 tabular-nums tech-mono whitespace-nowrap">{s.v}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{s.k}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DigestList digests={digests} locale={locale} />
    </div>
  );
}
