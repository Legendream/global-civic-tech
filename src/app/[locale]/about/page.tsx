import { getTranslations } from "next-intl/server";
import Link from "next/link";

type Source = {
  name: string;
  url: string;
  country: string;
  flag: string;
  tags: string[];
};

const SOURCES: Source[] = [
  { name: "mySociety", url: "https://www.mysociety.org", country: "英國", flag: "🇬🇧", tags: ["civic-tech", "democracy"] },
  { name: "GDS Blog", url: "https://gds.blog.gov.uk", country: "英國", flag: "🇬🇧", tags: ["public-service", "open-source"] },
  { name: "PublicTechnology", url: "https://www.publictechnology.net", country: "英國", flag: "🇬🇧", tags: ["govtech"] },
  { name: "Beeck Center", url: "https://beeckcenter.georgetown.edu", country: "美國", flag: "🇺🇸", tags: ["civic-tech", "government"] },
  { name: "Nextgov", url: "https://www.nextgov.com", country: "美國", flag: "🇺🇸", tags: ["AI governance", "public-service"] },
  { name: "Federal News Network", url: "https://federalnewsnetwork.com", country: "美國", flag: "🇺🇸", tags: ["transparency"] },
  { name: "Government Technology", url: "https://www.govtech.com", country: "美國", flag: "🇺🇸", tags: ["govtech"] },
  { name: "StateScoop", url: "https://statescoop.com", country: "美國", flag: "🇺🇸", tags: ["state & local govtech"] },
  { name: "FedScoop", url: "https://fedscoop.com", country: "美國", flag: "🇺🇸", tags: ["federal govtech"] },
  { name: "Smart Cities Dive", url: "https://www.smartcitiesdive.com", country: "美國", flag: "🇺🇸", tags: ["smart cities"] },
  { name: "GovTech Review", url: "https://www.govtechreview.com.au", country: "澳洲", flag: "🇦🇺", tags: ["govtech", "open-data"] },
  { name: "The GovLab", url: "https://thegovlab.org", country: "國際", flag: "🌐", tags: ["civic-tech", "open-data"] },
  { name: "Endstate", url: "https://endstate.substack.com", country: "國際", flag: "🌐", tags: ["public interest tech"] },
  { name: "OECD-OPSI", url: "https://oecd-opsi.org", country: "國際", flag: "🌐", tags: ["public sector innovation"] },
  { name: "Open Government Partnership", url: "https://www.opengovpartnership.org", country: "國際", flag: "🌐", tags: ["open government", "transparency"] },
  { name: "Decidim", url: "https://decidim.org", country: "國際", flag: "🌐", tags: ["e-participation", "open-source"] },
  { name: "Open Contracting Partnership", url: "https://www.open-contracting.org", country: "國際", flag: "🌐", tags: ["anti-corruption", "open-data"] },
  { name: "Open Knowledge Foundation", url: "https://okfn.org", country: "國際", flag: "🌐", tags: ["open-data", "transparency"] },
  { name: "Global Voices Advox", url: "https://advox.globalvoices.org", country: "國際", flag: "🌐", tags: ["digital-rights", "press-freedom"] },
  { name: "Code for Africa", url: "https://codeforafrica.org", country: "非洲", flag: "🌍", tags: ["civic-tech", "data-journalism"] },
  { name: "Code for Japan", url: "https://www.code4japan.org", country: "日本", flag: "🇯🇵", tags: ["civic-tech", "open-data"] },
  { name: "CivicDataLab", url: "https://civicdatalab.in", country: "印度", flag: "🇮🇳", tags: ["civic-tech", "open-data"] },
  { name: "GovTech Singapore", url: "https://www.tech.gov.sg", country: "新加坡", flag: "🇸🇬", tags: ["govtech", "public-service"] },
  { name: "Open Culture Foundation", url: "https://ocf.tw", country: "台灣", flag: "🇹🇼", tags: ["open-data", "open-source"] },
  { name: "Open Source Society PH", url: "https://www.ossph.org", country: "菲律賓", flag: "🇵🇭", tags: ["civic-tech", "open-source"] },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("about");

  const navCards = [
    { nav: t("navHome"),      desc: t("navHomeDesc"),      href: `/${locale}` },
    { nav: t("navDigest"),    desc: t("navDigestDesc"),    href: `/${locale}/digest` },
    { nav: t("navMap"),       desc: t("navMapDesc"),       href: `/${locale}/map` },
    { nav: t("navBookmarks"), desc: t("navBookmarksDesc"), href: `/${locale}/bookmarks` },
  ];

  const steps = [
    { step: "01", label: t("step1", { count: SOURCES.length }) },
    { step: "02", label: t("step2") },
    { step: "03", label: t("step3") },
    { step: "04", label: t("step4") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

      {/* Hero masthead */}
      <section className="mh relative pt-2">
        <span className="mh-tick tl" aria-hidden="true"></span>
        <span className="mh-tick tr" aria-hidden="true"></span>
        <span className="mh-tick bl" aria-hidden="true"></span>
        <span className="mh-tick br" aria-hidden="true"></span>
        <div className="flex flex-col gap-4">
          <div className="mh-eyebrow">
            <span className="mh-live" aria-hidden="true"></span>
            ABOUT · 關於本站
          </div>
          <h1 className="mh-title text-zinc-900">{t("title")}</h1>
          <p className="text-zinc-600 text-base leading-relaxed max-w-xl">
            {t("introMain")}
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xl border-l-2 border-indigo-200 pl-3.5">
            {t("introCivicTech")}
          </p>
        </div>
      </section>

      {/* What we include — 收錄標準 */}
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-3">{t("criteriaTitle")}</h2>
          <p className="text-sm text-zinc-600 leading-relaxed border-l-2 border-indigo-200 pl-4">
            {t("criteriaDef")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* 收錄 — accent */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold leading-none">✓</span>
              <span className="text-sm font-semibold text-indigo-900">收錄</span>
            </div>
            <p className="text-sm text-indigo-700 leading-relaxed">{t("criteriaInclude")}</p>
          </div>
          {/* 不進每日摘要 — neutral */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-zinc-600 text-xs font-bold leading-none">✕</span>
              <span className="text-sm font-semibold text-zinc-600">不進每日摘要</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">{t("criteriaExclude")}</p>
          </div>
        </div>

        <p className="flex gap-2 text-xs text-zinc-400 leading-relaxed border-t border-zinc-100 pt-4">
          <span className="text-indigo-400" aria-hidden>✦</span>
          <span>{t("criteriaNote")}</span>
        </p>
      </section>

      {/* How to get started */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-6">{t("getStartedTitle")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {navCards.map(({ nav, desc, href }) => (
            <Link
              key={nav}
              href={href}
              className="block bg-white border border-zinc-200 rounded-xl p-5 transition-all hover:border-indigo-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" aria-hidden="true"></span>
                <div className="text-sm font-semibold text-zinc-900">{nav}</div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-4">{t("howTitle")}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {steps.map(({ step, label }) => (
            <div key={step} className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
              <div className="text-sm tech-mono text-indigo-600 mb-1.5">{step}</div>
              <div className="text-sm text-zinc-700">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-2">{t("sourcesTitle")}</h2>
        <p className="text-sm text-zinc-500 mb-6">{t("sourcesDesc", { count: SOURCES.length })}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="pb-3 pr-6 font-medium text-zinc-500">{t("colSource")}</th>
                <th className="pb-3 pr-6 font-medium text-zinc-500">{t("colCountry")}</th>
                <th className="pb-3 font-medium text-zinc-500">{t("colTopic")}</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((src) => (
                <tr key={src.name} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="py-3 pr-6">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {src.name}
                    </a>
                  </td>
                  <td className="py-3 pr-6 text-zinc-600">
                    <span className="mr-1.5">{src.flag}</span>
                    {src.country}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {src.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Update cadence */}
      <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h2 className="text-base font-semibold text-indigo-900 mb-2">{t("updateTitle")}</h2>
        <p className="text-sm text-indigo-700 leading-relaxed">{t("updateDesc")}</p>
      </section>

    </div>
  );
}
