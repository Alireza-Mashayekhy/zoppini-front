/**
 * تایپ‌های باشگاه مشتریان دایاتک (DayaClub)
 * بر اساس مستند «موجودیت‌ها، قوانین و سرویس‌های وفاداری» دایاتک
 */

export interface ClubCoupon {
  Id: number;
  /** 1 = عمومی، 2 = خصوصی */
  CouponTypeIndex: number;
  Title: string;
  Code: string;
  IsActive: boolean;
  IsSystem: boolean;
  CouponPrice: number;
  SerialNumber?: number | null;
  /** 1 = درصدی، 2 = مبلغی */
  DiscountTypeIndex: number;
  DiscountValue: number;
  /** 1 = بازه زمانی، 2 = تعداد روز بعد از تخصیص */
  ExpireTypeIndex: number;
  StartDate?: string | null;
  ExpireDate?: string | null;
  ExpireDaysAfterAssignment?: number | null;
  MaximumDiscountPrice?: number | null;
  MinimumOrderPrice?: number | null;
  NumberOfUse?: number | null;
  NumberOfUsePerCustomer?: number | null;
  IsUseAlone: boolean;
  OfficeId?: number | null;
  IsUsed: boolean;
  CreateDate?: string;
}

export interface ClubWallet {
  Id: number;
  OfficeId?: number | null;
  WalletId?: number | null;
  /** اعتبار موجود در کیف پول (ریال) */
  AvailableCredit: number;
}

export interface ClubCustomer {
  Id?: number;
  FirstName: string;
  LastName: string;
  /** کد مشتری = شماره موبایل */
  CustomerCode: string;
  OfficeId?: number | null;
  GenderType?: string | null;
  BirthDate?: string | null;
  /** امتیاز کل */
  TotalPoint?: number;
  /** اعتبار کل قابل استفاده (ریال) */
  AvailableCredit?: number;
  CardNumber?: string | null;
  Email?: string | null;
  NationalCode?: string | null;
  StateName?: string | null;
  CityName?: string | null;
  Address?: string | null;
  RegisterDate?: string | null;
  Coupons?: ClubCoupon[];
  ExtendedProperties?: Array<{ Name: string; Value: string }>;
  Categories?: string[];
  Tags?: string[];
  Wallets?: ClubWallet[];
}

export interface LoyaltyHistory {
  Id: number;
  Date: string;
  PersianDate?: string;
  ProgramTypeIndex: number;
  ProgramType?: string;
  Point?: number | null;
  PersianPoint?: string | null;
  Credit?: number | null;
  PersianCredit?: string | null;
  PriceListId?: number | null;
  PriceListName?: string | null;
  CouponId?: number | null;
  CouponName?: string | null;
  LuckyWheelHistoryId?: number | null;
  Description?: string | null;
  CustomerId?: number | null;
  CustomerFullName?: string | null;
  OfficeId?: number | null;
  OfficeName?: string | null;
  WalletWithOfficeName?: {
    Wallet?: string | null;
    Office?: string | null;
  } | null;
  RelatedCustomerActivityId?: number | null;
  RelatedActivity?: string | null;
  /** باقیمانده اعتبار مشتری بعد از این تراکنش (ریال) */
  CustomerRemainingCredit?: number | null;
  PersianCustomerRemainingCredit?: string | null;
  CreditExpireDate?: string | null;
  PersianCreditExpireDate?: string | null;
  IsExpireCredit?: boolean;
}

export interface LoyaltyLevel {
  Id: number;
  Title: string;
  FromPoint?: number | null;
  ToPoint?: number | null;
  /** غلط املایی موجود در مستند دایاتک */
  Prioprity?: number;
  Description?: string | null;
}

/**
 * تراکنش کیف پول باشگاه
 * (فیلدهای این DTO در مستند دایاتک جدول ندارند؛ فیلدها منعطف تعریف شده‌اند)
 */
export interface ClubWalletTransaction {
  Id: number;
  CustomerWalletId?: number;
  [key: string]: unknown;
}

/** پرداخت/دریافت باشگاه (فیلدها منعطف، مستند جدول ندارد) */
export interface ClubPayment {
  Id: number;
  CustomerId?: number;
  [key: string]: unknown;
}

// ============================================================
// Helpers
// ============================================================

/**
 * مبالغ دایاتک بر حسب ریال است (فاکتورها هنگام ثبت ×10 می‌شوند)
 * و در خروجی به تومان نمایش داده می‌شود.
 */
export const rialToToman = (rial: number | null | undefined): number =>
  Math.round((Number(rial) || 0) / 10);

/**
 * انتخاب اولین فیلد موجود از یک آبجکت با چند نام کاندید
 * (برای DTOهایی که جدول فیلدشان در مستند نیامده است)
 */
export const pickField = <T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
): T | undefined => {
  if (!obj) return undefined;

  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }

  return undefined;
};
