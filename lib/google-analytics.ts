const MEASUREMENT_ID = 'G-9X59F9BJFQ';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function safeReferrer() {
  try {
    return document.referrer ? new URL(document.referrer).hostname : '';
  } catch {
    return '';
  }
}

export function initializeGoogleAnalytics() {
  // Older versions may have disabled this property in the same page session.
  (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] = false;
  if (document.getElementById('zoppini-google-tag')) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + '/',
    page_referrer: safeReferrer(),
    page_title: '',
  });
  const script = document.createElement('script');
  script.id = 'zoppini-google-tag';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function sendGooglePageView() {
  window.gtag?.('event', 'page_view', {
    send_to: MEASUREMENT_ID,
    page_location: location.origin + '/',
    page_referrer: safeReferrer(),
    page_title: '',
  });
}
