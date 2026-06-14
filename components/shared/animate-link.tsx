import Link from 'next/link';

import { cn } from '@/lib/utils';

export default function AnimateLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('relative w-fit overflow-hidden group', className)}
    >
      <span className="block transition-transform duration-300 group-hover:translate-y-[-110%]">
        {children}
      </span>
      <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
        {children}
      </span>
    </Link>
  );
}
