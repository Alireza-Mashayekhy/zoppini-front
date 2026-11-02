export interface sendOtpDto {
  phone: string;
}

/**
 * محتوای `data`ی پاسخ `/auth/send-otp` (بعد از ResponseInterceptor).
 * `expiresIn` همان TTL کد فعال است و دقیقاً زمان مجاز ارسال مجدد هم هست.
 */
export interface sendOtpResponse {
  sent: boolean;
  alreadySent: boolean;
  expiresIn: number;
}

export interface LoginDto {
  phone: string;
  code: string;
}

export interface LoginResponse {
  /** کاربری با این شماره وجود ندارد → فرانت باید اطلاعات ثبتنام را بگیرد */
  signupRequired?: boolean;
  /** ثانیههای باقیمانده از کدی که هنوز مصرف نشده */
  expiresIn?: number;
  message?: string;
}

export interface ForgetPasswordDto {
  phone: string;
}

export interface ResetPasswordDto {
  phone: string;
  code: string;
  newPassword: string;
}

export interface LoginWithPasswordDto {
  phone: string;
  password: string;
}

export interface SignUpDto {
  phone: string;
  password: string;
  fullName: string;
  /** اختیاری — اگر خالی باشد ارسال نمیشود */
  email?: string | null;
  birthDate?: string;
  code: string;
}
