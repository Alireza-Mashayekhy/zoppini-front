export type Platform =
  | 'ios-safari'
  | 'ios-chrome'
  | 'ios-other'
  | 'mac-safari'
  | 'android'
  | 'desktop'
  | 'other';

/** UA is only used for manual instructions; native installation is feature-detected. */
export function detectPlatform(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): Platform {
  const ios =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);
  if (ios) {
    if (/CriOS/i.test(userAgent)) return 'ios-chrome';
    if (/FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(userAgent)) return 'ios-other';
    return /Safari/i.test(userAgent) ? 'ios-safari' : 'ios-other';
  }
  if (/Android/i.test(userAgent)) return 'android';
  if (
    /Macintosh|Mac OS X/i.test(userAgent) &&
    /Safari/i.test(userAgent) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|Firefox/i.test(userAgent)
  ) {
    const version = Number(userAgent.match(/Version\/(\d+)/i)?.[1] || 0);
    return version >= 17 ? 'mac-safari' : 'other';
  }
  if (/Windows|Macintosh|Mac OS X|Linux/i.test(userAgent)) return 'desktop';
  return 'other';
}

export function isStandalone(win: Window, nav: Navigator): boolean {
  return (
    !!(nav as Navigator & { standalone?: boolean }).standalone ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(
      mode => win.matchMedia(`(display-mode: ${mode})`).matches,
    )
  );
}

export function isSafePromotionPath(path: string): boolean {
  return !/^\/(?:checkout|cart|basket|dashboard|admin|login|login-with-pass|forgot-pass|register|signup|sign-up|auth|payment)(?:\/|$)/i.test(
    path,
  );
}
