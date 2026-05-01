import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-zinc-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
        <p>{t("description")}</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/Legendream/global-civic-tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 transition-colors"
          >
            {t("sourceCode")}
          </a>
        </div>
      </div>
    </footer>
  );
}
