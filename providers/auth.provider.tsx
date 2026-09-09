'use client';

import { useEffect } from 'react';

import { UserResponse } from '@/services/features/users/types';
import { useAuthStore } from '@/store/auth.store';

type Props = {
  children: React.ReactNode;
  initialUser?: UserResponse | null;
};

export default function AuthProvider({ children, initialUser }: Props) {
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    if (initialUser !== undefined && initialUser !== null) {
      setUser(initialUser);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const { fetchMe } = await import('@/services/features/auth/api');
        const res = await fetchMe();
        if (!cancelled) setUser(res.data ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const id =
      typeof win.requestIdleCallback === 'function'
        ? win.requestIdleCallback(run)
        : window.setTimeout(run, 1500);

    return () => {
      cancelled = true;
      if (typeof win.cancelIdleCallback === 'function') {
        try {
          win.cancelIdleCallback(id as number);
        } catch {
          clearTimeout(id as unknown as number);
        }
      } else {
        clearTimeout(id as unknown as number);
      }
    };
  }, [initialUser, setUser]);

  return children;
}
