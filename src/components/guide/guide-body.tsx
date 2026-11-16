import Link from "next/link";
import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Renders the Markdown subset used by guides (see src/lib/guides.ts) as React elements —
 * no HTML strings, so guide text can never inject markup.
 */
export type GuideBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "tip"; text: string };

const isTableRow = (l: string) => l.startsWith("|");
const isUl = (l: string) => /^- /.test(l);
const isOl = (l: string) => /^\d+\. /.test(l);
const isTip = (l: string) => l.startsWith(">");
const isHeading = (l: string) => /^#{2,3} /.test(l);
const cells = (l: string) =>
  l
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export function parseGuide(md: string): GuideBlock[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim());
  const out: GuideBlock[] = [];
  let n = 0;
  let i = 0;
  const take = (test: (l: string) => boolean) => {
    const got: string[] = [];
    while (i < lines.length && lines[i] && test(lines[i])) got.push(lines[i++]);
    return got;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^## (.+?)(?:\s*\{#([\w-]+)\})?$/.exec(line))) {
      out.push({ type: "h2", text: m[1], id: m[2] ?? `section-${++n}` });
      i++;
    } else if ((m = /^### (.+)$/.exec(line))) {
      out.push({ type: "h3", text: m[1] });
      i++;
    } else if (isTableRow(line)) {
      const rows = take(isTableRow).map(cells).filter((r) => !r.every((c) => /^:?-{3,}:?$/.test(c)));
      out.push({ type: "table", head: rows[0] ?? [], rows: rows.slice(1) });
    } else if (isUl(line)) {
      out.push({ type: "ul", items: take(isUl).map((l) => l.slice(2)) });
    } else if (isOl(line)) {
      out.push({ type: "ol", items: take(isOl).map((l) => l.replace(/^\d+\.\s+/, "")) });
    } else if (isTip(line)) {
      out.push({ type: "tip", text: take(isTip).map((l) => l.replace(/^>\s?/, "")).join(" ") });
    } else {
      out.push({ type: "p", text: take((l) => !isHeading(l) && !isTableRow(l) && !isUl(l) && !isOl(l) && !isTip(l)).join(" ") });
    }
  }
  return out;
}

/** `**bold**` and `[text](/path)`; internal paths get the locale prefix. */
export function Inline({ text, locale }: { text: string; locale: Locale }) {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={m.index} className="font-semibold text-ink">{m[1]}</strong>);
    } else {
      const href = m[3];
      parts.push(
        href.startsWith("/") ? (
          <Link key={m.index} href={localePath(locale, href)} className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
            {m[2]}
          </Link>
        ) : (
          <a key={m.index} href={href} target="_blank" rel="noopener" className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
            {m[2]}
          </a>
        ),
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function GuideBody({ blocks, locale }: { blocks: GuideBlock[]; locale: Locale }) {
  return (
    <div className="prose-tl text-[1.05rem]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={b.id} className="mb-4 mt-12 scroll-mt-28 font-display text-[1.5rem] font-bold leading-snug tracking-[-0.02em] text-ink first:mt-0 sm:text-3xl">
                {b.text}
              </h2>
            );
          case "h3":
            return <h3 key={i} className="mb-2 mt-7 text-lg font-semibold text-ink">{b.text}</h3>;
          case "p":
            return <p key={i} className="mt-4 first:mt-0"><Inline text={b.text} locale={locale} /></p>;
          case "ul":
            return (
              <ul key={i} className="mt-4 space-y-2 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    <span><Inline text={it} locale={locale} /></span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-4 space-y-3">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand">{j + 1}</span>
                    <span className="pt-0.5"><Inline text={it} locale={locale} /></span>
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full border-collapse text-left text-[0.9rem] sm:text-[0.95rem] [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5 sm:[&_td]:px-4 sm:[&_td]:py-3 sm:[&_th]:px-4 sm:[&_th]:py-3">
                  <thead className="bg-sand/60 text-ink">
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} scope="col" className="font-semibold"><Inline text={h} locale={locale} /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) =>
                          k === 0 ? (
                            <th key={k} scope="row" className="align-top font-semibold text-ink"><Inline text={c} locale={locale} /></th>
                          ) : (
                            <td key={k} className="align-top"><Inline text={c} locale={locale} /></td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "tip":
            return (
              <aside key={i} className="mt-6 flex gap-3 rounded-2xl bg-gold-soft p-5">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                <p><Inline text={b.text} locale={locale} /></p>
              </aside>
            );
        }
      })}
    </div>
  );
}
