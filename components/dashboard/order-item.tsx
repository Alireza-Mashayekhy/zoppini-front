// components/dashboard/order-item.tsx
import { cn } from '@/lib/utils';

// نگاشت وضعیت به رنگ و استایل
const statusStyles: Record<string, string> = {
  'ارسال شده': 'text-[#D4A373] bg-[#FBF7F0] border border-[#D4A373]',
  'در انتظار پرداخت': 'text-[#8A8580] bg-[#F5F0EB]',
  'تحویل شده': 'text-[#1A1A1A] bg-[#E8DCCC]',
  'در حال آماده‌سازی': 'text-[#D4A373] bg-[#FBF7F0] border border-[#D4A373]',
};

interface OrderItemProps {
  product: string;
  price: number;
  status: keyof typeof statusStyles;
}

export function OrderItem({ product, price, status }: OrderItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#E8DCCC] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{product}</p>
        <p className="text-xs text-[#8A8580]">{price.toLocaleString()} تومان</p>
      </div>
      <span
        className={cn(
          'text-xs px-3 py-1 rounded-full',
          statusStyles[status] || 'text-[#8A8580] bg-[#F5F0EB]',
        )}
      >
        {status}
      </span>
    </div>
  );
}
