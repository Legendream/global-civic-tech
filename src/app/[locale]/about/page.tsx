import { getTranslations } from "next-intl/server";

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
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("about");

  const navCards = [
    { nav: t("navHome"),      desc: t("navHomeDesc") },
    { nav: t("navDigest"),    desc: t("navDigestDesc") },
    { nav: t("navMap"),       desc: t("navMapDesc") },
    { nav: t("navBookmarks"), desc: t("navBookmarksDesc") },
  ];

  const steps = [
    { step: "01", label: t("step1") },
    { step: "02", label: t("step2") },
    { step: "03", label: t("step3") },
    { step: "04", label: t("step4") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

      {/* Hero */}
      <section>
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">{t("title")}</h1>
        <p className="text-lg text-zinc-700 leading-relaxed max-w-2xl mb-4">
          {t("introMain")}
        </p>
        <p className="text-zinc-500 leading-relaxed max-w-2xl">
          {t("introCivicTech")}
        </p>
      </section>

      {/* How to get started */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-6">{t("getStartedTitle")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {navCards.map(({ nav, desc }) => (
            <div key={nav} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="text-sm font-semibold text-zinc-900 mb-1.5">{nav}</div>
              <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-4">{t("howTitle")}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {steps.map(({ step, label }) => (
            <div key={step} className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
              <div className="text-xs font-mono text-zinc-400 mb-1">{step}</div>
              <div className="text-sm text-zinc-700">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-2">{t("sourcesTitle")}</h2>
        <p className="text-sm text-zinc-500 mb-6">{t("sourcesDesc")}</p>
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
