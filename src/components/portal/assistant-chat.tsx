"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, ArrowUp, Check, Minus, Plus, RotateCcw, ShoppingCart, Sparkles, X } from "lucide-react";
import { askAssistant, type ProposedLine } from "@/lib/portal/assistant";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";
import { useCart } from "./cart";
import { PRIMARY } from "./bits";

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; lines: ProposedLine[]; unmatched: string[]; added?: boolean }
  | { id: number; role: "error"; text: string };

/** Message ids: unique within the tab, and larger than any id restored from an earlier page load. */
let seq = Date.now();
const newId = () => ++seq;

/** Conversation is kept for this browser tab only (sessionStorage), per login + dealer. */
const storeKey = (scope: string) => `tl-assistant:${scope}`;

export function AssistantChat({ scope, currency, labels, priceTbc }: { scope: string; currency: string; labels: PortalDict["assistant"]; priceTbc: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const { addMany } = useCart(scope);
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const loaded = useRef(false);

  // Restore / save the conversation.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKey(scope));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring browser-only state after mount
      if (raw) setMsgs(JSON.parse(raw) as Msg[]);
    } catch {
      /* storage unavailable: start fresh */
    }
    loaded.current = true;
  }, [scope]);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(storeKey(scope), JSON.stringify(msgs.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [msgs, scope]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pending]);

  const send = (raw: string) => {
    const t = raw.trim();
    if (!t || pending) return;
    const userMsg: Msg = { id: newId(), role: "user", text: t };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setText("");
    start(async () => {
      const history = next
        .filter((m): m is Extract<Msg, { role: "user" | "assistant" }> => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, text: m.role === "assistant" && m.lines.length ? `${m.text}\n[proposed: ${m.lines.map((l) => `${l.itemCode} x${l.qty}`).join(", ")}]` : m.text }));
      const res = await askAssistant(history);
      if (!res.ok) {
        if (res.reason === "signed_out") return router.push("/portal/login");
        if (res.reason === "no_dealer") return router.push("/portal/dealers");
        setMsgs((m) => [...m, { id: newId(), role: "error", text: res.reason === "limit" ? labels.limit : labels.error }]);
        return;
      }
      setMsgs((m) => [...m, { id: newId(), role: "assistant", text: res.reply, lines: res.lines, unmatched: res.unmatched }]);
    });
  };

  const updateLines = (id: number, fn: (l: ProposedLine[]) => ProposedLine[]) =>
    setMsgs((all) => all.map((m) => (m.id === id && m.role === "assistant" ? { ...m, lines: fn(m.lines) } : m)));

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col">
      {/* Thread */}
      <div className="flex-1 space-y-4 pb-6">
        {msgs.length === 0 && (
          <div className="animate-fade-up rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow-xs)] sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#e3262d] to-brand text-white shadow-[0_8px_20px_-10px_rgb(215_25_32/0.8)]">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <p className="mt-4 max-w-xl text-[0.975rem] leading-relaxed text-ink-soft">{labels.intro}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[...labels.suggestions, labels.placeholder.replace(/^(e\.g\.|cth\.|例如：)\s*/, "")].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-cream px-3.5 py-2 text-left text-sm font-medium text-ink-soft transition-colors hover:border-brand/30 hover:bg-brand-50 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] animate-fade-in whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[0.95rem] text-white shadow-[0_6px_16px_-10px_rgb(215_25_32/0.8)]">
                {m.text}
              </p>
            </div>
          ) : m.role === "error" ? (
            <p key={m.id} className="flex max-w-[85%] animate-fade-in gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {m.text}
            </p>
          ) : (
            <div key={m.id} className="flex animate-fade-in gap-2.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e3262d] to-brand text-white">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 max-w-[calc(100%-2.75rem)] flex-1 space-y-3">
                {m.text && <p className="w-fit max-w-full whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-[0.95rem] text-ink shadow-[var(--shadow-xs)]">{m.text}</p>}
                {(m.lines.length > 0 || m.unmatched.length > 0) && (
                  <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] sm:max-w-xl">
                    {m.lines.length > 0 && (
                      <>
                        <p className="border-b border-line bg-cream/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{labels.proposal}</p>
                        <ul className="divide-y divide-line">
                          {m.lines.map((l) => (
                            <li key={l.itemCode} className={clsx("flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap sm:px-4", !l.sure && !m.added && "bg-amber-50/60")}>
                              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#f4f3f1]">
                                {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />}
                              </span>
                              <span className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] sm:basis-auto">
                                <span className="flex flex-wrap items-center gap-x-1.5">
                                  <span className="text-sm font-semibold leading-snug text-ink sm:truncate">{l.name}</span>
                                  {!l.sure && !m.added && (
                                    <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-px text-[0.62rem] font-semibold text-amber-800">{labels.check}</span>
                                  )}
                                </span>
                                <span className="block text-xs text-muted sm:truncate">
                                  {l.label} · {l.itemCode} · {l.price != null ? `${money(l.price, currency)} / ${l.uom.toLowerCase()}` : priceTbc}
                                </span>
                              </span>
                              {m.added ? (
                                <span className="ml-auto text-sm font-semibold tabular-nums text-ink">× {l.qty}</span>
                              ) : (
                                <span className="ml-[3.75rem] flex shrink-0 items-center gap-1 sm:ml-0">
                                  <span className="flex h-8 items-center rounded-lg border border-line bg-white">
                                    <button type="button" aria-label="−" onClick={() => updateLines(m.id, (ls) => ls.map((x) => (x.itemCode === l.itemCode ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))} className="grid size-8 place-items-center text-ink-soft hover:text-ink">
                                      <Minus className="size-3.5" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                                    <button type="button" aria-label="+" onClick={() => updateLines(m.id, (ls) => ls.map((x) => (x.itemCode === l.itemCode ? { ...x, qty: Math.min(100000, x.qty + 1) } : x)))} className="grid size-8 place-items-center text-ink-soft hover:text-ink">
                                      <Plus className="size-3.5" />
                                    </button>
                                  </span>
                                  <button type="button" aria-label={labels.remove} onClick={() => updateLines(m.id, (ls) => ls.filter((x) => x.itemCode !== l.itemCode))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600">
                                    <X className="size-4" />
                                  </button>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {m.unmatched.length > 0 && (
                      <div className="border-t border-line bg-amber-50/70 px-4 py-2.5 text-sm text-amber-900">
                        <span className="font-semibold">{labels.unmatched}:</span> {m.unmatched.join(" · ")}
                      </div>
                    )}
                    {m.lines.length > 0 && (
                      <div className="border-t border-line p-3">
                        {m.added ? (
                          <Link href="/portal/cart" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100">
                            <Check className="size-4" aria-hidden /> {labels.added} · {labels.goToCart} <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              addMany(m.lines.map((l) => ({ itemCode: l.itemCode, qty: l.qty })));
                              setMsgs((all) => all.map((x) => (x.id === m.id && x.role === "assistant" ? { ...x, added: true } : x)));
                            }}
                            className={clsx("flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold", PRIMARY)}
                          >
                            <ShoppingCart className="size-4" aria-hidden /> {pfmt(labels.addAll, { n: m.lines.length })}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {pending && (
          <div className="flex gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#e3262d] to-brand text-white">
              <Sparkles className="size-4 animate-pulse" aria-hidden />
            </span>
            <p className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-2.5 text-sm text-muted shadow-[var(--shadow-xs)]">
              <span className="flex gap-1" aria-hidden>
                <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-brand" />
              </span>
              {labels.thinking}
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer: sticks above the phone tab bar */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pb-2 pt-4 sm:-mx-6 sm:px-6 lg:bottom-0 lg:-mx-8 lg:px-8 lg:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-lift)] transition focus-within:border-ink/25 focus-within:ring-4 focus-within:ring-ink/5"
        >
          <textarea
            ref={boxRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={Math.min(6, Math.max(1, text.split("\n").length))}
            maxLength={2500}
            placeholder={labels.placeholder}
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[0.95rem] text-ink outline-none placeholder:text-muted/70"
          />
          {msgs.length > 0 && (
            <button
              type="button"
              title={labels.newChat}
              aria-label={labels.newChat}
              onClick={() => {
                setMsgs([]);
                boxRef.current?.focus();
              }}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-sand hover:text-ink"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <button type="submit" disabled={pending || !text.trim()} aria-label={labels.send} className={clsx("grid size-10 shrink-0 place-items-center rounded-xl transition disabled:opacity-40", PRIMARY)}>
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[0.7rem] text-muted">{labels.disclaimer}</p>
      </div>
    </div>
  );
}
