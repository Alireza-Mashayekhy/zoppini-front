# `/landing/blackfriday` intermittently shows “۰ محصول” — root cause, fix, verification

Date: 2026-11-28 · Branch `arena/b3fee984-zoppini` (base `cca0bdc`)

---

## 1. Root cause

### 1.1 Reproduced in production

At the same moment (2026-11-28):

| URL | Result |
|---|---|
| `https://zoppinico.com/landing/blackfriday` | Hero strip and countdown rendered. The collection showed **“۰ محصول”** and **“دریافت محصولات ناموفق بود. کمی بعد دوباره تلاش کنید.”** with a “تلاش دوباره” button. |
| `https://zoppinico.com/product-category/zoppini-black-friday` | Products listed normally. |

The message is not “no products match.” It is the `unavailable` branch of `ProductCollection`. That branch is only rendered when one of the server-side catalog scans **throws**. So the landing page thinks its data request failed, not that it received zero products.

### 1.2 How the two pages fetch data

Both pages read the **same local database through the same Nest API**. Neither one calls Rahkaran.

| | Archive `/product-category/zoppini-black-friday` | Landing `/landing/blackfriday` (before fix) |
|---|---|---|
| Server-side requests per render | **1** — `GET /api/products?categoryIds=137&page=1&limit=24&sort=…` | **~53** — `GET /api/products?categoryIds=137&limit=24&sort=createdAt:desc&page=1..8` (total 171 → 8 pages), plus `GET /api/products/discounted?limit=24&sort=createdAt:desc&page=1..44` (total 1046 → 44 pages), plus categories |
| Later pages | Fetched from the browser (each visitor’s own IP) | None. The whole catalog is scanned on the server so the 70%/20% eligibility rules can be applied. |
| Concurrency | — | Batches of 5 |
| Caching | `no-store` | `no-store` (`publicFetch` default). Every render re-scans everything. |
| Error policy | One request: it works or it doesn’t | **All-or-nothing.** Any failed page, or any change in `total`/`totalPages` during the scan, throws `Incomplete or inconsistent product catalog`. The page then gets `catalog === null`, `eligibleProducts = []` and `unavailable = true`. |
| Timeout / retry | — | None / none |
| Recovery | — | Manual “تلاش دوباره” → `router.refresh()`, which re-runs the same 53-request scan |

Sample live responses (2026-11-28):

```
GET /api/products?page=1&limit=24&sort=createdAt:desc&categoryIds=137
200 {"pagination":{"page":"1","limit":"24","total":171,"totalPages":8}, "data":[{…,"discount":{"id":31,"name":"بلک","percentage":70,"effectivePercent":70,"expiresAt":"2026-11-29T20:30:00Z","stacked":false},…}]}

GET /api/products/discounted?page=1&limit=24&sort=createdAt:desc
200 {"pagination":{"page":"1","limit":"24","total":1046,"totalPages":44}, …}
```

`page` and `limit` come back as **strings**. Every product carries the full category objects, including the ~8 KB category description, so a single page is large.

### 1.3 Failure mechanisms (in order of impact)

1. **Rate limit (primary).** `back/src/app.module.ts` registers a global `ThrottlerGuard` with `ttl: 60000` and `limit: 100` (per IP). `/products` and `/products/discounted` are not exempt. Every SSR request comes from the **Next.js server’s single IP**, a known issue already noted in `COOKIE_ANALYTICS.md`. One landing render spends about 53 of the 100 requests per minute, so a second render within the same minute (or the archive SSR, sitemap and other pages sharing that IP) gets **HTTP 429 `ThrottlerException: Too Many Requests`**. `publicFetch` throws `ApiError(429)`, the all-or-nothing scan rejects, and the page shows “۰ محصول”. The failure then lasts until the throttle window rolls over. Pressing “تلاش دوباره” re-runs the 53 requests and keeps the window exhausted.
2. **Catalog drift during the scan (secondary).** The public endpoints use `onlyInStock`. Each order decrements stock (`order.service.ts` ~L800, `stock - quantity`); an admin or Rahkaran stock sync can do the same. When a product sells out or is restocked during a 1–3 s scan, the pages shift and `total` changes. The old scanner treats this as fatal and throws. In simulation this alone failed **6 of 10** renders (§3.2).
3. **No timeout, no retry, no last-good fallback.** A single transient 5xx or connection reset had the same effect as a full outage.

