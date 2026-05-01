"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/digest`, label: t("digest") },
    { href: `/${locale}/cases`, label: t("cases") },
    { href: `/${locale}/map`, label: t("map") },
  ];

  const otherLocale = locale === "zh" ? "en" : "zh";
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-semibold text-zinc-900 text-sm">
          {locale === "zh" ? "全球公民科技動態" : "Global Civic Tech"}
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const isActive =
              href === `/${locale}`
                ? pathname === `/${locale}`
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <Link
            href={otherLocalePath}
            className="ml-2 px-3 py-1.5 rounded-md text-sm border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
          >
            {otherLocale === "zh" ? "中文" : "EN"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
