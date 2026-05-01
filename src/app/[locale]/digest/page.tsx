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

export default async function DigestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("digest");
  const digests = await getDigests();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
      <DigestList digests={digests} locale={locale} />
    </div>
  );
}