**Ruled out (checked):**

- **Sort nondeterminism.** The API breaks ties with `id`.
- **Rahkaran as a live source.** The landing page never calls it. Only admin endpoints (`/admin/products/rahkaran/*`) touch Rahkaran.
- **Sync timing.** The Rahkaran stock sync is a daily cron (`'0 0 4 * * *'`, `rahkaran-products-sync` in `producs.scheduler.ts`). It cannot explain failures throughout the day, although it is one source of drift while it runs.
- **Duplicate client requests.** The collection was fully server-rendered, so there were no client requests to race.
- **Stale client cache overwriting data.** Same reason as above.

Per the instructions, the Rahkaran integration was **not modified**. I had no database access, so I could not read actual sync timestamps. The evidence above shows the bug does not depend on them.

**Not the cause, but worth knowing:** eligibility requires `effectivePercent` to be exactly 70 (category 137) or exactly 20 (store-wide), and the discount must not have expired. The current campaign discount expires at `2026-11-29T20:30:00Z`, after which the section empties **by design**. Discount data is cached for 30 s in the backend.

---

## 2. Fix (frontend only; design, cards and campaign rules unchanged)

| File | Change |
|---|---|
| `lib/blackfriday/catalog.ts` | Page size 24 → **100**: 2 + 11 = **13 requests** instead of 8 + 44. Each request has a 20 s `AbortSignal.timeout`. Products are slimmed for the listing (`slim.ts`). |
| `lib/blackfriday/catalog-scan.ts` | Per-page retry: 3 attempts, 400 ms × 2ⁿ backoff, ×4 for 429. Retries only transient errors (network, 408, 425, 429, 5xx, invalid page). Concurrency 3. **Drift-tolerant:** if `total` changes mid-scan it rescans once, then unions both passes de-duplicated by id instead of throwing. Every failure is logged with endpoint, page and attempt. |
| `lib/blackfriday/snapshot-store.ts` (new) | Process-wide **last-good snapshot** per catalog: single-flight (one scan, however many concurrent renders), stale-while-revalidate (fresh 60 s), **stale-if-error** (up to 15 min), a 10 s cooldown after a failure, and a **guard against an unconfirmed empty result** (an empty scan replaces non-empty data only when two consecutive scans agree). Cold reads wait at most a configurable budget. |
| `lib/blackfriday/collection.ts` (new, pure) | Same eligibility as before (70% from category 137 plus 20% store-wide, unexpired), extracted so the page and the recovery endpoint share one implementation. |
| `lib/blackfriday/collection-source.ts` (new, server-only) | The two stores, kept on `globalThis` so the page bundle and the route-handler bundle share **one** snapshot. Page cold-wait 12 s; recovery endpoint 25 s. Logs unexpected empty or unavailable results. |
| `app/landing/blackfriday/page.tsx` | Reads from the collection source. Layout and props unchanged. |
| `app/landing/blackfriday/products/route.ts` (new) | `GET /landing/blackfriday/products`: JSON for the collection with `Cache-Control: no-store`; **503 + `Retry-After: 5`** while unavailable. |
| `hooks/use-blackfriday-recovery.ts`, `lib/blackfriday/recovery.ts` (new) | When the server render was unavailable, the client **recovers automatically**: retries at 0, 2, 5, 10 and 20 s, aborts on unmount, and retries on the `online` event. It never accepts an `unavailable` payload, and never replaces non-empty products with an empty list (a genuinely empty campaign, e.g. after expiry, is still shown as empty). “تلاش دوباره” retries the endpoint instead of `router.refresh()`. |
| `components/pages/blackfriday/product-collection.tsx` | Uses the recovery hook. Shows “در حال دریافت محصولات…” (`aria-busy`) while recovering, and the existing error text only after recovery is exhausted. **No style or card changes.** |
| `services/api/server.ts`, `services/features/products/server.api.ts` | Pass an `AbortSignal` through (backward compatible). |

