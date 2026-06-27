// components/layout/auth/sidebar.tsx
import Image from 'next/image';

import Logo from '@/components/shared/logo';

export default function SidebarAuth() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        fill
        src="/home/5 (5).jpg"
        alt="auth sidebar"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />{' '}
      <div className="absolute space-y-4 top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-background/10 border border-white/20 backdrop-blur-md py-12 px-8 rounded-lg w-[80%] max-w-md text-center">
        <Logo className="w-[180px] mx-auto" />
        <h2 className="text-2xl font-light  tracking-wide">خوش آمدید</h2>
        <p className="text-sm leading-relaxed font-light">
          به جمع <span className="font-medium mx-px">ZOPPINI</span> بپیوندید.
          <br />
          جایی که استایل با اصالت همراه می‌شود.
        </p>
        <div className="w-12 h-px bg-black/40 mx-auto" />
        <p className="text-xs font-light tracking-wider">
          دنیای مد را با ما تجربه کنید
        </p>
      </div>
    </div>
  );
}
