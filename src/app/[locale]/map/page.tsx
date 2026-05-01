export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, type Article } from "@/lib/supabase";
import MapClient from "@/components/MapClient";

async function getArticlesWithCoords(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .not("country_code", "is", null);
  return data ?? [];
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("map");

  const articles = await getArticlesWithCoords();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
        <p className="text-zinc-500 mt-1">{t("subtitle")}</p>
      </div>
      <MapClient articles={articles} locale={locale} />
    </div>
  );
}
