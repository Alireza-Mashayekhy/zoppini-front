'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';

export default function Header() {
  return (
    <header className="h-16 px-8 flex items-center justify-end border-b border-[#E8DCCC] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm font-medium text-[#1A1A1A]">رضا محمدی</p>
          </div>
          <Avatar className="w-10 h-10 ring-2 ring-[#E8DCCC]">
            <AvatarImage src="/avatar.jpg" />
          </Avatar>
        </div>
      </div>
    </header>
  );
}
