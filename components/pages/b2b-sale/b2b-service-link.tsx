'use client';

import { B2B_SERVICE_SELECT_EVENT } from './constants';

/**
 * لینکِ هر کارت راهکار: علاوه بر رفتن به بخش فرم، نوع خدمت را
 * در فرم درخواست از پیش انتخاب می‌کند.
 */
export default function B2bServiceLink({
  service,
  children,
}: {
  service: string;
  children: React.ReactNode;
}) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent(B2B_SERVICE_SELECT_EVENT, { detail: service }),
    );
  };

  return (
    <a href="#request" onClick={handleClick}>
      {children}
    </a>
  );
}
