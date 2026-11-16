# Dealer ordering portal: full plan

This plan covers dealer web ordering on **tunglamfood.my**, linked to the internal ERP at **tunglam.vercel.app**.

It is based on what already exists, as of 16 November 2026:
- **The ERP database:** project "Tung Lam ERP" in Singapore. The sales tables hold 322 customers, 346 items and 69 prices.
- **The ERP code:** the GitHub repo `tunglamfood/tunglamerp`. It already has sales screens for customers, products, prices and orders, and an AI "order reader" for WhatsApp photos.
- **AutoLab:** I reviewed its ordering, OTP login, invoice and messaging modules for patterns worth reusing.

---

## Progress (16 November 2026)

**Decisions made:**
- Item codes stay separate. Each one is shown as a variant of a product.
- Pricing: the dealer's own price, then their group's price, then the default price. Where none exists, the item shows "price on confirmation".
- Every dealer has a currency setting, defaulting to RM.
- Order alerts are left for later.

**Phase 0 – done:**
- **ERP database changes:** applied in `tunglamerp/supabase/migrations/20261116_dealer_portal.sql`.
- **Starting catalogue:** 57 products grouping 108 item codes.
- **Demo logins:** in `tunglamerp/supabase/seed/`.
- **Safer order saving:** new ERP orders are now only ever inserted, never overwritten, and order numbers come from the database.
- **Group prices:** the ERP's price lookup now includes chain-group prices.
- **New ERP screen:** Sales → Dealer portal, with Logins, Catalogue and Sales reps tabs.

**Phase 1 – done (demo):** `tunglamfood.my/portal` has:
- sign-in with phone and the demo OTP `123123`
- a catalogue with variants and each dealer's own prices
- a cart and checkout on credit terms
- orders with status, history, cancel and order-again
- a dealer picker for reps and chain groups
- all three languages

In the ERP, portal orders appear as "New from portal".

**Phase 2 – done:**
- **Order PDF:** dealers can download a PDF of any order from its page. The PDF is in English, and Chinese text in a note prints as "?".
- **"My usual":** a filter in the catalogue for items ordered in the last 6 months. It opens on the usual pack size and last quantity. The home page links to it.
- **Announcements:** written in ERP → Sales → Dealer portal → Announcements, in EN/BM/中文, with optional start and end dates. They show on the portal home page.

**Phase 3 – done:**
- **Per-dealer settings:** ERP → Customers now has payment terms, credit limit (for the office only), currency, and an on-hold switch with a reason.
- **Payment terms:** shown to the dealer at checkout and on their account page.
- **Dealers on hold:** they can still order, but their orders arrive as **"On hold (credit)"** for the office to confirm or cancel. The dealer sees "Under account review"; the reason stays internal.
- **AutoCount export:** ERP → Sales orders → **Export for AutoCount** downloads an Excel file of confirmed and delivered orders in a date range, one row per line.
  - Each exported order is marked so it never goes out twice. "Export it again next time" on an order clears the mark.
  - A chain group's sheet becomes one document per outlet: `SO-…-1`, `-2`, and so on.
  - Lines with no price are flagged after the export.
  - **Check the columns against the AutoCount import template** before the first real import. They are listed in one place, `tunglamerp/src/lib/autocount.ts`.

**Phase 4 – ready, waiting for an SMS account:**
- Real sign-in codes are sent by OneWay SMS. Only a hash of each code is stored. A code lasts 5 minutes and allows 5 tries.
- To switch it on, set `ONEWAYSMS_API_USERNAME` and `ONEWAYSMS_API_PASSWORD` (optionally `ONEWAYSMS_SENDER_ID`) in Vercel, then **remove `PORTAL_DEMO_OTP`**. While the demo code is set, it takes priority.
- This was tested end to end against a stand-in SMS gateway. The first real SMS should still be checked on a staff phone.

**Still parked:**
- WhatsApp and email updates to dealers when an order is confirmed or delivered.
- New-order alerts for the office.

---

## 1. Two systems, one place for trading data

```
                    ┌──────────────────────────────┐
  Dealers & reps ──►│ tunglamfood.my               │
  (phone + OTP)     │  • public website (SEO)      │──► Website DB (content only:
                    │  • /portal  dealer ordering  │     pages, photos, recipes)
                    └──────────────┬───────────────┘
                                   │ server-only, through portal_* database functions
                                   ▼
                    ┌──────────────────────────────┐
                    │ ERP database (single truth)  │◄── tunglam.vercel.app (staff)
                    │ customers · items · UOM ·    │     Sales · HR · Assistant ·
                    │ prices · reps · orders       │     delivery · AutoCount export
                    └──────────────┬───────────────┘
                                   ▼
                              AutoCount (accounting)
```

