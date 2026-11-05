'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { preferencesAllowed } from '@/lib/consent/client';
import { PWA_CONFIG } from '@/lib/pwa/config';
import {
  detectPlatform,
  isSafePromotionPath,
  isStandalone,
  type Platform,
} from '@/lib/pwa/platform';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let shownThisPageLoad = false;
let installedThisPageLoad = false;
function readStorage(key: string): string | null {
  try {
    return preferencesAllowed() ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    if (preferencesAllowed()) localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable. */
  }
}
export function usePWAInstall() {
  const pathname = usePathname();
  const [platform, setPlatform] = useState<Platform>('other');
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const initialCheck = setTimeout(() => {
      setPlatform(
        detectPlatform(
          navigator.userAgent,
          navigator.platform,
          navigator.maxTouchPoints,
        ),
      );
      checkDisplay();
    }, 0);
    const checkDisplay = () => {
      if (isStandalone(window, navigator)) {
        installedThisPageLoad = true;
        setInstalled(true);
        setOpen(false);
      }
    };
    const display = window.matchMedia('(display-mode: standalone)');
    display.addEventListener?.('change', checkDisplay);
    const onPrompt = (event: Event) => {
      if (isStandalone(window, navigator)) return;
      if (
        detectPlatform(
          navigator.userAgent,
          navigator.platform,
          navigator.maxTouchPoints,
        ).startsWith('ios')
      )
        return;
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      installedThisPageLoad = true;
      writeStorage(PWA_CONFIG.installedKey, '1');
      setInstalled(true);
      setOpen(false);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startDelay = () => {
      timer = setTimeout(() => setReady(true), PWA_CONFIG.showDelayMs);
    };
    if (document.readyState === 'complete') startDelay();
    else window.addEventListener('load', startDelay, { once: true });
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {});
    }
    return () => {
      clearTimeout(initialCheck);
      if (timer) clearTimeout(timer);
      window.removeEventListener('load', startDelay);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      display.removeEventListener?.('change', checkDisplay);
    };
  }, []);
  useEffect(() => {
    if (!ready || installed || shownThisPageLoad) return;
    const manual = platform.startsWith('ios') || platform === 'mac-safari';
    if (!manual && !prompt) return;
    const maybeShow = (): boolean => {
      if (
        shownThisPageLoad ||
        installedThisPageLoad ||
        isStandalone(window, navigator) ||
        !isSafePromotionPath(pathname)
      )
        return false;
      if (readStorage(PWA_CONFIG.installedKey)) return false;
      const dismissed = Date.parse(readStorage(PWA_CONFIG.dismissalKey) || '');
      if (
        Number.isFinite(dismissed) &&
        Date.now() - dismissed < PWA_CONFIG.dismissalCooldownMs
      )
        return false;
      if (
        document.querySelector('[role="dialog"], [aria-label="رضایت کوکی‌ها"]')
      )
        return false;
      shownThisPageLoad = true;
      setOpen(true);
      return true;
    };
    if (maybeShow()) return;
    const interval = setInterval(() => {
      if (maybeShow()) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [ready, installed, platform, prompt, pathname]);
  useEffect(() => {
    // Navigating to a transactional route must permanently close an open promotion.
    if (!isSafePromotionPath(pathname)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [pathname]);
  const dismiss = useCallback(() => {
    writeStorage(PWA_CONFIG.dismissalKey, new Date().toISOString());
    setOpen(false);
  }, []);
  const install = useCallback(async () => {
    if (!prompt) return;
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'dismissed')
        writeStorage(PWA_CONFIG.dismissalKey, new Date().toISOString());
    } catch {
      writeStorage(PWA_CONFIG.dismissalKey, new Date().toISOString());
    } finally {
      setOpen(false);
    }
  }, [prompt]);
  return {
    open: open && isSafePromotionPath(pathname),
    platform,
    hasPrompt: !!prompt,
    dismiss,
    install,
  };
}
