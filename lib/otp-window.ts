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

const INTERNAL_ERROR_PATTERN =
  /internal server error|request failed with status code|queryfailederror|unknown column|er_[a-z0-9_]+|sqlstate|syntaxerror|typeerror|referenceerror|econnrefused|secretorprivatekey/i;

function hasPersianText(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

export function sanitizeOtpCodeInput(value: string): string {
  return value
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '')
    .slice(0, 5);
}

/** پیام خطای قابل نمایش (پاسخ نست، ValidationPipe یا خطای شبکه) بدون افشای جزئیات داخلی سرور. */
export function otpErrorMessage(
  error: unknown,
  fallback = 'خطا در ارسال کد',
): string {
  const errObj = error as {
    code?: string;
    message?: unknown;
    response?: { status?: number; data?: { message?: unknown } };
  };
  const status = errObj?.response?.status;
  const responseData = errObj?.response?.data;
  const raw = Array.isArray(responseData?.message)
    ? (responseData.message as unknown[]).join(' ')
    : (responseData?.message ?? errObj?.message);

  const text = typeof raw === 'string' ? raw.trim() : '';

  if (
    !errObj?.response &&
    (errObj?.code === 'ERR_NETWORK' ||
      errObj?.code === 'ECONNABORTED' ||
      /^network error$/i.test(text) ||
      /^timeout of \d+ms exceeded$/i.test(text))
  ) {
    return 'ارتباط با سرور برقرار نشد؛ لطفاً اتصال اینترنت خود را بررسی کنید';
  }

  if (status === 429 && (!text || !hasPersianText(text))) {
    return 'تعداد درخواست‌های شما بیش از حد مجاز است؛ لطفاً کمی صبر کنید';
  }

  if (status === 401 && (!text || !hasPersianText(text))) {
    return 'احراز هویت ناموفق بود؛ لطفاً دوباره تلاش کنید';
  }

  if (
    (typeof status === 'number' && status >= 500) ||
    (text && INTERNAL_ERROR_PATTERN.test(text))
  ) {
    if (
      (status === 502 || status === 503) &&
      text &&
      hasPersianText(text) &&
      !INTERNAL_ERROR_PATTERN.test(text)
    ) {
      return text;
    }

    return 'خطایی در سرور رخ داده است؛ لطفاً چند لحظه دیگر دوباره تلاش کنید';
  }

  return text ? text : fallback;
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
