import SidebarAuth from '@/components/layout/auth/sidebar';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-screen w-screen overflow-hidden">
      <div className="hidden md:block md:col-span-2">
        <SidebarAuth />
      </div>
      <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center p-4 md:p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
