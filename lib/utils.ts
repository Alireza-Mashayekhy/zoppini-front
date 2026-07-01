import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Math.floor(num).toLocaleString();
};
