import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('relative w-[140px] h-[33px] block', className)}
    >
      <Image
        src="/logo/ZOPPINI.webp"
        fill
        alt="زوپینی"
        sizes="140px"
        priority
        className="object-cover"
      />
    </Link>
  );
}
