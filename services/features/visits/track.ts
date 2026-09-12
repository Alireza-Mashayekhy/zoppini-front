import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/**
 * اطلاعات دستگاه که در مرورگر قابل تشخیص است.
 * (آی‌پی سمت سرور از هدرهای درخواست استخراج می‌شود و از کلاینت ارسال نمی‌شود)
 */
interface DeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
  screen: string;
  language: string;
}

function detectDeviceType(): string {
  const ua = navigator.userAgent;

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return 'tablet';
  }

  if (/Mobile|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

function detectOs(): string {
  const ua = navigator.userAgent;

  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android\s([\d.]+)/.test(ua)) return `Android ${RegExp.$1}`;
  if (/iPhone|iPad|iPod/.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]*)/);
    return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  }
  if (/Mac OS X\s([\d_.]+)/.test(ua)) {
    const match = ua.match(/Mac OS X\s([\d_.]+)/);
    return match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  }
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;

  if (/Edg\//.test(ua)) {
    const match = ua.match(/Edg\/([\d.]+)/);
    return match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
  }
  if (/OPR\//.test(ua)) {
    const match = ua.match(/OPR\/([\d.]+)/);
    return match ? `Opera ${match[1].split('.')[0]}` : 'Opera';
  }
  if (/SamsungBrowser\//.test(ua)) {
    const match = ua.match(/SamsungBrowser\/([\d.]+)/);
    return match ? `Samsung Internet ${match[1].split('.')[0]}` : 'Samsung Internet';
  }
  if (/Firefox\//.test(ua)) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    return match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
  }
  // Chrome باید بعد از Edge/Opera/براورها چک شود چون همه از Chromium استفاده می‌کنند
  if (/Chrome\//.test(ua)) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    return match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
  }
  if (/Safari\//.test(ua)) {
    const match = ua.match(/Version\/([\d.]+).*Safari/);
    return match ? `Safari ${match[1].split('.')[0]}` : 'Safari';
  }

  return 'Unknown';
}

function collectDeviceInfo(): DeviceInfo {
  return {
    deviceType: detectDeviceType(),
    os: detectOs(),
    browser: detectBrowser(),
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    language: navigator.language?.slice(0, 20) || 'Unknown',
  };
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};

  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key);
    if (value) {
      result[key] = value.slice(0, 100);
    }
  }

  return result;
}

/**
 * ارسال اطلاعات بازدید به بک‌اند.
 * تمام خطاها بی‌صدا نادیده گرفته می‌شوند تا هرگز تجربه کاربر را مختل نکند.
 */
export async function trackVisit(page: 'landing-opening' | 'gamification') {
  if (typeof window === 'undefined') return;

  // جلوگیری از ارسال تکراری در همان session برای هر صفحه
  const storageKey = `visit_tracked_${page}`;
  const lastTracked = sessionStorage.getItem(storageKey);
  const now = Date.now();

  if (lastTracked && now - Number(lastTracked) < 30 * 60 * 1000) {
    return;
  }

  try {
    const device = collectDeviceInfo();
    const utm = getUtmParams();

    sessionStorage.setItem(storageKey, String(now));

    await api.post(
      endpoints.visits.track,
      {
        page,
        path: window.location.pathname + window.location.search,
        referrer: document.referrer?.slice(0, 500) || undefined,
        userAgent: navigator.userAgent.slice(0, 500),
        ...device,
        ...utm,
      },
      { timeout: 5000 },
    );
  } catch {
    // خطا در ثبت بازدید نباید به کاربر نمایش داده شود
  }
}