- **tunglam.vercel.app (ERP), staff only.** This is where the master data is kept: dealers, items, units, prices and reps. Staff confirm, adjust and deliver orders here, and the AutoCount link lives here, alongside HR and the assistant.
- **tunglamfood.my, public site plus dealer portal.** The website keeps only marketing content in its own database. The portal **never copies** trading data. It reads and writes the ERP database directly, on the server.
- **One set of rules.** Price lookup, order numbering and order totals are written once, as database functions in the ERP. The portal and the ERP call the same functions, so they always show the same numbers.
- **Instant on both sides.** A portal order appears straight away in ERP → Sales → Orders. A status change made in the ERP shows straight away to the dealer.
- **Later option.** If the two apps are ever run by separate teams, the portal can switch to calling an ERP HTTP API instead of the database. The functions above become that API.

**Linking website products to ERP items.** The 44 website products, with their photos and descriptions, get an `erp_item_code` link. ERP items get portal fields: visible in portal, display name in 3 languages, photo, category and sort order. The portal catalogue is "ERP items marked visible". Photos are reused from the website where the two are linked.

---

## 2. Payment: recommendation

**Default to credit terms, as you work today.**

- **Terms on each dealer.** Each dealer gets payment terms (COD, 7, 14, 30 or 60 days) and a credit limit in the ERP. Both can be imported from AutoCount later.
- **Checkout.** The dealer presses **Place order**; there is no payment step. The checkout shows their terms.
- **Credit check.** If the dealer is over their credit limit or has overdue invoices, the order still goes through but lands as **On hold – credit** for staff to approve. Whether this blocks or only warns is a setting.
- **Phase 3 additions:**
  - a statement of account and a list of outstanding invoices, synced from AutoCount
  - **Upload bank-in slip** on an invoice, which staff then verify
- **Optional later:** online payment (FPX / DuitNow) for COD or new dealers and to pay outstanding invoices. AutoLab already has Revenue Monster integrated, so it could be reused.

**Why credit terms first:**
- no gateway fees (about 1–2% per transaction)
- no gateway approval process
- matches how dealers buy today
- AutoCount stays the single record of receivables

---

## 3. Who logs in

| Who | What they are in the ERP | What they can do in the portal |
| --- | --- | --- |
| **Dealer** | A customer (`sales_customers.code`, e.g. `3030-xxxx`) | See their own prices, order, view their own orders |
| **Dealer staff** | Extra phones on the same customer | Same as the dealer. For example the owner plus a purchaser, like AutoLab's `dealer_team_numbers` |
| **Chain / group** | `sales_groups` (e.g. Sri Ternak, 6 outlets) | Choose the outlet on each order. The ERP already supports group orders with an outlet on each line |
| **Sales rep** | New `sales_reps` table, optionally linked to an HR worker, with dealers assigned | Pick an assigned dealer, see that dealer's prices, and order **on their behalf**. The order records who placed it |

**Login is phone + OTP.**
- **Demo:** the code **123123** works for every *registered* phone. It is controlled by the `PORTAL_DEMO_OTP` environment variable and shows a "Demo mode" banner. With the variable unset, demo login is impossible. That is the go-live switch.
- **Production:** an SMS provider sends the code. AutoLab already uses OneWay SMS (Malaysian); a WhatsApp OTP is another option.
- **Unregistered phones:** no self sign-up. The portal shows "This number isn't registered — contact Tung Lam" and links to the wholesale enquiry form.
- **Accounts:** a new `portal_accounts` table maps phone → customer or rep. Staff activate phones from the ERP.
- **Sessions:** a signed httpOnly cookie lasting 30 days, using the same approach as the website `/admin` and the ERP's own login.
- **Rate limits:** sending a code is limited per phone and per IP; there is a lockout after repeated wrong codes; logins are written to an audit log.

**Data cleanup needed first.**
- 215 of the 322 dealers have a phone number in the ERP, and 107 have none.
- Phone numbers need normalising to `+60…` format.
- The 15 Singapore dealers need a decision (see §10).

---

## 4. Items, units and prices (fully editable)

**Items.** The item master is the ERP's `sales_products` (346 codes). Many of them are not for dealers: raw materials in KG or ROLL, "self-billed invoice" lines, monthly charges. A new `portal_visible` flag lets staff tick which items dealers can order. Item group and item type (for example KB / Egg tofu, KL / fish paste, Trading / Ken Hin) become the catalogue filters.

