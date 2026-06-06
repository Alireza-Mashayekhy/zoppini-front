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

export interface UserResponse {
  fullName: string[];
  roles: string[];
  birthDate: Date;
  id: number;
}
