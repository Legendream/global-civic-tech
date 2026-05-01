export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { supabase, type Article } from "@/lib/supabase";
import CasesClient from "@/components/CasesClient";

async function getAllArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("processed", true)
    .order("published_at", { ascending: false });
  return data ?? [];
}

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("cases");
  const articles = await getAllArticles();

  const countries = [...new Set(articles.map((a) => a.country).filter(Boolean))].sort() as string[];
  const tags = [...new Set(articles.flatMap((a) => a.tags))].sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
      <CasesClient
        articles={articles}
        countries={countries}
        tags={tags}
        locale={locale}
      />
    </div>
  );
}