**Units (UOM).** This is new: a `sales_item_uoms` table holding item, UOM, **rate** (how many base units it contains), barcode, whether it's orderable, and sort order.

- Example: egg tofu in PCS (rate 1) and CTN (rate 50).
- This matches AutoCount's multi-UOM model, and every value can be edited in the ERP.
- Today `pack_size` is empty for every item, and some items exist twice as separate codes, one for PCS and one for CTN. We decide with the AutoCount setup whether to merge them or keep them.

**Prices.** `sales_prices` gets a `uom` column (empty means the base unit). The existing customer / group and `effective_from` columns stay. One function, `price_for(customer, item, uom, date)`, is used by both the ERP and the portal. It checks, in order:

1. **This dealer's price** for the item and unit, taking the latest one already in effect.
2. **The dealer's group price**, if the dealer belongs to a group.
3. **The item's base price**, if it is above 0.
4. **No price found:** the item shows **"Price on confirmation"**. It can still be ordered and staff fill in the price; this can be switched to hide such items instead.

If only a per-piece price exists, the carton price is the base price × the unit rate, unless a carton price is set directly.

**The critical path is price data.** Today only 3 dealers have prices (69 rows), and most items have a base price of 0. Before launch:
- bulk import the price book from Excel or AutoCount
- add a dealer × item **price grid** in the ERP for editing
- start the pilot with the dealers whose prices are complete

---

## 5. Order lifecycle

The ERP today has 4 statuses: `draft | confirmed | delivered | cancelled`. The portal adds 3 more:

```
submitted (portal / rep) ──► confirmed ──► packing ──► delivered ──► invoiced (exported to AutoCount)
      │                         ▲
      ├─► on_hold (credit) ─────┘
      └─► cancelled  (the dealer can cancel while still "submitted")
```

`draft` stays for orders that staff key in themselves.

**New order fields:**
- `source`: erp, portal, rep, or whatsapp-reader
- `placed_by`
- timestamps for submitted, confirmed and delivered
- `cancel_reason`
- `currency` and `subtotal`

**Order lines** record the unit and the price **at the moment of ordering**, so a later price change never alters a placed order.

**History.** Every change is logged in `sales_order_events` (who, when, what). This follows AutoLab's `order_status_history` and `order_adjustments`.

**Staff adjustments.** Staff can change quantities, for example when stock is short. The dealer sees what was adjusted and why.

**Order numbers.** These need fixing before the portal goes live. The ERP's `nextOrderNo()` works out the next number by looking at existing numbers in the app, so two orders placed at the same moment could get the same number. It moves to a **counter in the database** (gap-free, as in AutoLab). The format stays the ERP's. The AutoCount document number is stored as a reference when the order is exported.

**Delivery date.** The dealer picks it, defaulting to the next working day. Rules such as cut-off times and delivery days by area can be added later; you said there are none for now.

**Notifications:**
- **Staff:** a new order triggers a WhatsApp group message and an email.
- **Dealer:** a message when the order is confirmed, adjusted, or out for delivery. The first version sends email and WhatsApp through n8n, the same route AutoLab uses; WhatsApp Business templates can follow later.

**Documents.** The dealer can download an order confirmation PDF, drawn on the server with pdf-lib as in AutoLab, including Chinese font fallback. Delivery orders and invoices come from AutoCount.

---

## 6. AutoCount

The ERP codes are already in AutoCount style: debtor codes like `3030-xxxx`, and item codes. So the mapping is one to one.

1. **Export.** Confirmed orders are exported as AutoCount **Sales Order** (or Delivery Order / Invoice) import files, by date range. Each order is marked as exported so it can't go out twice.
2. **Import master data.** Debtors (with terms, credit limit, area, agent), items with units, and price books come from AutoCount exports into the ERP. The `scripts/import-sales.mjs` script already exists to build on.
3. **Two-way sync.** Outstanding invoices and ageing come back into the ERP for dealer statements and the credit check. How this connects (file, API or connector) is decided once AutoCount is installed and we know whether it's on-premise or cloud.

---

## 7. Screens

**Portal (`tunglamfood.my/portal`):** mobile-first, installable on the phone home screen, in EN / BM / 中文.
- **Login:** phone → OTP.
- **Home:** reorder the last order, open orders with their status, announcements.
- **Catalogue:**
  - search, plus filter chips by item group / type and brand
  - each item shows its photo, name and code, a unit picker (PCS / CTN), **your price**, and a quantity stepper
