'use client';

import { Crown, RefreshCcw, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatPrice } from '@/lib/utils';
import { useClubLevels, useClubMe } from '@/services/features/club/hooks';
import { asArray, toNumber } from '@/services/features/club/normalize';
import { LoyaltyLevel } from '@/services/features/club/type';

/**
 * مرتب‌سازی سطوح بر اساس اولویت (`Prioprity` - غلط املایی مستند دایاتک).
 * اگر اولویت‌ها برابر/خالی باشند، ترتیب از `FromPoint` تعیین می‌شود تا
 * سطح فعلی و نوار پیشرفت همیشه منطقی نمایش داده شوند.
 */
const sortByPriority = (levels: LoyaltyLevel[]) =>
  [...levels].sort(
    (a, b) =>
      toNumber(a.Prioprity) - toNumber(b.Prioprity) ||
      toNumber(a.FromPoint) - toNumber(b.FromPoint),
  );

/**
 * سطوح وفاداری باشگاه + سطح فعلی کاربر بر اساس امتیاز
 */
export default function ClubLevels() {
  const {
    data: levelsData,
    isLoading: levelsLoading,
    isError,
    refetch,
    isFetching,
  } = useClubLevels();
  const { data: meData, isLoading: meLoading } = useClubMe();

  if (levelsLoading || meLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  if (isError || !levelsData?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-8 text-center">
        <Crown className="h-8 w-8 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">اطلاعات سطوح وفاداری دریافت نشد</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const levels = sortByPriority(asArray<LoyaltyLevel>(levelsData.data));

  if (levels.length === 0) {
    return null;
  }

  const totalPoint = toNumber(meData?.data?.TotalPoint);

  const currentLevel =
    levels.find(
      level =>
        totalPoint >= toNumber(level.FromPoint) &&
        (level.ToPoint == null || totalPoint <= toNumber(level.ToPoint)),
    ) ?? null;

  const nextLevel =
    levels.find(level => toNumber(level.FromPoint) > totalPoint) ?? null;

  const currentFromPoint = toNumber(currentLevel?.FromPoint);
  const nextFromPoint = toNumber(nextLevel?.FromPoint);
  const levelSpan = nextFromPoint - currentFromPoint;

  const progress = nextLevel
    ? levelSpan > 0
      ? Math.min(
          100,
          Math.max(0, ((totalPoint - currentFromPoint) / levelSpan) * 100),
        )
      : 100
    : 100;

  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-light tracking-wide">سطح وفاداری</h2>

        {currentLevel && (
          <span className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-xs text-white">
            <Crown className="h-3.5 w-3.5" strokeWidth={1.5} />
            سطح فعلی: {currentLevel.Title}
          </span>
        )}
      </div>

      {/* پیشرفت تا سطح بعد */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {formatPrice(totalPoint)} امتیاز
            {nextLevel && ` از ${formatPrice(toNumber(nextLevel.FromPoint))}`}
          </span>
          {nextLevel && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              {formatPrice(
                Math.max(toNumber(nextLevel.FromPoint) - totalPoint, 0),
              )}{' '}
              امتیاز تا {nextLevel.Title}
            </span>
          )}
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-800 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* لیست سطوح */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => {
          const isCurrent = currentLevel?.Id === level.Id;

          return (
            <div
              key={level.Id ?? `level-${index}`}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                isCurrent
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-border bg-white',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{level.Title}</p>
                {isCurrent && (
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-white">
                    فعلی
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                از {formatPrice(toNumber(level.FromPoint))} تا{' '}
                {level.ToPoint != null
                  ? formatPrice(toNumber(level.ToPoint))
                  : '∞'}{' '}
                امتیاز
              </p>

              {level.Description && (
                <p className="mt-2 text-xs text-gray-400">
                  {level.Description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
