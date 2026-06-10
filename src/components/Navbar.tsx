"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useBookmarks } from "@/lib/bookmarks";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { count } = useBookmarks();

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/digest`, label: t("digest") },
    { href: `/${locale}/map`, label: t("map") },
    { href: `/${locale}/articles`, label: t("articles") },
    { href: `/${locale}/bookmarks`, label: t("bookmarks"), badge: count > 0 ? count : null },
    { href: `/${locale}/about`, label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-100 relative">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold text-zinc-900 text-sm shrink-0 hover:text-indigo-600 transition-colors"
        >
          <span
            className="inline-block w-2 h-2 rounded-sm bg-indigo-600 shrink-0"
            style={{ boxShadow: "0 0 8px var(--accent)" }}
          />
          {locale === "zh" ? "全球公民科技動態" : "Global Civic Tech"}
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ href, label, badge }) => {
            const isActive =
              href === `/${locale}`
                ? pathname === `/${locale}`
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {label}
                {badge !== null && badge !== undefined && (
                  <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold leading-none">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Accent gradient underline */}
      <div
        className="absolute left-0 right-0 bottom-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, var(--accent), transparent)", opacity: 0.6 }}
      />
    </header>
  );
}
