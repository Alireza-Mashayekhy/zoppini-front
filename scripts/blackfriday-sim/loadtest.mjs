// Usage: node scripts/blackfriday-sim/loadtest.mjs <base> <requests> <concurrency> <gapMs> [path]
const [base, n = '20', conc = '2', gap = '0', path = '/landing/blackfriday'] = process.argv.slice(2);
const fa = s => s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٬/g, '');
const results = [];
let next = 0;
async function worker() {
  while (next < Number(n)) {
    const i = next++;
    const t = Date.now();
    try {
      const res = await fetch(base + path, { headers: { 'cache-control': 'no-cache' } });
      const html = await res.text();
      const failed = html.includes('دریافت محصولات ناموفق بود');
      const m = html.match(/([۰-۹٬]+)(?:<!-- -->)? محصول<\/p>/);
      const count = m ? Number(fa(m[1])) : null;
      const exp = await (await fetch('http://127.0.0.1:4100/__eligible')).json();
      results.push({ i, status: res.status, ms: Date.now() - t, count, failed, expected: exp.eligible, kb: Math.round(html.length / 1024) });
    } catch (e) { results.push({ i, status: 'ERR', ms: Date.now() - t, error: String(e) }); }
    if (Number(gap)) await new Promise(r => setTimeout(r, Number(gap)));
  }
}
await Promise.all(Array.from({ length: Number(conc) }, worker));
results.sort((a, b) => a.i - b.i);
const ok = results.filter(r => r.status === 200 && !r.failed && r.count > 0);
const empty = results.filter(r => r.failed || r.count === 0);
const drift = ok.map(r => Math.abs(r.count - r.expected));
const ms = results.map(r => r.ms).sort((a, b) => a - b);
const stats = await (await fetch('http://127.0.0.1:4100/__stats')).json();
console.log(JSON.stringify({
  path, requests: results.length,
  withProducts: ok.length, emptyOrFailed: empty.length,
  maxCountDeviationFromTrueEligible: drift.length ? Math.max(...drift) : null,
  medianMs: ms[Math.floor(ms.length / 2)], p95Ms: ms[Math.floor(ms.length * 0.95)],
  htmlKbMedian: results.map(r => r.kb).sort((a,b)=>a-b)[Math.floor(results.length/2)],
  backendRequests: stats.total, backend429: stats.throttled, sellOutsSoFar: stats.sellOuts,
}, null, 1));
console.log('per-request:', results.map(r => `${r.i}:${r.status}/${r.failed ? 'FAIL' : r.count}/${r.ms}ms`).join(' '));
