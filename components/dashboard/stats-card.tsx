import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatsCard({ label, value, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border p-6 transition-all hover:shadow-sm',
        className,
      )}
    >
      <p className="text-sm text-[#8A8580] tracking-wider">{label}</p>
      <p className="text-3xl font-light text-[#1A1A1A] mt-2">{value}</p>
    </div>
  );
}
