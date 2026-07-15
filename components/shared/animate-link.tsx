// components/shared/animate-link.tsx
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface AnimateLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  download?: boolean | string; // اضافه شد
  target?: string;
}

export default function AnimateLink({
  href,
  children,
  className,
  download,
  target,
}: AnimateLinkProps) {
  const commonClasses = cn('relative w-fit overflow-hidden group', className);

  // اگر دانلود فعال باشد، از <a> استفاده کن
  if (download) {
    return (
      <a
        href={href}
        download={download === true ? undefined : download}
        target={target}
        className={commonClasses}
      >
        <span className="block transition-transform duration-300 group-hover:translate-y-[-110%]">
          {children}
        </span>
        <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
          {children}
        </span>
      </a>
    );
  }

  // در غیر این صورت از Link استفاده کن
  return (
    <Link href={href} target={target} className={commonClasses}>
      <span className="block transition-transform duration-300 group-hover:translate-y-[-110%]">
        {children}
      </span>
      <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
        {children}
      </span>
    </Link>
  );
}