What this guarantees:

- **Valid data is never overwritten by an empty or failed response**, server side (snapshot plus empty-confirmation) and client side (`shouldAcceptRecovery`).
- **No duplicate requests.** Scans are single-flight per process. The page and the recovery endpoint join the same in-flight scan. The client cancels its own retries on unmount.
- **Pagination and filtering are consistent:** they run over one coherent snapshot, using the same client-side logic as before.
- A temporary failure cannot leave the section permanently empty. The last good snapshot is served for up to 15 minutes, and a cold failure self-heals through client recovery.

The backend was not changed. With the fix, the landing page spends at most about 13 requests per minute of the 100-request quota (and less under load, thanks to the snapshot). See §4 for the recommended backend follow-up.

---

## 3. Verification

### 3.1 Automated tests

- `npx tsx --test tests/blackfriday-*.test.ts`: **76 / 76 pass** (50 before). New coverage includes:
  - a 1046-product sell-out during the scan;
  - 429 with backoff, 5xx, and invalid pages;
  - request count 44 → 11;
  - single-flight, stale-while-revalidate and stale-if-error;
  - the empty-confirmation guard and the cold-wait budget;
  - the derive/expiry rules;
  - recovery payload acceptance;
  - the route/page wiring and the shared-store requirement.
- Full suite `npx tsx --test tests/*.test.ts tests/*.test.tsx`: **515 tests, 512 pass, 3 fail**. All three failures already fail on base `cca0bdc`, unchanged and unrelated:
  - the category-landing description test;
  - the trust-bar test;
  - `torob-consent.test.ts`.
- `npx tsc --noEmit` is clean. ESLint is clean on all changed and new files.

### 3.2 End-to-end simulation: original build vs fixed build

Both trees were built with `next build` and run with `next start` against a mock Nest API (`scripts/blackfriday-sim/mock-api.mjs`). The mock reproduces the production numbers: 171 campaign and 1046 discounted products, string `page`/`limit`, heavy category payloads, the throttler at 100/60 s/IP returning `ThrottlerException` 429, and orders decrementing stock. The load driver `scripts/blackfriday-sim/loadtest.mjs` parses the rendered “N محصول” count and checks it against the mock’s true eligible count (691).

| Scenario | Original code | Fixed code |
|---|---|---|
| **A. Rate limit**: 12 loads, concurrency 2, normal orders | **12 / 12 failed** (“دریافت محصولات ناموفق بود”, 0 products); 125 backend calls, **25 × 429**. The server log shows `ApiError: ThrottlerException: Too Many Requests`, matching production. | **12 / 12 show 691 products** (deviation 0); 15 backend calls; 0 × 429 |
| **B. Heavy sell-out/restock churn**, no throttle (drift only), sequential reloads | **6 / 10 failed**; the other 4 showed 689–691; 472 backend calls | **20 / 20 show products** (688–690, within 3 of the moving true count); 93 backend calls over ~150 s. The log shows `changed during scan … rescanning / using union of passes`. |
| **C1. Backend outage after a good snapshot**: API killed, snapshot past its 60 s fresh window | — | 4 / 4 reloads show **691 products**. The log shows `refresh failed … serving last good snapshot (age 74–88s)`. |
| **C2. Cold start while the backend is down** | — | The page shows the loading state (`در حال دریافت محصولات…`, `aria-busy`), not the failure text. The recovery endpoint returns **503, `no-store`, `Retry-After: 5`**. After the API comes back, the next recovery call returns **200 with 691 products** (equal to the true eligible count). |
| **D. Slow backend**: +2.5 s on every product request | — | The page returns at its 12 s budget with the loading state. A concurrent recovery request **joins the same scan** and returns 691 products. The backend saw exactly 2 + 11 product requests (one scan) and 0 × 429. |
| Page cache headers | — | Page `private, no-cache, no-store, max-age=0, must-revalidate`; recovery `no-store` |
| Shared snapshot across bundles | — | Warming through the route, then rendering the page: **0 additional backend calls** |

