/**
 * Renders plain-text digest content with a consistent four-level hierarchy:
 *
 *   H3  【Section】  — text-sm bold, 3 px accent left bar + tinted bg  (≥ body, never smaller)
 *   H4  Short phrase — text-sm semibold, 2 px accent left bar
 *   Body             — text-sm normal, zinc-700
 *   Empty line       — small vertical gap
 *
 * Heuristics for H4 detection (conservative):
 *   non-empty · ≤ 24 chars · no colon · no terminal CJK punctuation · no bullets
 */

type LineKind = "h3" | "h4" | "body" | "empty";

function classify(line: string): LineKind {
  const t = line.trim();
  if (!t) return "empty";
  if (/^【.+】$/.test(t)) return "h3";
  if (
    t.length <= 24 &&
    !t.includes("：") &&
    !t.includes(":") &&
    !t.endsWith("。") &&
    !t.endsWith("，") &&
    !t.endsWith("、") &&
    !t.startsWith("•") &&
    !t.startsWith("-") &&
    !t.startsWith("·") &&
    !t.startsWith("※")
  ) {
    return "h4";
  }
  return "body";
}

export default function DigestContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="text-sm leading-relaxed text-zinc-700 space-y-1.5">
      {lines.map((line, i) => {
        const kind = classify(line);

        if (kind === "empty") {
          return <div key={i} className="h-2" />;
        }

        /* H3 — 摘要大節【Section】 */
        if (kind === "h3") {
          return (
            <div
              key={i}
              className="mt-5 mb-1 flex items-center gap-0"
            >
              <span
                className="shrink-0 self-stretch w-[3px] rounded-full mr-2.5"
                style={{ background: "var(--accent)" }}
              />
              <span className="font-bold text-zinc-900 bg-indigo-50 px-2 py-0.5 rounded text-sm tracking-wide">
                {line.trim()}
              </span>
            </div>
          );
        }

        /* H4 — 摘要小標題（短詞） */
        if (kind === "h4") {
          return (
            <p
              key={i}
              className="mt-3 font-semibold text-zinc-800 text-sm pl-2.5 border-l-2"
              style={{ borderColor: "var(--accent)" }}
            >
              {line.trim()}
            </p>
          );
        }

        /* Body */
        return (
          <p key={i} className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
