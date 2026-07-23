import { Suspense } from 'react';

import PaymentResultContent from '@/components/pages/checkout/payment-result-content';

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20">در حال بارگذاری...</div>}
    >
      <PaymentResultContent />
    </Suspense>
  );
}
