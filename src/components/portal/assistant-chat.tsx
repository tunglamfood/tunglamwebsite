"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, ArrowRight, ArrowUp, Check, Minus, Plus, RotateCcw, ShoppingCart, X } from "lucide-react";
import { askAssistant, type ProposedLine } from "@/lib/portal/assistant";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";
import { useCart } from "./cart";
import { PRIMARY } from "./bits";
import { AssistantIcon } from "./assistant-icon";

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
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col">
      {/* Thread */}
      <div className="flex-1 space-y-2.5 pb-4">
        {msgs.length === 0 && (
          <div className="glass animate-fade-up rounded-3xl p-4 sm:p-6">
            <AssistantIcon size={80} />
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{labels.intro}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...labels.suggestions, labels.placeholder.replace(/^(e\.g\.|cth\.|例如：)\s*/, "")].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-left text-[0.8125rem] font-medium text-ink-soft transition-colors hover:bg-white hover:text-brand-700"
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
              <p className="max-w-[82%] animate-fade-in whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-3 py-2 text-sm leading-snug text-white">
                {m.text}
              </p>
            </div>
          ) : m.role === "error" ? (
            <p key={m.id} className="flex max-w-[85%] animate-fade-in gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {m.text}
            </p>
          ) : (
            <div key={m.id} className="flex animate-fade-in gap-2.5">
              <span className="mt-0.5 shrink-0">
                <AssistantIcon size={34} />
              </span>
              <div className="min-w-0 max-w-[calc(100%-2.5rem)] flex-1 space-y-2">
                {m.text && <p className="w-fit max-w-full whitespace-pre-wrap glass rounded-2xl rounded-tl-md px-3 py-2 text-sm leading-snug text-ink">{m.text}</p>}
                {(m.lines.length > 0 || m.unmatched.length > 0) && (
                  <div className="glass overflow-hidden rounded-2xl sm:max-w-xl">
                    {m.lines.length > 0 && (
                      <>
                        <p className="border-b border-white/60 bg-white/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">{labels.proposal}</p>
                        <ul className="divide-y divide-line">
                          {m.lines.map((l) => (
                            <li key={l.itemCode} className={clsx("flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:flex-nowrap sm:px-4", !l.sure && !m.added && "bg-amber-50/60")}>
                              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white/70">
                                {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />}
                              </span>
                              <span className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] sm:basis-auto">
                                <span className="flex flex-wrap items-center gap-x-1.5">
                                  <span className="text-[0.8125rem] font-semibold leading-snug text-ink sm:truncate">{l.name}</span>
                                  {!l.sure && !m.added && (
                                    <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-px text-[0.62rem] font-semibold text-amber-800">{labels.check}</span>
                                  )}
                                </span>
                                <span className="block text-[0.7rem] text-muted sm:truncate">
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
                      <div className="border-t border-white/60 p-2.5">
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
                            className={clsx("flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold", PRIMARY)}
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
            <span className="shrink-0 animate-pulse">
              <AssistantIcon size={34} />
            </span>
            <p className="glass flex items-center gap-2 rounded-2xl rounded-tl-md px-3 py-2 text-[0.8125rem] text-muted">
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
      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-10 -mx-4 px-4 pb-1 pt-4 sm:-mx-6 sm:px-6 lg:bottom-0 lg:-mx-8 lg:px-8 lg:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="glass flex items-end gap-1.5 rounded-[1.5rem] p-1.5 pl-3 transition focus-within:bg-white/85"
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
            className="max-h-36 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-snug text-ink outline-none placeholder:text-muted/70 placeholder-shown:overflow-hidden placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap"
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
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <button type="submit" disabled={pending || !text.trim()} aria-label={labels.send} className={clsx("grid size-9 shrink-0 place-items-center rounded-full transition", pending || !text.trim() ? "bg-ink/10 text-ink/35" : PRIMARY)}>
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="mt-1 text-center text-[0.65rem] text-muted">{labels.disclaimer}</p>
      </div>
    </div>
  );
}