- **My usual list:** favourites, plus items picked automatically from order history.
- **Cart and checkout:** outlet (for chain groups), delivery date, your PO reference (`their_ref`), notes, terms, then Place order.
- **Orders:** status timeline, adjustments, reorder, cancel (while still submitted), PDF.
- **Account:** company details (read-only), registered phones, terms; later the statement of account.
- **Rep mode:** "My dealers" (search, area) → pick a dealer → the same catalogue at that dealer's prices → place the order on their behalf. Plus a "Today's orders" list.

**ERP (tunglam.vercel.app), new or extended screens:**
- **Portal accounts:** activate phones and link them to a dealer or rep.
- **Item portal settings:** visible, photo, units and rates, display names.
- **Price grid and Excel import.**
- **Orders inbox:** a source badge (Portal / Rep / ERP), plus confirm, adjust, hold or cancel.
- **Picking list** by delivery date and area.
- **AutoCount export.**
- **Announcements** shown to dealers.

---

## 8. Security

- **Prices stay private.** Prices never go to the browser except the logged-in dealer's own, for the items on screen. All queries run on the server and are limited to the session's dealer (or the rep's assigned dealers).
- **Keys stay on the server.** The ERP key is stored only in tunglamfood.my's server environment and never in browser code. ERP tables keep row-level security on, with no public policies.
- **Totals can't be tampered with.** Totals are **recalculated in the database** when the order is submitted, so anything sent from the browser is ignored. This follows AutoLab's server-side checkout pricing.
- **Login protection.** OTP sending is rate-limited, wrong codes trigger a lockout, demo OTP is impossible in production, and logins and orders are recorded in an audit log.
- **Hidden from search.** The portal is `noindex`.

**⚠ To fix now, separately from this project:**
1. **Make `tunglamfood/tunglamerp` private.** It is currently public and contains `data/IT_CUSTOMER LIST.xlsx`, payroll spreadsheets and worker punch-card photos. Making it private stops new downloads. The files should also be removed from the git history, because anything public may already have been copied.
2. **Rotate the organisation Supabase access token** that was pasted into the chat (Supabase → Account → Access Tokens).
3. **AutoLab's README lists a default admin login.** Remove it and change that password.

---

## 9. Phases

| Phase | Delivers | Where |
| --- | --- | --- |
| **0 – Foundations** | Database changes: units, unit on prices, portal fields, `portal_accounts`, reps and assigned dealers, new order fields and history, the order-number counter, and the `price_for` / `portal_catalog` / `portal_place_order` functions. Data work: normalise dealer phones, tick portal items, set unit rates, load prices. | ERP DB + ERP app |
| **1 – Dealer portal (demo)** | Login with demo OTP 123123, catalogue with prices, cart, checkout on credit terms, orders and status, reorder, chain outlets, 3 languages, installable app. ERP order inbox handles portal orders. New-order alerts to staff. | tunglamfood.my + ERP |
| **2 – Reps & documents** | Rep login, dealer picker, order on behalf, order PDF, status messages to dealers, my usual list, announcements. | both |
| **3 – AutoCount & credit** | AutoCount export, import of debtors / items / prices, terms and credit limit, the on-hold rule, statement and outstanding invoices, bank-slip upload. | ERP (+ portal account page) |
| **4 – Go-live** | Real SMS / WhatsApp OTP, demo removed, pilot with 10–20 dealers whose prices are complete, then roll out to all. Staff training sheet. | both |
| **5 – SalesHero-style extras** (optional) | Rep visits and GPS check-in, collections, targets and commission, promotions and quantity breaks, stock availability, online FPX payment, sales analytics. | both |

---

## 10. Open decisions

1. **Where the ERP side is built.** I can work in `tunglamfood/tunglamerp`, which the same SSH key can push to. Alternatively you build the ERP screens and I build the portal plus the database functions.
2. **Items without a price:** allow ordering as "price on confirmation" (recommended for the pilot), or hide them.
3. **Singapore dealers (15):** include them in the portal, and if so, quote prices in SGD (needs a currency on each dealer)?
4. **New-order alerts:** who receives them — a WhatsApp group, an email address, or both?
5. **Duplicate item codes per unit** (for example egg tofu PCS and CTN as separate codes): merge them into one item with several units, or keep them as AutoCount has them?
6. **Order number format:** keep the ERP's current format, or align it with AutoCount's numbering?
