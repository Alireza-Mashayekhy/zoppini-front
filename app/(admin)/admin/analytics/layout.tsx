import { decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Navigation hint only, matching existing panel. API independently verifies JWT + Admin role.
export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('access_token')?.value;
  let roles: unknown;
  try {
    roles = token ? decodeJwt(token).roles : [];
  } catch {
    roles = [];
  }
  if (!(Array.isArray(roles) ? roles : [roles]).includes('admin'))
    redirect('/dashboard');
  return children;
}
