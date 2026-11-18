import Link from 'next/link';

import styles from './black-friday-link.module.css';

export const BLACK_FRIDAY_PATH = '/landing/blackfriday';

export default function BlackFridayLink({
  className,
  current,
}: {
  className: string;
  current?: boolean;
}) {
  return (
    <Link
      href={BLACK_FRIDAY_PATH}
      prefetch={false}
      aria-current={current ? 'page' : undefined}
      className={`${styles.campaignLink} ${className}`}
    >
      بلک فرایدی
    </Link>
  );
}
