// Mock of the Nest storefront API reproducing production conditions observed
// on zoppinico.com (2026-11-28): 171 campaign products, 1046 discounted
// products, global throttler 100 req / 60 s / IP, stock decremented by orders.
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4100);
const THROTTLE_LIMIT = Number(process.env.THROTTLE_LIMIT ?? 100);
const ORDER_INTERVAL_MS = Number(process.env.ORDER_INTERVAL_MS ?? 400);
const LONG = 'بلک فرایدی زوپینی ۱۴۰۵ | بزرگ‌ترین حراج پوشاک مردانه. '.repeat(140); // ~8 KB like category 137

const cat = (id, name, slug, parentId) => ({ id, name, slug, parentId, image: null, secondImages: [], description: LONG, isActive: true, isInHome: parentId === null, orderInHome: id, isInHeroSection: false, orderInHero: 0 });
const categories = [
  cat(137, 'بلک فرایدی زوپینی', 'zoppini-black-friday', null),
  cat(138, 'پیراهن کلاسیک', 'mens-classic-shirts', 137), cat(139, 'پیراهن کژوال', 'mens-casual-shirts', 137),
  cat(140, 'شلوار', 'mens-trousers', 137), cat(141, 'کت تک', 'mens-blazers', 137), cat(142, 'پالتو', 'mens--coats', 137),
  cat(64, 'پیراهن مردانه', 'shirt', null), cat(70, 'کفش', 'shoes', null), cat(80, 'کت و شلوار مردانه', 'suit', null),
  cat(90, 'پولوشرت/تیشرت', 'polo-t-shirt', null), cat(95, 'محصولات چرم مردانه', 'leather', null), cat(99, 'محصولات زمستانه/پاییزه', 'winter-product', null),
];
const byId = new Map(categories.map(c => [c.id, c]));
const campaignScope = new Set([137, 138, 139, 140, 141, 142]);
const storeRoots = [64, 70, 80, 90, 95, 99];

// --- catalog -------------------------------------------------------------
const products = [];
let id = 2000;
function makeProduct(i, percent, cats) {
  id -= 1;
  const price = 10_000_000 + (i % 7) * 1_000_000;
  const variants = Array.from({ length: 4 }, (_, v) => ({ id: id * 10 + v, productId: id, colorId: 1 + (v % 2), sizeId: 6 + v, price: `${price}.00`, stock: 1 + ((i + v) % 3), sku: `${id}${v}`, color: { id: 1 + (v % 2), name: v % 2 ? 'مشکی' : 'سرمه‌ای', hexCode: v % 2 ? '#000' : '#123' }, size: { id: 6 + v, name: String(46 + 2 * v) } }));
  const finalPrice = Math.round(price * (1 - percent / 100));
  return { id, productCode: String(id), title: `محصول ${id}`, slug: `p-${id}`, image: `${id}.webp`, description: LONG.slice(0, 2000), careInstructionsHtml: '', createdAt: new Date(Date.UTC(2026, 10, 26) - i * 60000).toISOString(), categoryIds: cats, variants, colorImages: [], percent, discount: percent ? { id: percent, code: null, title: 'sale', type: 'percentage', value: percent, maxDiscountAmount: null, discountAmount: price - finalPrice, originalPrice: price, finalPrice, expiresAt: '2026-11-29T20:30:00.000Z', stages: [], stacked: false, effectivePercent: percent } : null, promotionBadge: null, extraDiscountBadge: null };
}
// 171 campaign members (165 at 70%, 6 at 20%), each also in a store root
for (let i = 0; i < 171; i++) products.push(makeProduct(i, i % 29 === 0 ? 20 : 70, [137, 138 + (i % 5), storeRoots[i % 6]]));
// 875 outsiders in the sale scope: 520 at exactly 20%, the rest 10/30/40
for (let i = 0; i < 875; i++) products.push(makeProduct(171 + i, i < 520 ? 20 : [10, 30, 40][i % 3], [storeRoots[i % 6]]));

const inStock = p => p.variants.some(v => v.stock > 0);
const sorted = () => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
function serialize(p, onlyCats) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip internal field
  const { categoryIds, percent, ...rest } = p;
  const cats = (onlyCats ? categoryIds.filter(c => onlyCats.has(c)) : categoryIds).map(c => byId.get(c));
  return { ...rest, categories: cats, variants: p.variants.filter(v => v.stock > 0) };
}

