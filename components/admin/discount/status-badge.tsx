import { Discount } from '@/services/features/discounts/types';

export default function DiscountStatusBadge({
  discount,
}: {
  discount: Discount;
}) {
  const now = new Date();

  const startsAt = new Date(discount.startsAt);
  const expiresAt = new Date(discount.expiresAt);

  let label = 'فعال';
  let className = 'bg-green-100 text-green-700';

  if (!discount.isActive) {
    label = 'غیرفعال';
    className = 'bg-gray-100 text-gray-600';
  } else if (now < startsAt) {
    label = 'شروع نشده';
    className = 'bg-yellow-100 text-yellow-700';
  } else if (now > expiresAt) {
    label = 'منقضی شده';
    className = 'bg-red-100 text-red-700';
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
