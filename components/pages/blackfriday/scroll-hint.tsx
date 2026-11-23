'use client';

import { useEffect, useState } from 'react';

import styles from './scroll-hint.module.css';

/**
 * نشانگر اسکرول (نسخهٔ تأییدشدهٔ لندینگ).
 *
 * فقط تا وقتی کاربر به انتهای صفحه نرسیده دیده می‌شود. روی موبایل بالای نوار
 * ناوبری پایین می‌نشیند (`--zp-mobile-nav-h`) تا رویش نیفتد.
 */
export function ScrollHint() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const remaining = root.scrollHeight - root.scrollTop - root.clientHeight;
      setHidden(remaining < 72);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className={hidden ? `${styles.hint} ${styles.hidden}` : styles.hint}
      aria-hidden="true"
    >
      <span className={styles.mouse}>
        <span className={styles.wheel} />
      </span>
    </div>
  );
}
