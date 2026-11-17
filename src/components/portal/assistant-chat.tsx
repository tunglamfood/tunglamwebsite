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

/**
 * Chat screen laid out like a messaging app: a fixed header, a message list that scrolls on its own,
 * and a message box docked at the bottom. On phones the whole screen is pinned between the top bar and
 * the tab bar; while the keyboard is open it follows the visible area (visualViewport) and the tab bar hides.
 */
export function AssistantChat({
  scope,
  currency,
  labels,
  priceTbc,
}: {
  scope: string;
  currency: string;
  labels: PortalDict["assistant"];
  priceTbc: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const { addMany } = useCart(scope);
  const router = useRouter();
  const screenRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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

  // Keep the newest message in view (scrolls the message list only, never the page).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, pending]);

  // Phones: lock page scrolling while the chat is open, and follow the on-screen keyboard.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("chat-open");
    const vv = window.visualViewport;
    const update = () => {
      const el = screenRef.current;
      if (!el || !vv) return;
      const keyboard = window.innerHeight - vv.height > 120;
      el.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      el.style.setProperty("--vv-h", `${vv.height}px`);
      el.dataset.kb = keyboard ? "1" : "";
      if (keyboard) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    return () => {
      root.classList.remove("chat-open");
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
  }, []);

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
    <div ref={screenRef} className="chat-screen flex flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/60 px-4 py-2.5 sm:px-6 lg:border-0 lg:px-0 lg:pb-4 lg:pt-0">
        <AssistantIcon size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-base font-bold leading-tight tracking-[-0.015em] text-ink lg:text-2xl">{labels.title}</h1>
          <p className="text-xs text-muted">Cili · Tung Lam</p>
        </div>
        {msgs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMsgs([]);
              setText("");
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 text-xs font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden /> {labels.newChat}
          </button>
        )}
      </div>

      {/* Messages (scroll on their own) */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 lg:px-1">
        <div className="space-y-2 py-3">
          {msgs.length === 0 && (
            <div className="glass animate-fade-up rounded-3xl p-4 sm:p-6">
              <AssistantIcon size={72} />
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{labels.intro}</p>
              <p className="mt-2 text-[0.7rem] text-muted sm:hidden">{labels.disclaimer}</p>
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
              <div key={m.id} className="flex justify-end pl-10">
                <p className="max-w-full animate-fade-in whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-brand px-3 py-2 text-sm leading-snug text-white">{m.text}</p>
              </div>
            ) : m.role === "error" ? (
              <p key={m.id} className="mr-10 flex animate-fade-in gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {m.text}
              </p>
            ) : (
              <div key={m.id} className="flex animate-fade-in gap-2">
                <span className="mt-0.5 shrink-0">
                  <AssistantIcon size={30} />
                </span>
                <div className="min-w-0 flex-1 space-y-2 pr-4 sm:pr-10">
                  {m.text && <p className="glass w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-tl-md px-3 py-2 text-sm leading-snug text-ink">{m.text}</p>}
                  {/* Product card only when something was matched; questions stay in the reply bubble. */}
                  {m.lines.length > 0 && (
                    <div className="glass overflow-hidden rounded-2xl sm:max-w-xl">
                      <p className="border-b border-white/60 bg-white/40 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{labels.proposal}</p>
                      <ul className="divide-y divide-line/70">
                        {m.lines.map((l) => (
                          <li key={l.itemCode} className={clsx("flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:flex-nowrap", !l.sure && !m.added && "bg-amber-50/60")}>
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-white/80">
                              {l.image && <Image src={l.image} alt="" fill sizes="44px" className="object-contain p-1" />}
                            </span>
                            <span className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto">
                              <span className="flex flex-wrap items-center gap-x-1.5">
                                <span className="text-[0.8125rem] font-semibold leading-snug text-ink">{l.name}</span>
                                {!l.sure && !m.added && <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-px text-[0.62rem] font-semibold text-amber-800">{labels.check}</span>}
                              </span>
                              <span className="block text-[0.7rem] text-muted">
                                {l.label} · {l.itemCode} · {l.price != null ? `${money(l.price, currency)} / ${l.uom.toLowerCase()}` : priceTbc}
                              </span>
                            </span>
                            {m.added ? (
                              <span className="ml-auto text-sm font-semibold tabular-nums text-ink">× {l.qty}</span>
                            ) : (
                              <span className="ml-14 flex shrink-0 items-center gap-1 sm:ml-0">
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
                      {m.unmatched.length > 0 && (
                        <p className="border-t border-line/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                          <span className="font-semibold">{labels.unmatched}:</span> {m.unmatched.join(" · ")}
                        </p>
                      )}
                      <div className="border-t border-white/60 p-2">
                        {m.added ? (
                          <Link href="/portal/cart" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100">
                            <Check className="size-4" aria-hidden /> {labels.goToCart} <ArrowRight className="size-4" aria-hidden />
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
                            <ShoppingCart className="size-4" aria-hidden /> {m.lines.length === 1 ? labels.addOne : pfmt(labels.addAll, { n: m.lines.length })}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}

          {pending && (
            <div className="flex gap-2">
              <span className="shrink-0 animate-pulse">
                <AssistantIcon size={30} />
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
        </div>
      </div>

      {/* Message box, docked */}
      <div className="shrink-0 border-t border-white/60 bg-white/75 px-3 pb-2 pt-2 backdrop-blur-xl sm:px-6 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-3 lg:backdrop-blur-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
            boxRef.current?.focus();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={boxRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(min-width: 1024px)").matches) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={Math.min(5, Math.max(1, text.split("\n").length))}
            maxLength={2500}
            placeholder={labels.ask}
            className="block max-h-32 min-h-10 flex-1 resize-none rounded-[1.25rem] border border-line bg-white px-4 py-2 text-base leading-6 text-ink outline-none transition placeholder:text-muted/70 focus:border-ink/25 lg:text-sm"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            aria-label={labels.send}
            className={clsx("grid size-10 shrink-0 place-items-center rounded-full transition", pending || !text.trim() ? "bg-ink/10 text-ink/35" : PRIMARY)}
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="mt-1 hidden text-center text-[0.65rem] text-muted sm:block">{labels.disclaimer}</p>
      </div>
    </div>
  );
}
