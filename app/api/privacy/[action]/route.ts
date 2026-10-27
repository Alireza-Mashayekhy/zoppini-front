import { NextRequest } from 'next/server';

import { handlePrivacyGet, handlePrivacyPost } from '@/lib/consent/handler';

// Legacy alias, kept for local development and any deployment where Next owns
// /api. In production /api/* is forwarded to Nest, so browsers must use
// /privacy/* (see lib/consent/endpoints.ts).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ action: string }> };

export async function GET(req: NextRequest, ctx: Context) {
  return handlePrivacyGet(req, (await ctx.params).action);
}

export async function POST(req: NextRequest, ctx: Context) {
  return handlePrivacyPost(req, (await ctx.params).action);
}
