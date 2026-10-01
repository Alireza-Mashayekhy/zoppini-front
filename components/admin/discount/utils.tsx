import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';

export function toPersianDate(value?: string | Date | null) {
  if (!value) {
    return '';
  }

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

export function persianDateToISO(value: string, isEndOfDay = false) {
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

  if (isEndOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(value));
}

export function formatPrice(value: number) {
  return `${formatNumber(value)} تومان`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
