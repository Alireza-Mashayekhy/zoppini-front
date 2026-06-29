export interface sendOtpDto {
  phone: string;
}

export interface sendOtpResponse {
  code: string;
}

export interface LoginDto {
  phone: string;
  code: string;
}

export interface LoginResponse {
  user: string[];
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
  email: string;
  birthDate: string;
  code: string;
}
