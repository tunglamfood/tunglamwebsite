"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Loader2, LogIn, LogOut, MapPin, MapPinOff } from "lucide-react";
import { addVisitPhoto, checkIn, checkOut, type VisitResult } from "@/lib/portal/visits";
import { pfmt, type PortalDict } from "@/lib/portal/i18n";
import { pbtn, pcard, pfield } from "./bits";
import { toast } from "./toast";

type Labels = PortalDict["visits"];
type Where = { lat: number | null; lng: number | null; accuracy: number | null };

/** The phone's location, if the rep allows it — never blocks a visit for longer than 10 seconds. */
function locate(): Promise<Where> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ lat: null, lng: null, accuracy: null });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve({ lat: null, lng: null, accuracy: null }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

async function shrink(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.82));
    return new File([blob], "visit.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function VisitPanel({
  labels,
  dealer,
  open,
}: {
  labels: Labels;
  /** The dealer being served now, or null when none is chosen. */
  dealer: string | null;
  /** The rep's visit in progress. */
  open: { dealer: string; since: string; photos: number; located: boolean } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [locating, setLocating] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");

  const fail = (r: VisitResult) => {
    if (!r.ok) toast({ tone: "error", title: labels.errors[r.error] ?? labels.errors.generic });
    return !r.ok;
  };

  async function doCheckIn() {
    setLocating(true);
    const where = await locate();
    setLocating(false);
    start(async () => {
      const r = await checkIn(where);
      if (fail(r)) return;
      toast({ title: labels.checkedIn, body: where.lat == null ? labels.noLocation : labels.located });
      router.refresh();
    });
  }

  async function doCheckOut() {
    setLocating(true);
    const where = await locate();
    setLocating(false);
    start(async () => {
      const r = await checkOut({ ...where, outcome, note });
      if (fail(r)) return;
      toast({ title: labels.checkedOut });
      setOutcome("");
      setNote("");
      router.refresh();
    });
  }

  async function doPhoto(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("photo", await shrink(file));
    start(async () => {
      const r = await addVisitPhoto(fd);
      if (fail(r)) return;
      toast({ title: labels.photoAdded });
      router.refresh();
    });
  }

  const busy = pending || locating;

  if (!open) {
    return (
      <section className={`${pcard} p-5 sm:p-6`}>
        {dealer ? (
          <button type="button" onClick={doCheckIn} disabled={busy} className={pbtn("primary", "lg", "w-full sm:w-auto")}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {busy ? labels.checkingIn : pfmt(labels.checkIn, { name: dealer })}
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">{labels.chooseDealer}</p>
            <Link href="/portal/dealers" className={pbtn("primary")}>{labels.choose}</Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`${pcard} space-y-4 p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          {open.located ? <MapPin className="size-5" /> : <MapPinOff className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold tracking-[-0.015em] text-ink">{pfmt(labels.here, { name: open.dealer })}</p>
          <p className="text-sm text-muted">{pfmt(labels.since, { time: open.since })}</p>
        </div>
      </div>

      <label className={pbtn("secondary", "md", "w-full cursor-pointer sm:w-auto")}>
        <Camera className="size-4" /> {labels.addPhoto}
        {open.photos > 0 && <span className="text-muted">· {pfmt(labels.photos, { n: open.photos })}</span>}
        <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy}
          onChange={(e) => { void doPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">{labels.outcome}</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(labels.outcomes) as (keyof Labels["outcomes"])[]).map((k) => (
            <button key={k} type="button" onClick={() => setOutcome(outcome === k ? "" : k)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${outcome === k ? "bg-brand text-white ring-brand" : "bg-white/70 text-ink-soft ring-line hover:bg-white"}`}>
              {labels.outcomes[k]}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">{labels.note}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000}
          placeholder={labels.notePlaceholder} className={`${pfield} h-auto resize-y py-2.5`} />
      </label>
      <button type="button" onClick={doCheckOut} disabled={busy} className={pbtn("primary", "lg", "w-full sm:w-auto")}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        {busy ? labels.checkingOut : labels.checkOut}
      </button>
    </section>
  );
}
