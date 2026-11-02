/**
 * helpers مشترک پنجره‌ی کد تأیید.
 *
 * زمان انقضای کد و زمان مجاز «ارسال مجدد» در بکاند یکی است و مقدار دقیق
 * ثانیههای باقیمانده در پاسخ `send-otp` برگردانده میشود. فرانت نباید عدد
 * ثابت خودش را به جای آن بگذارد، وگرنه تایمر با کد واقعی هماهنگ نمیماند.
 */

/** همخوان با `OTP_TTL` در `back/src/otp/otp.service.ts`؛ فقط fallback است. */
export const OTP_TTL_SECONDS = 120;

export interface OtpWindow {
  /** پیامک جدید ارسال شد */
  sent: boolean;
  /** کد قبلی هنوز معتبر است و پیامکی ارسال نشد */
  alreadySent: boolean;
  /** ثانیههای باقیمانده تا انقضای کد == تا امکان ارسال مجدد */
  expiresIn: number;
}

interface OtpResponseLike {
  data?: {
    sent?: boolean;
    alreadySent?: boolean;
    expiresIn?: number;
  };
}

export function readOtpWindow(payload: unknown): OtpWindow {
  const data = (payload as OtpResponseLike | null | undefined)?.data;
  const seconds = data?.expiresIn;

  const expiresIn =
    typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
      ? Math.ceil(seconds)
      : OTP_TTL_SECONDS;

  const alreadySent = Boolean(data?.alreadySent);

  return {
    sent: data?.sent ?? !alreadySent,
    alreadySent,
    expiresIn,
  };
}

/** پیام خطای قابل نمایش (پاسخ نست، ValidationPipe یا خطای شبکه). */
export function otpErrorMessage(
  error: unknown,
  fallback = 'خطا در ارسال کد',
): string {
  const response = (error as { response?: { data?: { message?: unknown } } })
    ?.response;
  const raw = Array.isArray(response?.data?.message)
    ? (response?.data?.message as unknown[]).join(' ')
    : (response?.data?.message ?? (error as { message?: unknown })?.message);

  return typeof raw === 'string' && raw ? raw : fallback;
}

/**
 * نسخههای قدیمی بکاند (یا پاسخ 429 پراکسی) همچنان «صبر کنید» میدهند.
 * این حالت خطا نیست: کد قبلی معتبر است، فقط نباید پیامک تازهای برود.
 */
export function isAlreadySentError(error: unknown): boolean {
  return /کد قبلا|کد قبلی|صبر کنید|درخواست مجدد/i.test(
    otpErrorMessage(error),
  );
}

/** کد منقضی/تلاشها تمام شده → کاربر باید کد تازهای بگیرد. */
export function isOtpExpiredError(error: unknown): boolean {
  return /منقضی|تلاش‌های مجاز تمام شده/i.test(otpErrorMessage(error));
}
