import { Suspense } from 'react';

import PaymentSelectionContent from '@/components/pages/checkout/payment-section-content';

export default function PaymentSelectionPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-10">در حال بارگذاری...</div>}
    >
      <PaymentSelectionContent />
    </Suspense>
  );
}
