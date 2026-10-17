'use client';

import { Crown, RefreshCcw, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatPrice } from '@/lib/utils';
import { useClubLevels, useClubMe } from '@/services/features/club/hooks';
import { LoyaltyLevel } from '@/services/features/club/type';

const sortByPriority = (levels: LoyaltyLevel[]) =>
  [...levels].sort((a, b) => (a.Prioprity ?? 0) - (b.Prioprity ?? 0));

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

  const levels = sortByPriority(levelsData.data);

  if (levels.length === 0) {
    return null;
  }

  const totalPoint = meData?.data?.TotalPoint ?? 0;

  const currentLevel =
    levels.find(
      level =>
        totalPoint >= (level.FromPoint ?? 0) &&
        (level.ToPoint == null || totalPoint <= level.ToPoint),
    ) ?? null;

  const nextLevel =
    levels.find(level => (level.FromPoint ?? 0) > totalPoint) ?? null;

  const progress = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalPoint - (currentLevel?.FromPoint ?? 0)) /
            ((nextLevel.FromPoint ?? 1) - (currentLevel?.FromPoint ?? 0))) *
            100,
        ),
      )
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
            {nextLevel && ` از ${formatPrice(nextLevel.FromPoint ?? 0)}`}
          </span>
          {nextLevel && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              {formatPrice((nextLevel.FromPoint ?? 0) - totalPoint)} امتیاز تا{' '}
              {nextLevel.Title}
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
        {levels.map(level => {
          const isCurrent = currentLevel?.Id === level.Id;

          return (
            <div
              key={level.Id}
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
                از {formatPrice(level.FromPoint ?? 0)} تا{' '}
                {level.ToPoint != null ? formatPrice(level.ToPoint) : '∞'} امتیاز
              </p>

              {level.Description && (
                <p className="mt-2 text-xs text-gray-400">{level.Description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
