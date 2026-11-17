import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { SITE, fullAddress } from "@/lib/site";
import { LOGO_PNG_BASE64 } from "./pdf-logo";
import type { PortalOrder } from "./data";
import type { PortalCustomer } from "./context";

/**
 * A dealer's copy of one order, as a PDF they can print or forward.
 *
 * Built with pdf-lib's standard Helvetica, which only knows Latin text: the PDF
 * is in English, and characters it cannot draw (Chinese in a note, emoji)
 * come out as "?". Product descriptions, codes and dealer names are Latin.
 */

const A4 = { w: 595.28, h: 841.89 };
const M = 42; // page margin
const INK = rgb(0.12, 0.11, 0.1);
const MUTED = rgb(0.42, 0.4, 0.37);
const LINE = rgb(0.87, 0.85, 0.82);
const BRAND = rgb(0.75, 0.13, 0.14);
const FILL = rgb(0.98, 0.96, 0.93);

const STATUS_LABEL: Record<string, string> = {
  submitted: "Waiting for confirmation",
  on_hold: "Under account review",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
  draft: "Being prepared",
};

// WinAnsi: printable ASCII, Latin-1 and the few extras Helvetica carries.
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const safe = (s: string) =>
  [...s]
    .map((ch) => {
      const c = ch.codePointAt(0)!;
      if (c < 0x20 || c === 0x7f) return " "; // tabs, stray line breaks
      return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch) ? ch : "?";
    })
    .join("");

/** Characters Helvetica can draw; anything else (Chinese, emoji…) needs the extra font. */
const ansiOk = (ch: string) => {
  const c = ch.codePointAt(0)!;
  return c < 0x20 || c === 0x7f || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN_ANSI_EXTRA.includes(ch);
};
const needsCjk = (s: string) => [...s].some((ch) => !ansiOk(ch));
const plain = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, " ");
const BASIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?-/()[]#&@'\"+*%=_~";

/**
 * Chinese in a dealer's note, address or name: a tiny Noto Sans SC font holding only
 * the characters this PDF needs, from Google Fonts. Only the sorted set of characters is
 * sent — never the text itself. Without it (offline), those characters print as "?".
 */
