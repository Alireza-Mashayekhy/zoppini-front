import { createHash } from 'node:crypto';
// Transient abuse prevention only; no address/UA written to analytics, ledger or logs.
const buckets = new Map<string, { count: number; until: number }>();
export function allowRequest(address: string, action: string) {
  const now = Date.now();
  for (const [key, b] of buckets) if (b.until <= now) buckets.delete(key);
  const key = createHash('sha256').update(`${address}:${action}`).digest('hex');
  const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
  if (!buckets.has(key) && buckets.size >= 10000) return false;
  bucket.count++;
  buckets.set(key, bucket);
  return bucket.count <= (action === 'consent' ? 20 : 120);
}
export async function readLimitedBody(request: Request, limit = 4096) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error('Payload too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
