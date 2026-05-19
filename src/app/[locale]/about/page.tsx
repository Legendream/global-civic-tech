import { getTranslations } from "next-intl/server";

type Source = {
  name: string;
  url: string;
  country: string;
  flag: string;
  tags: string[];
};

const SOURCES: Source[] = [
  { name: "mySociety", url: "https://www.mysociety.org", country: "United Kingdom", flag: "🇬🇧", tags: ["civic-tech", "democracy"] },
  { name: "GDS Blog", url: "https://gds.blog.gov.uk", country: "United Kingdom", flag: "🇬🇧", tags: ["public-service", "open-source"] },
  { name: "PublicTechnology", url: "https://www.publictechnology.net", country: "United Kingdom", flag: "🇬🇧", tags: ["govtech"] },
  { name: "Beeck Center", url: "https://beeckcenter.georgetown.edu", country: "United States", flag: "🇺🇸", tags: ["civic-tech", "government"] },
  { name: "Nextgov", url: "https://www.nextgov.com", country: "United States", flag: "🇺🇸", tags: ["AI governance", "public-service"] },
  { name: "Federal News Network", url: "https://federalnewsnetwork.com", country: "United States", flag: "🇺🇸", tags: ["transparency"] },
  { name: "Government Technology", url: "https://www.govtech.com", country: "United States", flag: "🇺🇸", tags: ["govtech"] },
  { name: "StateScoop", url: "https://statescoop.com", country: "United States", flag: "🇺🇸", tags: ["state & local govtech"] },
  { name: "FedScoop", url: "https://fedscoop.com", country: "United States", flag: "🇺🇸", tags: ["federal govtech"] },
  { name: "Smart Cities Dive", url: "https://www.smartcitiesdive.com", country: "United States", flag: "🇺🇸", tags: ["smart cities"] },
  { name: "GovTech Review", url: "https://www.govtechreview.com.au", country: "Australia", flag: "🇦🇺", tags: ["govtech", "open-data"] },
  { name: "The GovLab", url: "https://thegovlab.org", country: "International", flag: "🌐", tags: ["civic-tech", "open-data"] },
  { name: "Endstate", url: "https://endstate.substack.com", country: "International", flag: "🌐", tags: ["public interest tech"] },
  { name: "OECD-OPSI", url: "https://oecd-opsi.org", country: "International", flag: "🌐", tags: ["public sector innovation"] },
  { name: "Open Government Partnership", url: "https://www.opengovpartnership.org", country: "International", flag: "🌐", tags: ["open government", "transparency"] },
  { name: "Decidim", url: "https://decidim.org", country: "International", flag: "🌐", tags: ["e-participation", "open-source"] },
  { name: "Open Contracting Partnership", url: "https://www.open-contracting.org", country: "International", flag: "🌐", tags: ["anti-corruption", "open-data"] },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const isZh = locale === "zh";

  const jobs = [
    {
      when: t("job1When"),
      want: t("job1Want"),
      so: t("job1So"),
    },
    {
      when: t("job2When"),
      want: t("job2Want"),
      so: t("job2So"),
    },
    {
      when: t("job3When"),
      want: t("job3Want"),
      so: t("job3So"),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

      {/* Hero */}
      <section>
        <h1 className="text-2xl font-bold text-zinc-900 mb-3">{t("title")}</h1>
        <p className="text-zinc-500 leading-relaxed max-w-2xl">{t("intro")}</p>
      </section>

      {/* JTBD */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-6">{t("jtbdTitle")}</h2>
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-3">
              <div className="flex gap-3 text-sm">
                <span className="shrink-0 font-medium text-zinc-400 w-16">{t("labelWhen")}</span>
                <span className="text-zinc-700">{job.when}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="shrink-0 font-medium text-indigo-500 w-16">{t("labelWant")}</span>
                <span className="text-zinc-700">{job.want}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="shrink-0 font-medium text-emerald-600 w-16">{t("labelSo")}</span>
                <span className="text-zinc-700">{job.so}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-base font-semibold text-zinc-800 mb-4">{t("howTitle")}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            { step: "01", label: t("step1") },
            { step: "02", label: t("step2") },
            { step: "03", label: t("step3") },
            { step: "04", label: t("step4") },
          ].map(({ step, label }) => (
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
                    {isZh ? translateCountry(src.country) : src.country}
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

function translateCountry(country: string): string {
  const map: Record<string, string> = {
    "United Kingdom": "英國",
    "United States": "美國",
    "Australia": "澳洲",
    "International": "國際",
  };
  return map[country] ?? country;
}
