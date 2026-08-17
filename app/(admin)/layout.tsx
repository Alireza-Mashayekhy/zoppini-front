import { decodeJwt } from 'jose';
import { Metadata } from 'next';
import { cookies } from 'next/headers';

import AdminSidebar from '@/components/layout/admin/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  let roleArray: string[] = [];

  if (token) {
    try {
      const payload = decodeJwt(token);

      const roles = payload.roles as string[] | string | undefined;

      if (Array.isArray(roles)) {
        roleArray = roles;
      } else if (typeof roles === 'string') {
        roleArray = [roles];
      }
    } catch {
      roleArray = [];
    }
  }

  const isAdmin = roleArray.includes('admin');
  const isSeo = roleArray.includes('seo');

  return (
    <SidebarProvider>
      <AdminSidebar isAdmin={isAdmin} isSeo={isSeo} />

      <SidebarInset className="bg-border">
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
