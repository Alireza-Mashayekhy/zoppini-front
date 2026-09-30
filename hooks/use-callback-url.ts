'use client';

import { useSearchParams } from 'next/navigation';

import { sanitizeCallbackUrl } from '@/lib/callback-url';

export function useCallbackUrl(): string | null {
  const searchParams = useSearchParams();
  return sanitizeCallbackUrl(searchParams.get('callbackUrl'));
}
