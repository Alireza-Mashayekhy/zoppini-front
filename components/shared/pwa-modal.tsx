'use client';
import InstallModal from '@/components/pwa/install-modal';
import { usePWAInstall } from '@/components/pwa/use-pwa-install';
export default function PWAModal() {
  const { open, platform, hasPrompt, dismiss, install } = usePWAInstall();
  return (
    <InstallModal
      open={open}
      platform={platform}
      hasPrompt={hasPrompt}
      onDismiss={dismiss}
      onInstall={install}
    />
  );
}
