export const PWA_CONFIG = {
  showDelayMs: 6000,
  dismissalCooldownMs: 7 * 24 * 60 * 60 * 1000,
  dismissalKey: 'pwa-dismissed', // Kept in sync with consent storage cleanup.
  installedKey: 'pwa-installed',
} as const;
