import { NextRequest } from 'next/server';

import { handlePrivacyGet, handlePrivacyPost } from '@/lib/consent/handler';

// Browser-facing BFF. This path intentionally does NOT start with /api:
// the production reverse proxy routes /api/* to the Nest backend.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ action: string }> };

export async function GET(req: NextRequest, ctx: Context) {
  return handlePrivacyGet(req, (await ctx.params).action);
}

export async function POST(req: NextRequest, ctx: Context) {
  return handlePrivacyPost(req, (await ctx.params).action);
}
