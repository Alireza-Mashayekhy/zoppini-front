import { type ClassValue, clsx } from 'clsx';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Math.floor(num).toLocaleString();
};

export function toPersianDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;

  const month = parts.find(part => part.type === 'month')?.value;

  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return '';
  }

  return `${year}/${month}/${day}`;
}

export function persianDateToISO(value: string) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('/').map(Number);

  if (!year || !month || !day) {
    return '';
  }

  const date = new DateObject({
    calendar: persian,
    year,
    month,
    day,
  }).toDate();

  return date.toISOString();
}