**Known trade-off:** the fixed page’s HTML is about 1.5 MB, versus 320–350 KB for the original. The original’s smaller size was largely because it rendered 0 products. The extra weight comes from serializing all 691 eligible (already slimmed) products for client-side filtering, sorting and infinite scroll, which is the existing design and was kept as is. It compresses well with gzip/brotli. A possible follow-up, without visual changes, is to send only the first page of cards in the HTML and fetch the rest from the recovery endpoint.

### 3.3 How to re-run the simulation

```bash
cd front
node scripts/blackfriday-sim/mock-api.mjs            # env: THROTTLE_LIMIT, ORDER_INTERVAL_MS, SELLOUT=1, EXTRA_LATENCY_MS
API_URL=http://127.0.0.1:4100/api/ NEXT_PUBLIC_API_URL=http://127.0.0.1:4100/api/ npx next build && \
API_URL=http://127.0.0.1:4100/api/ NEXT_PUBLIC_API_URL=http://127.0.0.1:4100/api/ npx next start -p 3000
curl -s localhost:4100/__reset
node scripts/blackfriday-sim/loadtest.mjs http://127.0.0.1:3000 12 2 0   # <base> <n> <concurrency> <gapMs>
```

### 3.4 Manual regression checklist (to run on staging or production after deploy)

These need a real browser and real traffic. I could not run them from the sandbox.

- [ ] **Incognito**, desktop: the landing page shows the collection with “N محصول”. N equals the number of 70%-off products in the archive `zoppini-black-friday` plus the 20% store-wide products. Spot-check that the archive total (171 on 2026-11-28) is ≥ the 70% part.
- [ ] **10 rapid reloads** (Ctrl+Shift+R), plus a few reloads of the archive in another tab: no reload shows “۰ محصول”. The server log has no `ThrottlerException`, or shows `serving last good snapshot` if one occurs.
- [ ] **Mobile** (real device or DevTools 390 px): cards, filter sheet and infinite scroll are unchanged.
- [ ] **DevTools → Disable cache** on, then off: same result. `/landing/blackfriday/products` responses carry `no-store`.
- [ ] **Slow 3G** throttling: the collection either renders, or shows “در حال دریافت محصولات…” and then fills in with no manual action.
- [ ] **Offline → online** while the error text is shown: the list fills in automatically after reconnecting.
- [ ] Filters (subcategory, size, color, price) and sort: counts and order behave as before. Infinite scroll reaches the end without duplicates.
- [ ] Logs: `[blackfriday:snapshot] … refreshed N items` at most about once a minute per server instance.

---

## 4. Recommendations (not done in this change)

1. **Backend throttling for SSR.** All SSR traffic shares one IP and one 100/min bucket; this affects every server-rendered page, not only this one. Prefer a scoped fix over blanket `@SkipThrottle()` on `/products`, which would remove abuse protection from the heaviest public queries. For example:
   - trust the proxy and key the throttler on the real client IP (`X-Forwarded-For`);
   - or exempt requests from the Next server carrying an internal secret header.
2. Monitor the `[blackfriday:collection] eligible products unavailable` and `unexpected empty` log lines during the campaign.
3. After `2026-11-29T20:30Z` the campaign discount expires and the section empties by design. Extend the discount in the admin panel if the campaign continues.