async function cjkFontFor(text: string): Promise<Uint8Array | null> {
  const chars = [...new Set([...text].filter((ch) => !ansiOk(ch)))];
  if (chars.length === 0) return null;
  try {
    const set = [...new Set([...chars, ...BASIC])].sort().join("");
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&text=${encodeURIComponent(set)}`, {
        headers: { "User-Agent": "Mozilla/4.0 (compatible)" },
        signal: AbortSignal.timeout(6000),
      })
    ).text();
    const url = css.match(/url\((https:[^)]+)\)\s*format\(['"]truetype/)?.[1];
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

function wrap(text: string, font: PDFFont, size: number, width: number, cjk: PDFFont | null = null): string[] {
  const out: string[] = [];
  // Split into lines before cleaning: addresses from the old system use \r, \r\n or \n.
  for (const raw of text.split(/\r\n|[\r\n\v\u2028\u2029]/)) {
    const useCjk = !!cjk && needsCjk(raw);
    const para = useCjk ? plain(raw) : safe(raw);
    const f = useCjk ? cjk! : font;
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(next, size) <= width) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      // A single word wider than the column is cut, not allowed to overflow.
      let w = word;
      while (f.widthOfTextAtSize(w, size) > width && w.length > 1) {
        let cut = w.length - 1;
        while (cut > 1 && f.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
        out.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      line = w;
    }
    out.push(line);
  }
  return out;
}

const fmtMoney = (n: number, currency: string) =>
  `${currency === "SGD" ? "S$" : "RM"} ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
};

export async function orderPdf(order: PortalOrder, customer: PortalCustomer | undefined): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Order ${order.orderNo}`);
  doc.setAuthor(SITE.legalName);
  doc.setCreator("Tung Lam dealer portal");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64"));
  doc.registerFontkit(fontkit);
  const everything = [order.note, order.theirRef, order.placedBy, customer?.name, customer?.address, ...order.lines.map((l) => l.description)]
    .filter(Boolean)
    .join(" ");
  const cjkBytes = await cjkFontFor(everything);
  const cjk = cjkBytes ? await doc.embedFont(cjkBytes, { subset: true }).catch(() => null) : null;

  /** Helvetica for plain text; the Chinese font for a string that needs it. */
  const pick = (s: string, f: PDFFont) => (cjk && needsCjk(s) ? { str: plain(s), f: cjk } : { str: safe(s), f });
  const text = (page: PDFPage, s: string, x: number, y: number, size = 9, f: PDFFont = font, color = INK) => {
    const p = pick(s, f);
    page.drawText(p.str, { x, y, size, font: p.f, color });
  };
  const right = (page: PDFPage, s: string, xRight: number, y: number, size = 9, f: PDFFont = font, color = INK) => {
    const p = pick(s, f);
    text(page, s, xRight - p.f.widthOfTextAtSize(p.str, size), y, size, f, color);
  };

  // Columns: code | description | qty | uom | unit price | amount
  const cols = { code: M, desc: M + 70, qty: 388, uom: 396, price: 492, amount: A4.w - M };
  const descWidth = cols.qty - 40 - cols.desc;

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const tableHead = () => {
    page.drawRectangle({ x: M, y: y - 6, width: A4.w - 2 * M, height: 20, color: FILL });
    text(page, "ITEM", cols.code + 4, y, 8, bold, MUTED);
    text(page, "DESCRIPTION", cols.desc, y, 8, bold, MUTED);
    right(page, "QTY", cols.qty, y, 8, bold, MUTED);
    text(page, "UNIT", cols.uom, y, 8, bold, MUTED);
    right(page, "UNIT PRICE", cols.price, y, 8, bold, MUTED);
    right(page, "AMOUNT", cols.amount - 4, y, 8, bold, MUTED);
    y -= 22;
  };

  const newPage = (first: boolean) => {
    page = doc.addPage([A4.w, A4.h]);
    pages.push(page);
    y = A4.h - M;
    if (!first) {
      text(page, `Order ${order.orderNo} (continued)`, M, y - 10, 10, bold);
      y -= 34;
      tableHead();
    }
  };

  /* ── Header ── */
  newPage(true);
  const logoH = 52;
  const logoW = (logo.width / logo.height) * logoH;
  page.drawImage(logo, { x: M, y: y - logoH, width: logoW, height: logoH });
  right(page, "ORDER", A4.w - M, y - 18, 20, bold, BRAND);
  right(page, order.orderNo, A4.w - M, y - 36, 11, bold);
  right(page, STATUS_LABEL[order.status] ?? order.status, A4.w - M, y - 50, 9, font, MUTED);
  y -= logoH + 14;

  text(page, SITE.legalName, M, y, 9, bold);
  text(page, `Reg. no. ${SITE.registrationNo}`, M + bold.widthOfTextAtSize(SITE.legalName, 9) + 8, y, 8, font, MUTED);
  y -= 12;
  for (const l of wrap(fullAddress, font, 8, 330)) {
    text(page, l, M, y, 8, font, MUTED);
    y -= 10;
  }
  text(page, `${SITE.phoneDisplay}  ·  ${SITE.email}`, M, y, 8, font, MUTED);
  y -= 22;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: LINE });
  y -= 18;

  /* ── Dealer and order details ── */
  const topY = y;
  text(page, "ORDERED FOR", M, y, 7.5, bold, MUTED);
  y -= 13;
  for (const l of wrap(customer?.name ?? order.customerCode, bold, 10, 270, cjk)) {
    text(page, l, M, y, 10, bold);
    y -= 13;
  }
  text(page, `Dealer code ${order.customerCode}`, M, y, 8.5, font, MUTED);
  y -= 11;
  for (const l of wrap(customer?.address ?? "", font, 8.5, 270, cjk).filter(Boolean)) {
    text(page, l, M, y, 8.5, font, MUTED);
    y -= 11;
  }
  const leftEnd = y;

  const details: [string, string][] = [
    ["Order date", fmtDate(order.orderDate)],
    ["Delivery date", fmtDate(order.deliverOn)],
    ...(order.theirRef ? ([["Your PO", order.theirRef]] as [string, string][]) : []),
    ...(order.placedBy ? ([["Placed by", order.placedBy]] as [string, string][]) : []),
    ...(customer?.paymentTerms ? ([["Payment terms", customer.paymentTerms]] as [string, string][]) : []),
    ["Currency", order.currency],
  ];
  let ry = topY;
  for (const [k, v] of details) {
    text(page, k, 340, ry, 8.5, font, MUTED);
    right(page, v.slice(0, 40), A4.w - M, ry, 8.5, bold);
    ry -= 13;
  }
  y = Math.min(leftEnd, ry) - 16;

  /* ── Lines ── */
  tableHead();
  for (const l of order.lines) {
    const desc = wrap(l.description, font, 9, descWidth, cjk);
    const h = Math.max(1, desc.length) * 11 + 7;
    if (y - h < M + 70) newPage(false);
    text(page, l.itemCode, cols.code + 4, y, 8.5, bold);
    desc.forEach((d, i) => text(page, d, cols.desc, y - i * 11, 9));
    right(page, String(l.qty), cols.qty, y, 9, bold);
    text(page, l.uom, cols.uom, y, 8.5, font, MUTED);
    right(page, l.price > 0 ? fmtMoney(l.price, order.currency).replace(/^(RM|S\$) /, "") : "TBC", cols.price, y, 9);
    right(page, l.price > 0 ? fmtMoney(l.qty * l.price, order.currency).replace(/^(RM|S\$) /, "") : "-", cols.amount - 4, y, 9, bold);
    y -= h;
    page.drawLine({ start: { x: M, y: y + 9 }, end: { x: A4.w - M, y: y + 9 }, thickness: 0.4, color: LINE });
  }

  /* ── Total, note, footer ── */
  if (y < M + 110) newPage(false);
  y -= 8;
  page.drawRectangle({ x: 340, y: y - 8, width: A4.w - M - 340, height: 26, color: FILL });
  text(page, order.hasTbc ? "Estimated total" : "Total", 350, y, 10, bold);
  right(page, `${fmtMoney(order.total, order.currency)}${order.hasTbc ? " +" : ""}`, A4.w - M - 8, y, 11, bold);
  y -= 30;
  if (order.hasTbc) {
    text(page, "TBC: priced by Tung Lam when the order is confirmed.", 340, y, 7.5, font, MUTED);
    y -= 16;
  }

  if (order.note) {
    if (y < M + 80) newPage(false);
    text(page, "NOTE", M, y, 7.5, bold, MUTED);
    y -= 12;
    for (const l of wrap(order.note, font, 9, A4.w - 2 * M, cjk).slice(0, 20)) {
      if (y < M + 30) newPage(false);
      text(page, l, M, y, 9);
      y -= 11;
    }
  }

  const total = pages.length;
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 4 }, end: { x: A4.w - M, y: M - 4 }, thickness: 0.4, color: LINE });
    text(p, "Order record from the Tung Lam dealer portal. Not a tax invoice; the invoice follows on delivery.", M, M - 16, 7, font, MUTED);
    right(p, `Page ${i + 1} of ${total}`, A4.w - M, M - 16, 7, font, MUTED);
  });

  return doc.save();
}
