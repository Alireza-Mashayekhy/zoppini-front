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