// --- "orders": sell out / restock continuously ----------------------------
let orders = 0, sellOuts = 0;
if (ORDER_INTERVAL_MS > 0) setInterval(() => {
  const p = products[Math.floor(Math.random() * products.length)];
  if (process.env.SELLOUT) {
    // every tick: one product sells its last unit, another one is restocked
    if (inStock(p)) { p.variants.forEach(x => { x.stock = 0; }); orders++; sellOuts++; }
    const r = products.find(x => !inStock(x) && x !== p);
    if (r && Math.random() < 0.9) r.variants[0].stock = 2;
    return;
  }
  const v = p.variants.find(x => x.stock > 0);
  if (v) { const was = inStock(p); v.stock -= 1; orders++; if (was && !inStock(p)) sellOuts++; }
  if (Math.random() < 0.3) { const r = products[Math.floor(Math.random() * products.length)]; r.variants[0].stock += 1; }
}, ORDER_INTERVAL_MS);

// --- throttler: 100 req / 60 s / IP (all SSR traffic shares the Next IP) ---
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter(t => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > THROTTLE_LIMIT;
}

const stats = { total: 0, throttled: 0, byPath: {} };
const send = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__stats') return send(res, 200, { ...stats, orders, sellOuts, inStock: products.filter(inStock).length });
  if (url.pathname === '/__eligible') {
    const eligible = products.filter(p => inStock(p) && (p.percent === 20 || (p.categoryIds.includes(137) && p.percent === 70)));
    const campaign = products.filter(p => inStock(p) && p.categoryIds.some(c => campaignScope.has(c)));
    return send(res, 200, { eligible: eligible.length, campaignArchiveTotal: campaign.length });
  }
  if (url.pathname === '/__reset') { stats.total = 0; stats.throttled = 0; stats.byPath = {}; hits.clear(); return send(res, 200, { ok: true }); }
  stats.total++; stats.byPath[url.pathname] = (stats.byPath[url.pathname] ?? 0) + 1;
  const ip = req.socket.remoteAddress;
  if (throttled(ip)) { stats.throttled++; return send(res, 429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }); }

  if (url.pathname.startsWith('/api/products')) await sleep(Number(process.env.EXTRA_LATENCY_MS ?? 0));
  const page = Number(url.searchParams.get('page') ?? 1), limit = Number(url.searchParams.get('limit') ?? 10);
  const list = (rows, onlyCats) => {
    const total = rows.length;
    const data = rows.slice((page - 1) * limit, page * limit).map(p => serialize(p, onlyCats));
    return { status: 200, message: 'success', data, pagination: { page: String(page), limit: String(limit), total, totalPages: Math.ceil(total / limit) } };
  };

  if (url.pathname === '/api/products') {
    const ids = url.searchParams.get('categoryIds');
    let scope = null;
    if (ids) { scope = new Set(); for (const c of ids.split(',').map(Number)) { scope.add(c); if (c === 137) campaignScope.forEach(x => scope.add(x)); } }
    const rows = sorted().filter(p => inStock(p) && (!scope || p.categoryIds.some(c => scope.has(c))));
    await sleep(60 + Math.min(limit, rows.length) * 4);
    return send(res, 200, list(rows, scope));
  }
  if (url.pathname === '/api/products/discounted') {
    const rows = sorted().filter(p => inStock(p) && p.percent > 0);
    await sleep(60 + Math.min(limit, rows.length) * 4);
    return send(res, 200, list(rows, null));
  }
  if (url.pathname === '/api/products/filters') return send(res, 200, { status: 200, message: 'success', data: { colors: [], sizes: [], minPrice: 0, maxPrice: 0 } });
  if (url.pathname === '/api/categories') return send(res, 200, { status: 200, message: 'success', data: categories });
  if (url.pathname.startsWith('/api/categories/')) { const slug = decodeURIComponent(url.pathname.split('/').pop()); const c = categories.find(x => x.slug === slug); return c ? send(res, 200, { status: 200, message: 'success', data: c }) : send(res, 404, { message: 'not found' }); }
  return send(res, 200, { status: 200, message: 'success', data: [] });
}).listen(PORT, '127.0.0.1', () => console.log(`mock api on ${PORT}`));
