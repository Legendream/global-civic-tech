export const dynamic = "force-dynamic";

import { supabase, type Article } from "@/lib/supabase";
import MapClient from "@/components/MapClient";

async function getArticlesWithCoords(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .not("country_code", "is", null);
  return data ?? [];
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const articles = await getArticlesWithCoords();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">全球公民科技地圖</h1>
        <p className="text-zinc-500 mt-1">依國家彙整公民科技案例，點擊節點查看在地實踐</p>
      </div>
      <MapClient articles={articles} />
    </div>
  );
}
