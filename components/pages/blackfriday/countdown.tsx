'use client';

import { useEffect, useState } from 'react';

import {
  formatCountdownUnit,
  remainingUntilDeadline,
} from '@/lib/blackfriday/campaign';

import styles from './countdown.module.css';

/**
 * بخش سوم — شمارش معکوس تا مهلت کمپین.
 *
 * - مهلت یک لحظهٔ مطلق است (`2026-11-29T23:59:59+03:30`)، پس نه منطقهٔ
 *   زمانی سرور و نه ساعت دستگاه در محاسبه اثر ندارد.
 * - اولین رندر (سرور و کلاینت) مقدار «—» را نشان می‌دهد و عددها فقط بعد از
 *   mount نوشته می‌شوند؛ بنابراین hydration هیچ‌وقت ناهماهنگ نمی‌شود.
 * - بعد از رسیدن به مهلت، متن «پایان کمپین» جای تایمر را می‌گیرد.
 */
const UNITS = [
  { key: 'seconds', label: 'ثانیه' },
  { key: 'minutes', label: 'دقیقه' },
  { key: 'hours', label: 'ساعت' },
  { key: 'days', label: 'روز' },
] as const;

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = now === null ? null : remainingUntilDeadline(now);

  return (
    <section className={styles.section} aria-labelledby="countdown-heading">
      <h2 id="countdown-heading">تا آخرین لحظه بلک‌فرایدی</h2>
      <p className={styles.support}>
        فرصت استفاده از تخفیف‌های ویژه بلک‌فرایدی زوپینی را از دست ندهید.
      </p>
      {parts?.expired ? (
        <p className={styles.ended} role="status">
          مهلت کمپین به پایان رسیده است.
        </p>
      ) : (
        <div
          className={styles.timer}
          role="timer"
          aria-label="زمان باقی‌مانده تا پایان بلک فرایدی"
          aria-live="off"
        >
          {UNITS.map(unit => {
            const value = parts ? parts[unit.key] : null;
            const text =
              value === null ? '—' : formatCountdownUnit(Number(value));

            return (
              <div key={unit.key} className={styles.unit}>
                <span className={styles.value} dir="ltr" lang="fa">
                  {text}
                </span>
                <span className={styles.label}>{unit.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
