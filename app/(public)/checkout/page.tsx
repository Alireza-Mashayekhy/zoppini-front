// app/checkout/page.tsx
import CheckoutForm from '@/components/pages/checkout/checkout-form';
import { getMe } from '@/services/features/auth/server.api';

export default async function CheckoutPage() {
  let user = null;
  try {
    const response = await getMe();
    user = response?.data || null;
  } catch {
    user = null;
  }

  return (
    <div className="min-h-screen pt-[52px]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-light tracking-wide mb-8">تکمیل سفارش</h1>
        <CheckoutForm initialUser={user} />
      </div>
    </div>
  );
}
