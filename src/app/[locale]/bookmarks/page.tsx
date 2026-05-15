import { getTranslations } from "next-intl/server";
import BookmarksClient from "@/components/BookmarksClient";

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("bookmarks");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t("subtitle")}</p>
      </div>
      <BookmarksClient locale={locale} />
    </div>
  );
}
